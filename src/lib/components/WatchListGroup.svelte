<script lang="ts">
	import type { AnimeEntry } from '$lib';
	import { WatchStatus, watchStatusToName } from '$lib/utils.svelte';
	import { fade } from 'svelte/transition';

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
			<li class="anime-item" in:fade out:fade>
				<a href="/anime/{anime.identifier}">
					<img src={anime.anime?.thumbnail} alt={anime.identifier} class="anime-image" />
				</a>
				<div class="anime-info">
					<a href="/anime/{anime.identifier}" class="title">
						{anime.anime?.title}
					</a>
					{#if watchStatusToName(group) !== watchStatusToName(WatchStatus.Completed)}
						<button class="anime-progress btn btn-ghost" onclick={() => editProgress(anime)}>
							{anime.progress}/{anime.anime?.episodes}
						</button>
					{:else}
						<span></span>
					{/if}
					<button class="anime-status btn btn-ghost" onclick={() => editStatus(anime)}>
						{watchStatusToName(group)}
					</button>
					<button
						style:color={anime.score.color}
						class="btn score btn-ghost"
						onclick={() => editScore(anime)}
					>
						{anime.score.toString()}
					</button>
				</div>
			</li>
		{/key}
	{/each}
</ul>

<style>
	.watch-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.anime-item {
		display: flex;
		align-items: center;
		padding: 10px 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.anime-image {
		width: 50px;
		height: 75px;
		object-fit: cover;
		margin-right: 15px;
		border-radius: 5px;
	}

	.anime-info {
		display: grid;
		grid-template-columns: 1fr auto auto auto;
		gap: 2em;
		flex-grow: 1;
	}

	.title {
		font-weight: 500;
		font-size: 1rem;
	}

	.score {
		font-weight: 700;
		color: #1d9bf0;
		font-size: 1rem;
		white-space: nowrap;
	}

	.anime-status {
		font-weight: 500;
		font-size: 0.8rem;
		color: #666;
	}
</style>
