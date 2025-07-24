<script lang="ts">
	import type { AnimeEntry } from '$lib';
	import { watchStatusToName } from '$lib/utils.svelte';
	import WatchListGroupItem from './WatchListGroupItem.svelte';

	let {
		anime,
		editScore,
		editStatus,
		editProgress
	}: {
		anime: AnimeEntry[];
		editScore: (anime: AnimeEntry) => void;
		editStatus: (anime: AnimeEntry) => void;
		editProgress: (anime: AnimeEntry) => void;
	} = $props();
</script>

<h1 class="text-xl">{watchStatusToName(anime[0].status)}</h1>
<ul class="watch-list">
	{#each anime as anime}
		{#key anime.identifier}
			<WatchListGroupItem
				{anime}
				editProgress={() => editProgress(anime)}
				editScore={() => editScore(anime)}
				editStatus={() => editStatus(anime)}
			/>
		{/key}
	{/each}
</ul>

<style>
	.watch-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}
</style>
