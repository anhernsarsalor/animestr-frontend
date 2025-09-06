import { EventStore, mapEventsToStore } from 'applesauce-core';
import {
	createAddressLoader,
	createEventLoader,
	createTimelineLoader
} from 'applesauce-loaders/loaders';
import { onlyEvents, RelayPool } from 'applesauce-relay';
import type { Event, Filter } from 'nostr-tools';
import { openDB, getEventsForFilters, addEvents, type NostrIDB } from 'nostr-idb';
import { bufferTime, filter, from, map, mergeMap, scan, startWith, switchMap } from 'rxjs';
import { isEventPointer, isFromCache } from 'applesauce-core/helpers';
import { EventFactory, type EventFactoryTemplate, type EventOperation } from 'applesauce-factory';
import { ExtensionSigner } from 'applesauce-signers';
import { decode } from 'nostr-tools/nip19';
import { type EventPointer } from 'nostr-tools/nip19';
import { browser } from '$app/environment';
import { spamUsers } from './spam';
import { nostr } from './stores/signerStore.svelte';

export function keepAliveRequest(relays: string[], filters: Filter[]) {
	return pool.group(relays).subscription(filters).pipe(onlyEvents(), mapEventsToStore(eventStore));
}

let cache: NostrIDB | null = null;
(async () => {
	if (browser) cache = await openDB();
})();

export const eventStore = new EventStore();

export const pool = new RelayPool();
export const relays = [
	'wss://relay.nostr.band',
	'wss://anime.nostr1.com',
	'wss://relay.nostr.wirednet.jp',
	'wss://at.nostrworks.com',
	'wss://atlas.nostr.land',
	'wss://wot.utxo.one',
	'wss://relay.damus.io'
];

eventStore.insert$
	.pipe(
		filter((e) => !isFromCache(e)),
		bufferTime(1_000),
		filter((b) => b.length > 0)
	)
	.subscribe((events) => {
		if (cache)
			addEvents(cache, events).then(() => {
				console.log('Saved events to cache', events.length);
			});
	});

const signer = new ExtensionSigner();
export const eventFactory = new EventFactory({
	signer,
	client: {
		name: 'animestr',
		address: {
			identifier: 'animestr',
			pubkey: 'c5d3f2d17cde84c4d84a8148df2dfc9cd520fc82ddd76284ff3b6e3e37f31eb2'
		}
	}
});

export async function signEvent(
	template: EventFactoryTemplate,
	...operations: (EventOperation | undefined)[]
) {
	const note = await eventFactory.build(template, ...operations);
	return await eventFactory.sign(note);
}

export async function createEvent(
	template: EventFactoryTemplate,
	...operations: (EventOperation | undefined)[]
) {
	const signed = await signEvent(template, ...operations);
	pool.publish(relays, signed).subscribe({
		next(publishResponse) {
			if (publishResponse.ok) {
				eventStore.add(signed);
				return;
			}
			console.log(`Failed to publish event to ${publishResponse.from}: ${publishResponse.message}`);
		}
	});
}

export const cacheRequest = (filters: Filter[]) => getEventsForFilters(cache, filters);

export const addressLoader = createAddressLoader(
	{
		request: keepAliveRequest
	},
	{
		eventStore,
		cacheRequest
	}
);

export const simpleAddressLoader = createAddressLoader(pool, {
	eventStore
});

const eventsLoader = createEventLoader(pool, {
	eventStore,
	cacheRequest
});

export const timelineLoader = (...filters: Filter[]) =>
	createTimelineLoader(
		{
			request: keepAliveRequest
		},
		relays,
		filters,
		{
			cache: cacheRequest,
			eventStore
		}
	)().pipe(
		filter((e) => !spamUsers.includes(e.pubkey)),
		scan(
			(events, event) => [...events, event].toSorted((a, b) => b.created_at - a.created_at),
			[] as Event[]
		),
		startWith([])
	);

