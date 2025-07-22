<script lang="ts">
	import Post from '$lib/components/Post.svelte';
	import { fade } from 'svelte/transition';
	import Loading from './Loading.svelte';
	import type { Event } from 'nostr-tools';

	let {
		events,
		header = '',
		emptyMessage = 'No events found'
	}: {
		events: Event[];
		header?: string;
		emptyMessage?: string;
	} = $props();

	let start = $state(0);
	let end = $state(20);

	let slice = $derived(events.slice(start, end));

	function previous() {
		start = start - 20;
		end = end - 20;
	}

	function next() {
		start = start + 20;
		end = end + 20;
	}

	$effect(() => {
		window.scrollTo({
			top: 0,
			left: 0,
			behavior: 'smooth'
		});
		console.log(start, end);
	});
</script>

{#if header}
	<h2 class="mb-4 text-xl font-bold">{header}</h2>
{/if}

{#if events.length === 0}
	<div class="flex flex-col justify-center justify-items-center py-8">
		<Loading inline />
		{#if emptyMessage}
			<div class="text-base-content/70 py-8 text-center">{emptyMessage}</div>
		{/if}
	</div>
{:else}
	<div class="space-y-4">
		<div class="flex justify-between">
			{#if start > 0}
				<button class="btn btn-primary" onclick={previous}>Previous</button>
			{:else}
				<span></span>
			{/if}
			{#if events.length > end}
				<button class="btn btn-secondary" onclick={next}>Next</button>
			{/if}
		</div>
		{#each slice as event}
			{#key event.id}
				<div in:fade>
					<Post {event} />
				</div>
			{/key}
		{/each}
		<div class="flex justify-between">
			{#if start > 0}
				<button class="btn btn-primary" onclick={previous}>Previous</button>
			{:else}
				<span></span>
			{/if}
			{#if events.length > end}
				<button class="btn btn-secondary" onclick={next}>Next</button>
			{/if}
		</div>
	</div>
{/if}
