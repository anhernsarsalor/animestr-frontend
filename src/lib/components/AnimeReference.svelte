<script lang="ts">
	import { ndk } from '$lib/stores/signerStore.svelte';
	import { NDKSubscriptionCacheUsage, type NDKKind } from '@nostr-dev-kit/ndk';
	import parseAnimeEvent from '$lib/nostr/parseAnimeEvent';
	import Loading from './Loading.svelte';

	let { animeId, source, event = null } = $props();

	let loadedEvents = $derived(
		event
			? [event]
			: ndk.$subscribe([{ kinds: [30010 as NDKKind], '#i': [`${source}:${animeId}`] }], {
					closeOnEose: false,
					cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST
				})
	);

	let loadedEvent = $derived(loadedEvents[0]);
	let animeData = $derived(loadedEvent ? parseAnimeEvent(loadedEvent) : null);
	let isLoading = $derived(!loadedEvent);
</script>

<a href={`/anime/${source}:${animeId}`} class="my-4 block">
	<div
		class="card card-side bg-base-100 border-base-300 border shadow-md transition-all hover:shadow-lg"
	>
		{#if isLoading}
			<div class="card-body items-center justify-center p-4">
				<Loading inline />
				<p class="text-base-content/70 mt-2 text-sm">Loading anime...</p>
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
