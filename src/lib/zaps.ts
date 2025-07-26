import { cacheRequest, eventStore, keepAliveRequest, profileLoader, relays, signEvent } from "$lib";
import { getZapPayment, getZapSender, type ParsedInvoice } from "applesauce-core/helpers";
import { createZapsLoader } from "applesauce-loaders/loaders";
import { filter, from, map, of, scan, switchMap, take } from "rxjs";
import { type Event } from "nostr-tools";
import { getProfileContent, parseLNURLOrAddress } from "applesauce-core/helpers";
import { bech32 } from '@scure/base';

export interface ParsedZapEvent {
  payment: ParsedInvoice;
  sender: string;
  message?: string;
  amount: number;
}

export const zapsLoader = createZapsLoader({
  request: keepAliveRequest
}, {
  eventStore,
  cacheRequest,
});

export const zapsForEvent = (event: Event) => zapsLoader(event, relays).pipe(
  map(z => ({
    payment: getZapPayment(z),
    sender: getZapSender(z),
  })),
  map(z => ({
    ...z,
    message: z.payment?.description,
    amount: z.payment?.amount ? Math.round(z.payment.amount / 1000) : 0
  } as ParsedZapEvent)),
  scan((acc, zap) => [...acc, zap], [] as ParsedZapEvent[]),
  map(zaps => zaps.sort((a, b) => b.amount - a.amount))
);

function toLNURL(address: string) {
  let [name, domain] = address.split('@');
  if (!name || !domain) return;
  const url = `https://${domain}/.well-known/lnurlp/${name}`;
  const bytes = new TextEncoder().encode(url);
  const words = bech32.toWords(bytes);
  return bech32.encode('lnurl', words, false);
}

export function getZapInvoice(event: Event, zapAmount: number, zapComment: string) {

  let lightningAddress = profileLoader(event.pubkey).pipe(
    map(getProfileContent),
    map((p) => p.lud16 || p.lud06),
    filter((p): p is string => typeof p === 'string')
  );
  let lightningUrl = lightningAddress.pipe(
    map(parseLNURLOrAddress),
    filter((u) => typeof u !== 'undefined')
  );
  let lnUrl = lightningUrl.pipe(
    switchMap((url) => from(fetch(url).then((res) => res.json()))),
    switchMap((response) => {
      if (response.allowsNostr === true) {
        return lightningAddress.pipe(
          take(1),
          map((addr) => toLNURL(addr))
        );
      }
      return of(null);
    }),
    filter((lnurl) => lnurl !== null)
  );
  const zapRequest = lnUrl.pipe(
    switchMap((lnurl) =>
      from(
        signEvent({
          kind: 9734,
          content: zapComment.substring(0, 200),
          created_at: Math.round(Date.now() / 1000),
          tags: [
            ['relays', ...relays],
            ['amount', (zapAmount * 1000).toString()],
            ['lnurl', lnurl],
            ['p', event.pubkey],
            ['e', event.id],
            ['comment', zapComment.substring(0, 200)]
          ]
        })
      ).pipe(map((signedEvent) => encodeURI(JSON.stringify(signedEvent))))
    )
  );

  return lightningUrl.pipe(
    switchMap((url) =>
      from(fetch(url).then((res) => res.json() as Promise<{ callback: string }>))
    ),
    switchMap(({ callback }) =>
      zapRequest.pipe(
        switchMap((zapRequest) =>
          lnUrl.pipe(
            switchMap((lnUrl) =>
              from(
                fetch(
                  `${callback}?amount=${zapAmount * 1000}&nostr=${zapRequest}&lnurl=${lnUrl}`
                ).then((res) => res.json() as Promise<{ pr: string; verify: string; }>)
              )
            )
          )
        )
      )
    ),
    map(({ pr, verify }) => ({ invoice: pr, verify: verify }))
  );
}
