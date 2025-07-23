<script lang="ts">
	import type { AnimeEntry } from '$lib';
	import { WatchStatus, watchStatusToName } from '$lib/utils.svelte';
	import WatchListGroupItem from './WatchListGroupItem.svelte';

	let {
		group,
		anime,
		editScore,
		editStatus,
		editProgress
	}: {
		group: WatchStatus;
		anime: AnimeEntry[];
		editScore: (anime: AnimeEntry) => void;
		editStatus: (anime: AnimeEntry) => void;
		editProgress: (anime: AnimeEntry) => void;
	} = $props();

	$inspect(WatchStatus.Completed, group);
</script>

<h1 class="text-xl">{watchStatusToName(group)}</h1>
<ul class="watch-list">
	{#each anime as anime}
		{#key anime.identifier}
			<WatchListGroupItem
				{group}
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
