import { EventStore, mapEventsToStore } from "applesauce-core";
import { createAddressLoader, createEventLoader, createReactionsLoader, createTagValueLoader, createTimelineLoader, createZapsLoader } from "applesauce-loaders/loaders";
import { onlyEvents, RelayPool } from "applesauce-relay";
import type { Event, Filter, NostrEvent } from "nostr-tools";
import { openDB, getEventsForFilters, addEvents } from "nostr-idb";
import { bufferTime, distinctUntilKeyChanged, filter, from, map, mergeMap, take } from "rxjs";
import { isFromCache } from "applesauce-core/helpers";
import { readonly, writable } from "svelte/store";
import { animeScore, decodeBolt11Amount, normalizeWatchStatus, WatchStatus } from "./utils.svelte";
import { NDKUser } from "@nostr-dev-kit/ndk";
import parseAnimeEvent from "./nostr/parseAnimeEvent";
import type { AnimeData } from "./nostr/types";

const cache = await openDB();

export const eventStore = new EventStore();

const pool = new RelayPool();
const relays = [
  "wss://relay.nostr.band",
  "wss://anime.nostr1.com",
  "wss://relay.nostr.wirednet.jp",
  "wss://at.nostrworks.com",
  "wss://atlas.nostr.land",
  "wss://nostr.wine",
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

const reactionsLoader = createReactionsLoader(pool);
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

export type ParsedZapEvent = {
  user: NDKUser;
  amount: number;
  message?: string;
};

export function zapsLoaderToSvelteReadable(event: Event) {
  // TODO: use applesauce-core/helpers for some of those operations below
  const zaps = writable<ParsedZapEvent[]>([]);
  zapsLoader(event, relays).pipe(
    map((zap: NostrEvent) => {
      if (!zap.tags.some(t => t[0] === 'bolt11')) return null;
      const bolt11Invoice = zap.tags.find((x) => x[0] === 'bolt11')?.[1];
      const amount = decodeBolt11Amount(bolt11Invoice || '');
      const description = zap.tags.find((x) => x[0] === 'description')?.[1];
      let senderPubkey = '';
      let message = '';
      if (description)
        try {
          const zapRequest = JSON.parse(description);
          senderPubkey = zapRequest.pubkey;
          message = zapRequest.content || '';
        } catch {
          return null;
        }
      if (!senderPubkey)
        senderPubkey = zap.tags.find((x) => x[0] === 'P')?.[1] || '';
      if (!senderPubkey)
        return null;
      if (amount < 0)
        return null;
      return {
        user: new NDKUser({ pubkey: senderPubkey }),
        amount,
        message
      }
    }),
    filter(z => z !== null)
  ).subscribe(zap => zaps.update((prev: ParsedZapEvent[]) => [...prev, zap]));
  return readonly(zaps);
}


export interface AnimeEntry {
  identifier: string;
  score: ReturnType<typeof animeScore>;
  status: WatchStatus;
  anime: AnimeData | null;
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
        status: normalizeWatchStatus(tag[3])
      }))
    ),
    mergeMap(sortedList => from(sortedList).pipe(
      distinctUntilKeyChanged('identifier'),
      mergeMap(entry => animeEventLoader(entry.identifier).pipe(
        map(animeData => ({
          identifier: entry.identifier,
          score: entry.score,
          status: entry.status,
          anime: animeData
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

export function reactionsLoaderToSvelteReadable(event: Event) {
  const reactionAuthors: Record<string, Set<string>> = {};
  const emojiMapping: Record<string, string> = {};

  const reactions = writable<{ authors: Record<string, Set<string>>, emojis: Record<string, string> }>({ authors: {}, emojis: {} });
  reactionsLoader(event, relays).subscribe((reaction: Event) => reactions.update((prev) => {
    const emojiTags = reaction.tags.filter((x) => x[0] === 'emoji');
    if (emojiTags.length === 1) {
      const [, emoji, url] = emojiTags[0]!;
      emojiMapping[emoji] = url;
      if (!reactionAuthors[emoji])
        reactionAuthors[emoji] = new Set();
      reactionAuthors[emoji].add(reaction.pubkey);
    } else {
      let emoji = reaction.content.trim();
      if (emoji === '+') emoji = '👍';
      if (emoji) {
        if (!reactionAuthors[emoji])
          reactionAuthors[emoji] = new Set();
        reactionAuthors[emoji].add(reaction.pubkey);
      }
    }
    return { authors: reactionAuthors, emojis: emojiMapping };
  }));
  return readonly(reactions);
}
