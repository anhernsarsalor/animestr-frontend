<script lang="ts">
	import Post from './Post.svelte';
	import { filterOnlyDirectReplies } from '$lib/nostr/filterEvents.svelte';
	import { scale } from 'svelte/transition';
	import NewPostEditor from './NewPostEditor.svelte';
	import type { Event } from 'nostr-tools';
	import { timelineLoaderToSvelteReadable } from '$lib';
	import { nostr } from '$lib/stores/signerStore.svelte';

	let { parent }: { parent: Event } = $props();

	let replies = timelineLoaderToSvelteReadable({
		kinds: [1],
		'#e': [parent.id]
	});

	let filteredReplies = $derived($replies.filter(filterOnlyDirectReplies(parent)));
</script>

<div
	class="card bg-base-200 border-base-300 border shadow-sm transition-all hover:shadow-md"
	transition:scale
>
	{#if nostr.activeUser}
		<NewPostEditor replyTo={parent} />
	{/if}
	{#each filteredReplies as reply}
		<Post event={reply} />
	{:else}
		No replies yet!
	{/each}
</div>
