import { EventStore } from "applesauce-core";
import { createAddressLoader, createEventLoader, createReactionsLoader, createTagValueLoader, createTimelineLoader, createZapsLoader } from "applesauce-loaders/loaders";
import { RelayPool } from "applesauce-relay";
import type { Event, Filter } from "nostr-tools";
import { openDB, getEventsForFilters, addEvents } from "nostr-idb";
import { bufferTime, distinctUntilChanged, distinctUntilKeyChanged, filter, from, map, mergeMap, of, scan, startWith, switchMap, take } from "rxjs";
import { getZapPayment, getZapSender, isFromCache, type ParsedInvoice } from "applesauce-core/helpers";
import { writable } from "svelte/store";
import { animeScore, normalizeWatchStatus, WatchStatus } from "./utils.svelte";
import parseAnimeEvent from "./nostr/parseAnimeEvent";
import type { AnimeData } from "./nostr/types";
import { EventFactory, type EventFactoryTemplate, type EventOperation } from "applesauce-factory";
import { ExtensionSigner } from "applesauce-signers";

const cache = await openDB();

export const eventStore = new EventStore();

const pool = new RelayPool();
export const relays = [
  "wss://relay.nostr.band",
  "wss://anime.nostr1.com",
  "wss://relay.nostr.wirednet.jp",
  "wss://at.nostrworks.com",
  "wss://atlas.nostr.land",
  "wss://wot.utxo.one",
  "wss://relay.damus.io",
];

eventStore.insert$
  .pipe(
    filter((e) => !isFromCache(e)),
    bufferTime(1_000),
    filter((b) => b.length > 0),
  )
  .subscribe((events) => {
    addEvents(cache, events).then(() => {
      console.log("Saved events to cache", events.length);
    });
  });

const signer = new ExtensionSigner();
const eventFactory = new EventFactory({
  signer,
  client: {
    name: "animestr",
    address: { identifier: "animestr", pubkey: "c5d3f2d17cde84c4d84a8148df2dfc9cd520fc82ddd76284ff3b6e3e37f31eb2" },
  },
});

export async function createEvent(template: EventFactoryTemplate, ...operations: (EventOperation | undefined)[]) {
  const note = await eventFactory.build(template, ...operations)
  const signed = await eventFactory.sign(note);
  pool.publish(relays, signed).subscribe({
    next(publishResponse) {
      if (publishResponse.ok) {
        eventStore.add(signed)
        return;
      }
      console.log(`Failed to publish event to ${publishResponse.from}: ${publishResponse.message}`);
    }
  });
}

const cacheRequest = (filters: Filter[]) => getEventsForFilters(cache, filters);

export const addressLoader = createAddressLoader(pool, {
  eventStore,
  cacheRequest,
});

export const eventsLoader = createEventLoader(pool, {
  eventStore,
  cacheRequest,
});

export const zapsLoader = createZapsLoader(pool, {
  eventStore,
  cacheRequest,
});

export const reactionsLoader = createReactionsLoader(pool, {
  eventStore,
  cacheRequest
});
export const iTagLoader = createTagValueLoader(pool, "i", {
  cacheRequest,
  eventStore
});

export const allAnimeEvents = createTimelineLoader(pool, relays, [{
  kinds: [30010],
  '#t': ['animestr'],
}], {
  cache: cacheRequest,
  eventStore
})(0).pipe(
  map(parseAnimeEvent),
  filter(e => e !== null),
);

export function animeLoaderWithFilter(filterString: string, limit: number = 10) {
  const lowerFilter = filterString.toLowerCase();
  return allAnimeEvents.pipe(
    filter(a => a.title.toLowerCase().includes(lowerFilter) || a.altTitles.some(t => t.toLowerCase().includes(lowerFilter)) || a.identifiers.some(x => x.value.includes(lowerFilter))),
    take(limit),
    scan((events, event) => [...events, event], [] as AnimeData[])
  );
}

export const timelineLoader = (...filters: Filter[]) => createTimelineLoader(pool, relays, filters, {
  cache: cacheRequest,
  eventStore,
})().pipe(
  scan((events, event) => [...events, event].toSorted((a, b) => b.created_at - a.created_at), [] as Event[]),
  startWith([])
)

export function profileLoader(userPub: string) {
  return addressLoader({
    kind: 0,
    pubkey: userPub,
    relays
  })
}

export function animeEventLoader(identifier: string) {
  return iTagLoader({
    value: identifier,
    relays
  }).pipe(filter(
    e => e.kind === 30010
  ), map(parseAnimeEvent));
}

export function eventLoader(eventId: string) {
  return eventsLoader({
    id: eventId,
    relays
  });
}

export interface ParsedZapEvent {
  payment: ParsedInvoice;
  sender: string;
  message?: string;
  amount: number;
}

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
  scan((zaps: ParsedZapEvent[], zap: ParsedZapEvent) => [...zaps, zap], []),
  map(zaps => zaps.sort((a, b) => b.amount - a.amount))
);

export interface AnimeEntry {
  identifier: string;
  score: ReturnType<typeof animeScore>;
  status: WatchStatus;
  progress: number;
  anime: AnimeData | null;
}

