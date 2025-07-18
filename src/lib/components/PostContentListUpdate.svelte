<script lang="ts">
	import { watchStatusToName } from '$lib/utils.svelte';
	import AnimeReference from './AnimeReference.svelte';
	import type { Event } from 'nostr-tools';

	let { event }: { event: Event } = $props();

	let anime = $derived(event.tags.filter((x) => x[0] === 'i'));
	let lastEntry = $derived(anime[anime.length - 1]);
	let lastEntryIdentifier = $derived(lastEntry[1].split(':'));
	let lastEntrySource = $derived(lastEntryIdentifier[0]);
	let lastEntryId = $derived(lastEntryIdentifier[1]);
	let score = $derived(parseFloat(lastEntry[2]));
	let status = $derived(watchStatusToName(lastEntry[3]));
</script>

<h1 class="text-info text-center text-2xl">Watch List Update</h1>
<div class="card bg-base-300 p-2">
	<div class="card-body">
		<AnimeReference source={lastEntrySource} animeId={lastEntryId} {score} {status} />
	</div>
</div>
