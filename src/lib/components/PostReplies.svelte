<script lang="ts">
	import Post from './Post.svelte';
	import { filterOnlyDirectReplies } from '$lib/nostr/filterEvents.svelte';
	import { slide } from 'svelte/transition';
	import NewPostEditor from './NewPostEditor.svelte';
	import type { Event } from 'nostr-tools';
	import { timelineLoader } from '$lib';
	import { nostr } from '$lib/stores/signerStore.svelte';

	let { parent }: { parent: Event } = $props();

	const replies = timelineLoader(
		{
			kinds: [1],
			'#e': [parent.id]
		},
		{
			kinds: [24],
			'#q': [parent.id]
		}
	).pipe(filterOnlyDirectReplies(parent));
</script>

<div
	class="card bg-base-200 border-base-300 border p-4 shadow-sm transition-all hover:shadow-md"
	transition:slide
>
	{#if nostr.activeUser}
		<NewPostEditor replyTo={parent} />
	{/if}
	{#each $replies as reply}
		<Post event={reply} />
	{:else}
		No replies yet!
	{/each}
</div>
