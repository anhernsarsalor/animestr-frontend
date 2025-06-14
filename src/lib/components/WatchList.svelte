<script lang="ts">
	import parseAnimeEvent from '$lib/nostr/parseAnimeEvent';
	import type { AnimeData } from '$lib/nostr/types';
	import { createEventListStore } from '$lib/stores/eventListStore.svelte';
	import { Filter, Kind, EventBuilder, Tag } from '@rust-nostr/nostr-sdk';
	import { initSigner, nostr } from '$lib/stores/signerStore.svelte';

	interface AnimeEntry {
		identifier: string;
		score: number;
	}

	const watchListEvent = createEventListStore(
		new Filter().kind(new Kind(31111)).identifier('anime-list').author(nostr.pubkey!),
		() => true
	);
	const watchList = $derived(watchListEvent.events[0]);
	const watchListIdentifiers = $derived(
		watchList?.tags.filter('i').map((tag) => tag.asVec()[1]) || []
	);
	const watchListEntries = $derived<AnimeEntry[]>(
		watchList
			? watchList.tags.filter('i').map((tag) => {
					const [_, identifier, score] = tag.asVec();
					return { identifier, score: parseFloat(score) };
				})
			: []
	);

	const animeData = $derived(
		createEventListStore(
			new Filter().kind(new Kind(30010)).identifiers(watchListIdentifiers),
			() => true
		)
	);
	const identifierToAnimeEventMap = $derived(
		new Map<string, AnimeData>(
			animeData.events.map((event) => {
				const identifier = event.tags
					.filter('i')
					.find((t) => watchListIdentifiers.includes(t.asVec()[1]));
				return [identifier!.asVec()[1], parseAnimeEvent(event)!];
			})
		)
	);

	function normalizeScore(score: number) {
		return score.toFixed(2);
	}

	async function saveList() {
		await initSigner();
		const identifierTag = Tag.identifier('anime-list');
		const descriptionTag = Tag.description('My anime list');
		const animeMentions = watchListEntries.map((anime) =>
			Tag.parse(['i', anime.identifier, normalizeScore(anime.score)])
		);
		const listEvent = await new EventBuilder(new Kind(31111), '')
			.tags([identifierTag, descriptionTag, ...animeMentions])
			.sign(nostr.signer!);
		nostr.client!.sendEvent(listEvent);
	}
</script>

<ul class="watch-list">
	<button onclick={saveList}>Save</button>
	{#each watchListEntries as anime}
		<li class="anime-item">
			<a href="/anime/{anime.identifier}">
				<img
					src={identifierToAnimeEventMap.get(anime.identifier)?.thumbnail}
					alt={anime.identifier}
					class="anime-image"
				/>
			</a>
			<div class="anime-info">
				<a href="/anime/{anime.identifier}" class="title">
					{identifierToAnimeEventMap.get(anime.identifier)?.title}
				</a>
				<span class="anime-status">Finished</span>
				<span class="score">{anime.score.toFixed(2)}</span>
			</div>
		</li>
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
		grid-template-columns: 1fr auto auto;
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