export const profileLoader = (userPub: string) =>
	simpleAddressLoader({
		kind: 0,
		pubkey: userPub,
		relays
	});

export const eventLoader = (eventId: string) =>
	eventsLoader({
		id: normalizeToEventId(eventId),
		relays
	});

export const contentEditsLoader = (event: Event) =>
	createTimelineLoader(
		{
			request: keepAliveRequest
		},
		relays,
		{
			kinds: [1010],
			authors: [event.pubkey],
			'#e': [event.id]
		}
	)().pipe(
		filter((e) => e.tags.some((t) => t[0] === 'alt' && t[1] === 'Content Change Event')),
		scan(
			(events, event) => [...events, event].toSorted((a, b) => b.created_at - a.created_at),
			[] as Event[]
		),
		map((events) => events[0])
	);

export function normalizeToEventId(input: string | EventPointer | Event): string {
	if (typeof input === 'string' && input.length === 64 && /^[a-f0-9]+$/i.test(input)) return input;
	if (typeof input === 'object' && 'id' in input && 'pubkey' in input) return input.id;
	if (typeof input === 'object' && 'id' in input && !('pubkey' in input)) return input.id;
	if (typeof input === 'string')
		try {
			const decoded = decode(input);
			if (decoded.type === 'note') return decoded.data as string;
			if (decoded.type === 'nevent' && isEventPointer(decoded.data)) return decoded.data.id;
		} catch (error) {
			if (input.length === 64 && /^[a-f0-9]+$/i.test(input)) return input;
			throw new Error(`Unable to normalize to event ID: ${input}`);
		}

	throw new Error(`Invalid input type for normalizeToEventId: ${typeof input}`);
}

export function getLastNotificationTime() {
	const time = Number.parseInt(localStorage.getItem('notifications-last') || '0');
	if (Number.isNaN(time)) return 0;
	return time;
}

export function notificationsLoader(since: number = NaN) {
	if (Number.isNaN(since) || since < 0) since = getLastNotificationTime();
	return timelineLoader({
		'#p': [nostr.activeUser!],
		since
	}).pipe(
		map((events) =>
			events
				.filter((e) => e.kind !== 3 && e.kind !== 6 && e.kind != 9735) // TODO: handle those better
				.filter((e) => e.pubkey !== nostr.activeUser!)
		)
	);
}

export interface BadgeInfo {
	name: string;
	description: string;
	image: string;
	author: string;
	awarded: Date;
	id: string;
}

export const badgesLoader = (pubkey: string) =>
	timelineLoader({
		kinds: [8],
		'#p': [pubkey]
	}).pipe(
		switchMap((events) => from(events)),
		filter((event) => event.tags && event.tags.some((tag) => tag[0] === 'a')),
		map((event) => {
			const aTag = event.tags.find((tag) => tag[0] === 'a')!;
			return aTag[1];
		}),
		filter((t) => t !== undefined),
		mergeMap((aTagValue) => {
			const [kind, pubkey, dTag] = aTagValue.split(':');

			return simpleAddressLoader({
				pubkey,
				kind: Number.parseInt(kind),
				identifier: dTag
			}).pipe(
				map((badge) => {
					const nameTag = badge.tags.find((tag) => tag[0] === 'name');
					const descriptionTag = badge.tags.find((tag) => tag[0] === 'description');
					const imageTag = badge.tags.find((tag) => tag[0] === 'image');
					const dTag = badge.tags.find((tag) => tag[0] === 'd');

					return {
						name: nameTag?.[1] || dTag?.[1] || 'Unknown Badge',
						description: descriptionTag?.[1] || 'No description available',
						image: imageTag?.[1] || '',
						author: badge.pubkey,
						awarded: new Date(badge.created_at * 1000),
						id: dTag?.[1] || badge.id
					} as BadgeInfo;
				})
			);
		}),
		scan((acc, curr) => [...acc, curr], [] as BadgeInfo[]),
		startWith([])
	);
