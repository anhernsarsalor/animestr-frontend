<script lang="ts">
	import { createEventListStore, type ValidEventFn } from '$lib/stores/eventListStore.svelte';
	import Post from '$lib/components/Post.svelte';
	import { fly } from 'svelte/transition';
	import type { Filter } from '@rust-nostr/nostr-sdk';

	let {
		query,
		filterFn,
		header = '',
		emptyMessage = 'No events found',
		showObserver = true
	}: {
		query: Filter | Filter[];
		filterFn: ValidEventFn;
		header?: string;
		emptyMessage?: string;
		showObserver?: boolean;
	} = $props();

	const store = createEventListStore(query, filterFn);

	let observerTarget = $state<HTMLElement | undefined>();

	$effect(() => {
		if (observerTarget && showObserver && store.hasMore) {
			const observer = new IntersectionObserver(
				(entries) => {
					if (entries[0].isIntersecting && !store.isLoadingMore && store.hasMore) {
						store.loadMore();
					}
				},
				{ rootMargin: '200px' }
			);
			observer.observe(observerTarget);
			return () => observer.disconnect();
		}
	});

	$inspect(store);
</script>

{#if header}
	<h2 class="mb-4 text-xl font-bold">{header}</h2>
{/if}

{#if store.isLoading}
	<div class="flex justify-center py-8">
		<span class="loading loading-spinner loading-lg text-primary"></span>
	</div>
{:else if store.error}
	<div class="alert alert-error">
		<span>{store.error}</span>
	</div>
{:else if store.events.length === 0}
	<div class="text-base-content/70 py-8 text-center">{emptyMessage}</div>
{:else}
	<div class="space-y-4">
		{#each store.events as event}
			{#key event.id}
				<Post {event} />
			{/key}
		{/each}
	</div>
	{#if store.isLoadingMore}
		<div transition:fly class="flex justify-center py-4">
			<span class="loading loading-spinner loading-md text-primary"></span>
		</div>
	{/if}
	{#if store.hasMore && showObserver}
		<div bind:this={observerTarget} class="h-1 w-full"></div>
	{:else if store.events.length > 0}
		<div class="text-base-content/70 py-4 text-center text-sm">You've reached the end</div>
	{/if}
{/if}
