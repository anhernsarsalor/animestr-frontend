import { EventStore } from "applesauce-core";
import { createAddressLoader, createEventLoader, createReactionsLoader, createTagValueLoader, createTimelineLoader, createZapsLoader } from "applesauce-loaders/loaders";
import { RelayPool } from "applesauce-relay";
import type { Event, Filter } from "nostr-tools";
import { openDB, getEventsForFilters, addEvents } from "nostr-idb";
import { bufferTime, distinctUntilKeyChanged, filter, from, map, mergeMap, scan, take, tap, toArray } from "rxjs";
import { getZapPayment, getZapSender, isFromCache, type ParsedInvoice } from "applesauce-core/helpers";
import { readonly, writable } from "svelte/store";
import { animeScore, normalizeWatchStatus, WatchStatus } from "./utils.svelte";
import parseAnimeEvent from "./nostr/parseAnimeEvent";
import type { AnimeData } from "./nostr/types";
import { EventFactory, type EventFactoryTemplate, type EventOperation } from "applesauce-factory";
import { ExtensionSigner } from "applesauce-signers";

const cache = await openDB();

export const eventStore = new EventStore();

const pool = new RelayPool();
const relays = [
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

function cacheRequest(filters: Filter[]) {
  return getEventsForFilters(cache, filters);
}

const addressLoader = createAddressLoader(pool, {
  eventStore,
  cacheRequest,
});

const eventsLoader = createEventLoader(pool, {
  eventStore,
  cacheRequest,
});

const zapsLoader = createZapsLoader(pool, {
  eventStore,
  cacheRequest,
});

const reactionsLoader = createReactionsLoader(pool, {
  eventStore,
  cacheRequest
});
const iTagLoader = createTagValueLoader(pool, "i", {
  cacheRequest,
  eventStore
});

export function loadAllAnimeEvents() {
  const events = writable<AnimeData[]>([]);
  createTimelineLoader(pool, relays, [{
    kinds: [30010],
    '#t': ['animestr'],
  }], {
    cache: cacheRequest,
    eventStore
  })(0).pipe(
    map(parseAnimeEvent),
    filter(e => e !== null)
  ).subscribe(event => events.update((prev: AnimeData[]) => [...prev, event]));
  return readonly(events);
}

export function animeLoaderWithFilter(filterString: string, limit: number = 10) {
  const events = writable<AnimeData[]>([]);
  eventStore.filters({
    kinds: [30010],
    '#t': ['animestr'],
  }).pipe(
    filter((event: Event) => event.tags.some(t => (t[0] === 'title' || t[0] === "alt-title" || t[0] === 'i') && t[1].toLowerCase().includes(filterString.toLowerCase()))),
    map(parseAnimeEvent),
    filter(event => event !== null),
    take(limit),
  ).subscribe(event => events.update((prev: AnimeData[]) => [...prev, event]))
  return readonly(events);
}

export function timelineLoaderToSvelteReadable(...filters: Filter[]) {
  const events = writable<Event[]>([]);
  createTimelineLoader(pool, relays, filters, {
    cache: cacheRequest,
    eventStore,
  })().subscribe(event => events.update((prev: Event[]) => [...prev, event].toSorted((a, b) => b.created_at - a.created_at)));
  return readonly(events);
}

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

export function zapsForEvent(event: Event) {
  return zapsLoader(event, relays).pipe(
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
}

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

export function watchListLoader(userPub: string) {
  const anime = writable<AnimeEntry[]>([]);
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
    distinctUntilKeyChanged('identifier'),
  ).subscribe((e: AnimeEntry) => anime.update(prev => {
    if (!prev.some(existing => existing.identifier === e.identifier)) {
      return [...prev, e].toSorted((a, b) => {
        if (a.status !== b.status) return a.status - b.status;
        if (a.score !== b.score) return b.score.value - a.score.value;
        return b.identifier.localeCompare(a.identifier);
      });
    }
    return prev;
  }));
  return (anime);
}

export type ReactionEmoji = { type: 'simple', emoji: string } | { type: 'custom', emoji: string; url: string };

export function reactionsForEvent(event: Event) {
  return reactionsLoader(event, relays).pipe(
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
}

export function emojiPreferenceEvent(pubkey: string) {
  return addressLoader({
    kind: 10030,
    pubkey,
    relays
  });
}

export function loadUserEmojiPreference(pubkey: string) {
  const emoji = writable<[string, string][]>([]);

  emojiPreferenceEvent(pubkey).subscribe((event) => {
    const emojiTags = event.tags.filter(x => x[0] === 'emoji');
    emojiTags.forEach(tag => emoji.update((prev) => [...prev, [
      tag[1], tag[2]
    ]]))
    const emojiPacks = event.tags.filter(x => x[0] === 'a' && x[1].startsWith(`30030:`)).map(x => x[1].split(':').splice(1));
    if (emojiPacks.length > 0) {
      from(emojiPacks).pipe(
        mergeMap(s => addressLoader({
          kind: 30030,
          identifier: s[1],
          pubkey: s[0],
          relays
        }))
      ).subscribe(event => {
        const emojiTags = event.tags.filter(x => x[0] === 'emoji');
        emojiTags.forEach(tag => emoji.update((prev) => [...prev, [
          tag[1], tag[2]
        ]]))
      })
    }
  });

  return readonly(emoji);
}

export function loadUserEmojiPacks(pubkey: string) {
  const packs = writable<string[][]>([]);

  emojiPreferenceEvent(pubkey).subscribe((event) => {
    const emojiPacks = event.tags.filter(x => x[0] === 'a' && x[1].startsWith(`30030:`)).map(x => x[1].split(':').slice(1));
    packs.update(_ => emojiPacks);
  });

  return readonly(packs);
}

export interface EmojiPack {
  identifier: string;
  author: string;
  title: string;
  emoji: string[][];
}

export function emojiPacksSvelteReadable() {
  const packs = writable<EmojiPack[]>([]);
  createTimelineLoader(pool, relays, {
    kinds: [30030]
  }, {
    cache: cacheRequest,
    eventStore,
  })().subscribe(event => {
    const identifier = event.tags.find(t => t[0] === 'd')?.[1];
    if (!identifier) return;
    const title = event.tags.find(t => t[0] === 'title')?.[1] || identifier;
    const emoji = event.tags.filter(t => t[0] === 'emoji').map(t => t.slice(1));
    const pack = {
      identifier,
      title,
      author: event.pubkey,
      emoji,
    };
    packs.update((prev: EmojiPack[]) => [...prev, pack])
  })
  // events.update((prev: Event[]) => [...prev, event].toSorted((a, b) => b.created_at - a.created_at)));
  return readonly(packs);
}
