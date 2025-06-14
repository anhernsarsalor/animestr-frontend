<script lang="ts">
	import { onMount } from 'svelte';
	import { Alphabet, Duration, Event, Filter, Kind, SingleLetterTag } from '@rust-nostr/nostr-sdk';
	import { nostr } from '$lib/stores/signerStore.svelte';

	let { animeId, source, event = null } = $props();

	let loadedEvent = $state<Event | null>(event);
	let isLoading = $state(!event);
	let error = $state<string | null>(null);
	let animeData = $state<{
		title: string;
		type: string;
		image: string;
		thumbnail: string;
		year: string;
		season: string;
	} | null>(event ? parseEventTags(event) : null);

	function parseEventTags(event: Event) {
		if (!event || !event.tags) return null;

		const data = {
			title: '',
			type: '',
			image: '',
			thumbnail: '',
			year: '',
			season: ''
		};

		event.tags.asVec().forEach((tag) => {
			const [tagType, ...values] = tag.asVec();

			switch (tagType) {
				case 'title':
					data.title = values[0];
					break;
				case 'type':
					data.type = values[0];
					break;
				case 'image':
					data.image = values[0];
					break;
				case 'thumbnail':
					data.thumbnail = values[0];
					break;
				case 'year':
					data.year = values[0];
					break;
				case 'season':
					data.season = values[0];
					break;
			}
		});

		return data;
	}

	async function fetchEvent(id: string) {
		isLoading = true;
		error = null;
		loadedEvent = null;
		animeData = null;

		const filter = new Filter()
			.kind(new Kind(30010))
			.customTag(SingleLetterTag.lowercase(Alphabet.I), id);
		const event = await nostr.client!.fetchEvents(filter, Duration.fromSecs(20))!;
		loadedEvent = event.toVec()[0];
		animeData = parseEventTags(loadedEvent);
		isLoading = false;
	}

	onMount(() => {
		if (!event) {
			const lookupId = `${source}:${animeId}`;
			fetchEvent(lookupId);
		}
	});
</script>

<a href={`/anime/${source}:${animeId}`} class="my-4 block">
	<div
		class="card card-side bg-base-100 border-base-300 border shadow-md transition-all hover:shadow-lg"
	>
		{#if isLoading}
			<div class="card-body items-center justify-center p-4">
				<span class="loading loading-spinner loading-md text-primary"></span>
				<p class="text-base-content/70 mt-2 text-sm">Loading anime...</p>
			</div>
		{:else if error}
			<div class="card-body p-4">
				<div class="alert alert-error shadow-sm">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6 shrink-0 stroke-current"
						fill="none"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span>{error}</span>
				</div>
			</div>
		{:else if animeData}
			{#if animeData.thumbnail || animeData.image}
				<figure class="w-24">
					<img
						src={animeData.image || animeData.thumbnail}
						alt={animeData.title}
						class="h-full w-full object-cover"
					/>
				</figure>
			{:else}
				<figure class="bg-base-200 flex w-24 items-center justify-center">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="text-base-content/30 h-8 w-8"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
				</figure>
			{/if}
			<div class="card-body px-4 py-3">
				<h2 class="card-title line-clamp-1 text-base">
					{animeData.title || 'Unknown Anime'}
				</h2>
				<div class="card-actions justify-start">
					{#if animeData.type}
						<div class="badge badge-primary">{animeData.type}</div>
					{/if}
					{#if animeData.season && animeData.year}
						<div class="badge badge-ghost">{animeData.season} {animeData.year}</div>
					{/if}
				</div>
			</div>
		{:else}
			<div class="card-body flex items-center justify-center py-4">
				<div class="text-base-content/50 flex flex-col items-center">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="mb-2 h-8 w-8"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span>Anime not found</span>
				</div>
			</div>
		{/if}
	</div>
</a>
