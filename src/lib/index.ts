import { EventStore, mapEventsToStore } from "applesauce-core";
import { createAddressLoader, createEventLoader, createTimelineLoader } from "applesauce-loaders/loaders";
import { onlyEvents, RelayPool } from "applesauce-relay";
import type { Event, Filter } from "nostr-tools";
import { openDB, getEventsForFilters, addEvents } from "nostr-idb";
import { bufferTime, filter, map, scan, startWith } from "rxjs";
import { isFromCache } from "applesauce-core/helpers";
import { EventFactory, type EventFactoryTemplate, type EventOperation } from "applesauce-factory";
import { ExtensionSigner } from "applesauce-signers";

function keepAliveRequest(relays: string[], filters: Filter[]) {
  return pool.group(relays).subscription(filters).pipe(
    onlyEvents(),
    mapEventsToStore(eventStore)
  )
}

const cache = await openDB();

export const eventStore = new EventStore();

export const pool = new RelayPool();
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
export const eventFactory = new EventFactory({
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

export const cacheRequest = (filters: Filter[]) => getEventsForFilters(cache, filters);

export const addressLoader = createAddressLoader(pool, {
  eventStore,
  cacheRequest,
});

const eventsLoader = createEventLoader(pool, {
  eventStore,
  cacheRequest,
});

export const timelineLoader = (...filters: Filter[]) => createTimelineLoader({
  request: keepAliveRequest
}, relays, filters, {
  cache: cacheRequest,
  eventStore,
})().pipe(
  scan((events, event) => [...events, event].toSorted((a, b) => b.created_at - a.created_at), [] as Event[]),
  startWith([])
)

export const profileLoader = (userPub: string) => addressLoader({
  kind: 0,
  pubkey: userPub,
  relays
})

export const eventLoader = (eventId: string) => eventsLoader({
  id: eventId,
  relays
});

export const contentEditsLoader = (event: Event) => createTimelineLoader({
  request: keepAliveRequest,
}, relays, {
  kinds: [1010],
  authors: [event.pubkey],
  '#e': [event.id]
})().pipe(
  filter((e) => e.tags.some((t) => t[0] === 'alt' && t[1] === 'Content Change Event')),
  scan((events, event) => [...events, event].toSorted((a, b) => b.created_at - a.created_at), [] as Event[]),
  map(events => events[0])
)
