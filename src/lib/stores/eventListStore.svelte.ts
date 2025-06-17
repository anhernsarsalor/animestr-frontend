import { Duration, Filter, Timestamp, type Event } from "@rust-nostr/nostr-sdk";
import { nostr } from "./signerStore.svelte";
import { unique } from "$lib/utils";

export type ValidEventFn = (event: Event) => boolean;

export type eventListStore = {
  events: Event[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error?: string | null;
  lastEventTimestamp: number;
  earliestEventTimeStamp: number,
  loadMore: (...args: any[]) => Promise<void>;
};

export function createEventListStore(filter: Filter | Filter[], validEventFn: ValidEventFn = () => true): eventListStore {
  if (Array.isArray(filter)) {
    return createEventListStoreWithMultipleFilters(filter, validEventFn);
  }
  const store = $state<eventListStore>({
    events: [],
    isLoading: false,
    isLoadingMore: false,
    hasMore: true,
    error: null,
    lastEventTimestamp: 0,
    earliestEventTimeStamp: Number.POSITIVE_INFINITY,
    loadMore: loadMore
  });

  const filterClone = filter.asJson(); // gets drop()'d due to wasm

  async function loadRelaysEvents() {
    const filterAfterTimestamp = store.lastEventTimestamp ? Filter.fromJson(filterClone).since(Timestamp.fromSecs(store.lastEventTimestamp)) : Filter.fromJson(filterClone);
    const filterBeforeTimestamp = store.lastEventTimestamp ? Filter.fromJson(filterClone).until(Timestamp.fromSecs(store.lastEventTimestamp)) : Filter.fromJson(filterClone);
    const newerRelayEvents = (await nostr.client!.fetchEvents(filterAfterTimestamp, Duration.fromSecs(20))).toVec().filter(validEventFn).filter(event => !store.events.some(e => e.id.toHex() === event.id.toHex()));
    const olderRelayEvents = (await nostr.client!.fetchEvents(filterBeforeTimestamp, Duration.fromSecs(20))).toVec().filter(validEventFn).filter(event => !store.events.some(e => e.id.toHex() === event.id.toHex()));
    if (newerRelayEvents.length > 0) {
      store.events = unique(newerRelayEvents.concat(store.events).sort((a, b) => b.createdAt.asSecs() - a.createdAt.asSecs()), e => e.id.toHex());
    }
    if (olderRelayEvents.length > 0) {
      store.events = unique(olderRelayEvents.concat(store.events).sort((a, b) => b.createdAt.asSecs() - a.createdAt.asSecs()), e => e.id.toHex());
      store.hasMore = true;
    } else {
      store.hasMore = false;
    }
    store.lastEventTimestamp = latestTimeStamp(store.events);
    store.earliestEventTimeStamp = earliestTimestamp(store.events);
  }

  async function loadInitial() {
    store.isLoading = true;
    store.error = null;
    try {
      const cachedEventsMatchingFilter = (await nostr.db!.query(filter as Filter)).toVec().filter(validEventFn);
      store.events = unique(cachedEventsMatchingFilter, e => e.id.toHex());
      store.lastEventTimestamp = latestTimeStamp(store.events);
      store.earliestEventTimeStamp = earliestTimestamp(store.events);
      store.hasMore = true;
      store.isLoading = false;
      await loadRelaysEvents();
    } catch (e) {
      store.error = e instanceof Error ? e.message : String(e);
    } finally {
      store.isLoading = false;
    }
  }

  function latestTimeStamp(events: Event[]): number {
    return events.reduce((acc, event) => event.createdAt.asSecs() > acc ? event.createdAt.asSecs() : acc, 0);
  }

  function earliestTimestamp(events: Event[]): number {
    return events.reduce((acc, event) => event.createdAt.asSecs() < acc ? event.createdAt.asSecs() : acc, Number.POSITIVE_INFINITY);
  }

  async function loadMore() {
    store.isLoadingMore = true;
    store.error = null;
    try {
      await loadRelaysEvents();
    } catch (e) {
      store.error = e instanceof Error ? e.message : String(e);
    } finally {
      store.isLoadingMore = false;
    }
  }

  loadInitial();

  return store;
}

export function createEventListStoreWithMultipleFilters(filters: Filter[], validEventFn: ValidEventFn): eventListStore {
  const stores = $state<eventListStore[]>([]);

  for (const filter of filters) {
    stores.push(createEventListStore(filter, validEventFn));
  }

  const combinedStore = $state<eventListStore>({
    events: [],
    isLoading: false,
    isLoadingMore: false,
    hasMore: true,
    error: null,
    lastEventTimestamp: 0,
    earliestEventTimeStamp: Number.POSITIVE_INFINITY,
    loadMore: loadMore
  });

  function updateCombinedStore() {
    const allEvents = stores
      .flatMap(store => store.events)
      .filter((event, index, arr) =>
        arr.findIndex(e => e.id.toHex() === event.id.toHex()) === index
      )
      .sort((a, b) => b.createdAt.asSecs() - a.createdAt.asSecs());

    combinedStore.events = unique(allEvents, e => e.id.toHex());
    combinedStore.isLoading = stores.some(store => store.isLoading);
    combinedStore.isLoadingMore = stores.some(store => store.isLoadingMore);
    combinedStore.hasMore = stores.some(store => store.hasMore);
    combinedStore.error = stores.find(store => store.error)?.error || null;

    combinedStore.lastEventTimestamp = allEvents.length > 0
      ? Math.max(...allEvents.map(e => e.createdAt.asSecs()))
      : 0;

    combinedStore.earliestEventTimeStamp = allEvents.length > 0
      ? Math.min(...allEvents.map(e => e.createdAt.asSecs()))
      : Number.POSITIVE_INFINITY;
  }

  $effect(() => {
    updateCombinedStore();
  });

  async function loadMore() {
    try {
      await Promise.all(stores.map(store => store.loadMore()));
    } catch (error) {
      combinedStore.error = error instanceof Error ? error.message : String(error);
    }
  }

  return combinedStore;
}


