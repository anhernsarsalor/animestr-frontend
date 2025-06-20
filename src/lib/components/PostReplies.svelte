<script lang="ts">
	import { ndk } from '$lib/stores/signerStore.svelte';
	import type { NDKEvent } from '@nostr-dev-kit/ndk';
	import Post from './Post.svelte';
	import { filterOnlyDirectReplies } from '$lib/nostr/filterEvents.svelte';
	import { scale } from 'svelte/transition';
	import NewPostEditor from './NewPostEditor.svelte';

	let { parent }: { parent: NDKEvent } = $props();

	let replies = $derived(
		ndk.$subscribe([
			{
				kinds: [1],
				'#e': [parent.id]
			}
		])
	);
	let filteredReplies = $derived(replies.filter(filterOnlyDirectReplies(parent)));
</script>

<div
	class="card bg-base-200 border-base-300 border shadow-sm transition-all hover:shadow-md"
	transition:scale
>
	<NewPostEditor replyTo={parent} />
	{#each filteredReplies as reply}
		<Post event={reply} />
	{:else}
		No replies yet!
	{/each}
</div>
