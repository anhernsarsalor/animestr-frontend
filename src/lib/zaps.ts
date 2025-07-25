import { cacheRequest, eventStore, pool, relays } from "$lib";
import { getZapPayment, getZapSender, type ParsedInvoice } from "applesauce-core/helpers";
import { createZapsLoader } from "applesauce-loaders/loaders";
import { map, toArray } from "rxjs";
import { type Event } from "nostr-tools";

export interface ParsedZapEvent {
  payment: ParsedInvoice;
  sender: string;
  message?: string;
  amount: number;
}

export const zapsLoader = createZapsLoader(pool, {
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
  toArray(),
  map(zaps => zaps.sort((a, b) => b.amount - a.amount))
);