export function normalizeProgress(progress?: string | number) {
  if (typeof progress === "undefined" || progress === null) return 0;
  if (typeof progress === "number")
    if (progress > 0 && !isNaN(progress)) return progress;
  const progressNumber = Number.parseInt(progress.toString())
  if (isNaN(progressNumber)) return 0;
  if (progressNumber < 0) return 0;
  return progressNumber;
}

export const watchListLoader = (userPub: string) =>
  addressLoader({
    kind: 31111,
    identifier: 'anime-list',
    pubkey: userPub,
  }).pipe(
    map(watchList => watchList.tags
      .filter(tag => tag[0] === 'i')
      .map(tag => ({
        identifier: tag[1],
        score: animeScore(tag[2]),
        status: normalizeWatchStatus(tag[3]),
        progress: normalizeProgress(tag[4])
      }))
    ),
    mergeMap(sortedList => from(sortedList).pipe(
      distinctUntilKeyChanged('identifier'),
      mergeMap(entry => animeEventLoader(entry.identifier).pipe(
        map(animeData => ({
          identifier: entry.identifier,
          score: entry.score,
          status: entry.status,
          anime: animeData,
          progress: entry.progress,
        }))
      ))
    )),
    filter(x => x.anime !== null),
    distinctUntilChanged((a: AnimeEntry, b: AnimeEntry) => a.identifier === b.identifier),
    scan((acc, curr) => [...acc, curr], [] as AnimeEntry[]),
    map(entries => entries.toSorted((a, b) => {
      if (a.status !== b.status) return a.status - b.status;
      if (a.score !== b.score) return b.score.value - a.score.value;
      return b.identifier.localeCompare(a.identifier);
    })),
    startWith([] as AnimeEntry[])
  );

export type ReactionEmoji = { type: 'simple', emoji: string } | { type: 'custom', emoji: string; url: string };

export const reactionsForEvent = (event: Event) => reactionsLoader(event, relays).pipe(
  map(r => {
    let emoji: ReactionEmoji;
    const emojiTags = r.tags.filter((x) => x[0] === 'emoji');
    if (emojiTags.length === 1) {
      const [, emojiName, url] = emojiTags[0]!;
      emoji = {
        type: 'custom',
        emoji: emojiName,
        url
      }
    } else {
      emoji = {
        type: 'simple',
        emoji: r.content === '+' || r.content === '' ? '❤️' : r.content
      }
    }
    return {
      emoji,
      author: r.pubkey
    }
  }),
  scan((acc, event) => {
    const { emoji, author } = event;
    const existingIndex = acc.findIndex(item => JSON.stringify(item.emoji) === JSON.stringify(emoji));

    if (existingIndex !== -1) {
      if (!acc[existingIndex].authors.includes(author))
        acc[existingIndex].authors.push(author);
    } else
      acc.push({ emoji, authors: [author] });

    return acc;
  }, [] as Array<{ emoji: { type: string; emoji?: string; url?: string; }, authors: string[] }>)
)

export const contentEditsLoader = (event: Event) => createTimelineLoader(pool, relays, {
  kinds: [1010],
  authors: [event.pubkey],
  '#e': [event.id]
})().pipe(
  filter((e) => e.tags.some((t) => t[0] === 'alt' && t[1] === 'Content Change Event')),
  scan((events, event) => [...events, event].toSorted((a, b) => b.created_at - a.created_at), [] as Event[]),
  map(events => events[0])
)

let translationApiKey = (() => {
  let translationApiKey = '';
  return async () => {
    if (translationApiKey) return translationApiKey;
    const eventData = {
      "content": "Auth to get Jumble translation service account",
      "kind": 27235,
      "created_at": Math.floor(Date.now() / 1000),
      "tags": [
        [
          "u",
          "https://api.jumble.social/v1/translation/account"
        ],
        [
          "method",
          "get"
        ]
      ]
    };
    const note = await eventFactory.build(eventData)
    const signed = await eventFactory.sign(note);
    const keyRequest = await fetch("https://api.jumble.social/v1/translation/account", {
      headers: {
        Authorization: `Nostr ${btoa(JSON.stringify(signed))}`
      }
    })
    const keyResponse = await keyRequest.json();
    translationApiKey = keyResponse.api_key;
    return translationApiKey;
  }
})();

export async function getTranslation(content: string, target: string) {
  const key = await translationApiKey();
  const req = await fetch('https://api.jumble.social/v1/translation/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      q: content,
      target,
      api_key: key
    })
  });
  const resp = await req.json();
  if (resp.code === "01002") {
    const tx = await fetch('https://api.jumble.social/v1/transactions', {
      body: JSON.stringify({
        "pubkey": "f7a0388ce16e7955a104572c9222ed8d7b61fa047844d1f7bada67f6f561ea8b",
        "purpose": "translation",
        "amount": Math.floor(Math.max(1000, content.length / 100))
      })
    })
    throw {
      message: "Not enough funds",
      tx
    };
  }
  return resp.translatedText;
}
