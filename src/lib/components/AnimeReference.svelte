<script lang="ts">
	import { ndk } from '$lib/stores/signerStore.svelte';
	import { NDKSubscriptionCacheUsage, type NDKKind } from '@nostr-dev-kit/ndk';
	import parseAnimeEvent from '$lib/nostr/parseAnimeEvent';
	import Loading from './Loading.svelte';
	import Icon from '@iconify/svelte';

	let { animeId, source, score = null, event = null } = $props();

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
					<Icon icon="line-md:image-twotone" />
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
				<div class="card-footer">
					{#if score !== null}
						<div class="badge badge-secondary">
							Score: {score.toFixed(2)}
						</div>
					{/if}
				</div>
			</div>
		{:else}
			<div class="card-body flex items-center justify-center py-4">
				<div class="text-base-content/50 flex flex-col items-center">
					<Icon icon="line-md:alert" />
					<span>Anime not found</span>
				</div>
			</div>
		{/if}
	</div>
</a>
