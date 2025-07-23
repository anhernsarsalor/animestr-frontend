<script lang="ts">
	import type { Event } from 'nostr-tools';
	import { zapsForEvent } from '$lib';
	import PostZap from './PostZap.svelte';

	let { event }: { event: Event } = $props();

	let zaps = zapsForEvent(event);
</script>

<div class="flex flex-col gap-2">
	{#each $zaps as zap}
		<PostZap {zap} />
	{/each}
</div>
