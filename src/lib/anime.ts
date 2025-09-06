import { addressLoader, cacheRequest, eventStore, pool, relays } from '$lib';
import {
	distinctUntilChanged,
	distinctUntilKeyChanged,
	filter,
	from,
	map,
	mergeMap,
	startWith,
	take,
	toArray
} from 'rxjs';
import type { Event } from 'nostr-tools/core';
import { animeScore, normalizeWatchStatus, type WatchStatus } from './utils.svelte';
import { createTagValueLoader, createTimelineLoader } from 'applesauce-loaders/loaders';

const iTagLoader = createTagValueLoader(pool, 'i', {
	cacheRequest,
	eventStore
});

export interface AnimeData {
	title: string;
	altTitles: string[];
	type: string;
	episodes: string;
	status: string;
	season: string;
	year: string;
	genres: string[];
	identifiers: { type: string; value: string }[];
	related: string[];
	image: string;
	thumbnail: string;
}

export interface AnimeEntry {
	identifier: string;
	score: ReturnType<typeof animeScore>;
	status: WatchStatus;
	progress: number;
	anime: AnimeData | null;
}

export function normalizeProgress(progress?: string | number) {
	if (typeof progress === 'undefined' || progress === null) return 0;
	if (typeof progress === 'number') if (progress > 0 && !isNaN(progress)) return progress;
	const progressNumber = Number.parseInt(progress.toString());
	if (isNaN(progressNumber)) return 0;
	if (progressNumber < 0) return 0;
	return progressNumber;
}

export default function parseAnimeEvent(event: Event): AnimeData | null {
	if (!event || !event.tags) return null;

	const data: AnimeData = {
		title: '',
		altTitles: [],
		type: '',
		episodes: '',
		status: '',
		season: '',
		year: '',
		genres: [],
		identifiers: [],
		related: [],
		image: '',
		thumbnail: ''
	};

	event.tags.forEach((tag) => {
		const [tagType, ...values] = tag;

		switch (tagType) {
			case 'title':
				data.title = values[0];
				break;
			case 'alt-title':
				data.altTitles.push(values[0]);
				break;
			case 'type':
				data.type = values[0];
				break;
			case 'episodes':
				data.episodes = values[0];
				break;
			case 'status':
				data.status = values[0];
				break;
			case 'season':
				data.season = values[0];
				break;
			case 'year':
				data.year = values[0];
				break;
			case 'genre':
				data.genres.push(values[0]);
				break;
			case 'image':
				data.image = values[0];
				break;
			case 'thumbnail':
				data.thumbnail = values[0];
				break;
			case 'i':
				const idValue = values[0];
				let idType = '';

				if (idValue.startsWith('anilist:')) {
					idType = 'AniList';
				} else if (idValue.startsWith('mal:')) {
					idType = 'MyAnimeList';
				} else if (idValue.startsWith('anidb:')) {
					idType = 'AniDB';
				} else if (idValue.startsWith('url:')) {
					const url = idValue.replace('url:', '');
					if (url.includes('anime-planet')) {
						idType = 'Anime-Planet';
					} else if (url.includes('kitsu')) {
						idType = 'Kitsu';
					} else if (url.includes('livechart')) {
						idType = 'LiveChart';
					} else if (url.includes('notify.moe')) {
						idType = 'Notify.moe';
					} else if (url.includes('simkl')) {
						idType = 'Simkl';
					} else if (url.includes('anisearch')) {
						idType = 'AniSearch';
					} else if (url.includes('animecountdown')) {
						idType = 'AnimeCountdown';
					} else {
						idType = 'Other';
					}
				}

				if (idType) {
					data.identifiers.push({
						type: idType,
						value: idValue
					});
				}
				break;
			case 'a':
				data.related.push(values[0]);
				break;
		}
	});

	return data;
}

export const allAnimeEvents = createTimelineLoader(
	pool,
	relays,
	[
		{
			kinds: [30010],
			'#t': ['animestr']
		}
	],
	{
		cache: cacheRequest,
		eventStore
	}
)(0).pipe(
	map(parseAnimeEvent),
	filter((e) => e !== null)
);

export const animeEventLoader = (identifier: string) =>
	iTagLoader({
		value: identifier,
		relays
	}).pipe(
		filter((e) => e.kind === 30010),
		map(parseAnimeEvent)
	);

export function animeLoaderWithFilter(filterString: string, limit: number = 10) {
	const lowerFilter = filterString.toLowerCase();
	return allAnimeEvents.pipe(
		filter(
			(a) =>
				a.title.toLowerCase().includes(lowerFilter) ||
				a.altTitles.some((t) => t.toLowerCase().includes(lowerFilter)) ||
				a.identifiers.some((x) => x.value.includes(lowerFilter))
		),
		take(limit),
		toArray(),
		startWith([])
	);
}

export const watchListLoader = (userPub: string) =>
	addressLoader({
		kind: 31111,
		identifier: 'anime-list',
		pubkey: userPub
	}).pipe(
		map((watchList) =>
			watchList.tags
				.filter((tag) => tag[0] === 'i')
				.map((tag) => ({
					identifier: tag[1],
					score: animeScore(tag[2]),
					status: normalizeWatchStatus(tag[3]),
					progress: normalizeProgress(tag[4])
				}))
		),
		mergeMap((sortedList) =>
			from(sortedList).pipe(
				distinctUntilKeyChanged('identifier'),
				mergeMap((entry) =>
					animeEventLoader(entry.identifier).pipe(
						map((animeData) => ({
							identifier: entry.identifier,
							score: entry.score,
							status: entry.status,
							anime: animeData,
							progress: entry.progress
						}))
					)
				)
			)
		),
		filter((x) => x.anime !== null),
		distinctUntilChanged((a: AnimeEntry, b: AnimeEntry) => a.identifier === b.identifier),
		toArray(),
		map((entries) =>
			entries.toSorted((a, b) => {
				if (a.status !== b.status) return a.status - b.status;
				if (a.score !== b.score) return b.score.value - a.score.value;
				return b.identifier.localeCompare(a.identifier);
			})
		),
		startWith([] as AnimeEntry[])
	);
