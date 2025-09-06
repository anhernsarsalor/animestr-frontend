<script lang="ts">
	import Post from './Post.svelte';
	import { filterOnlyDirectReplies } from '$lib/nostr/filterEvents.svelte';
	import { slide } from 'svelte/transition';
	import NewPostEditor from './NewPostEditor.svelte';
	import type { Event } from 'nostr-tools';
	import { timelineLoader } from '$lib';
	import { nostr } from '$lib/stores/signerStore.svelte';

	let {
		parent,
		level
	}: {
		parent: Event;
		level: number;
	} = $props();

	const replies = timelineLoader(
		{
			kinds: [1, 1111],
			'#e': [parent.id]
		},
		{
			kinds: [24],
			'#q': [parent.id]
		}
	).pipe(filterOnlyDirectReplies(parent));
</script>

<div class="reply-thread" transition:slide>
	{#if nostr.activeUser}
		<NewPostEditor replyTo={parent} />
	{/if}
	<div class="flex flex-col gap-2">
		{#each $replies as reply}
			<Post event={reply} direct={true} level={level + 1} />
		{:else}
			<span class="text-sm text-base-content/50">No replies yet!</span>
		{/each}
	</div>
</div>

<style>
	.reply-thread {
		margin-bottom: 0.5rem;
	}
</style>
