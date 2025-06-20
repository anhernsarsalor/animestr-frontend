<script lang="ts">
	import parseAnimeEvent from '$lib/nostr/parseAnimeEvent';
	import type { AnimeData } from '$lib/nostr/types';
	import { initSigner, ndk } from '$lib/stores/signerStore.svelte';
	import { NDKEvent, NDKKind, NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk';

	interface AnimeEntry {
		identifier: string;
		score: number;
	}

	const watchListEvent = $derived(
		ndk.$subscribe(
			[
				{
					kinds: [31111 as NDKKind],
					'#d': ['anime-list'],
					authors: [ndk.signer?.pubkey!]
				}
			],
			{
				closeOnEose: false,
				cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST
			}
		)
	);

	const watchList = $derived(watchListEvent[0]);
	const watchListIdentifiers = $derived(
		watchList?.tags.filter((e) => e[0] === 'i').map((tag) => tag[1]) || []
	);
	const watchListEntries = $derived<AnimeEntry[]>(
		watchList
			? watchList.tags
					.filter((e) => e[0] === 'i')
					.map((tag) => {
						const [_, identifier, score] = tag;
						return { identifier, score: parseFloat(score) };
					})
			: []
	);

	const animeInWatchList = $derived(
		ndk.$subscribe(
			[
				{
					kinds: [30010 as NDKKind],
					'#i': watchListIdentifiers
				}
			],
			{
				closeOnEose: false,
				cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST
			}
		)
	);

	const animeData = $derived(animeInWatchList.map(parseAnimeEvent).filter((e) => e !== null));
	const identifierToAnimeEventMap = $derived(
		new Map<string, AnimeData>(
			animeData.map((event) => {
				return [
					watchListIdentifiers.find((t) => event.identifiers.some((i) => i.value === t))!,
					event
				];
			})
		)
	);

	function normalizeScore(score: number) {
		return score.toFixed(2);
	}

	async function saveList() {
		await initSigner();
		const listEvent = new NDKEvent(ndk, {
			kind: 31111,
			tags: [
				['d', 'anime-list'],
				['description', 'My anime list'],
				...watchListEntries.map((anime) => ['i', anime.identifier, normalizeScore(anime.score)])
			]
		});
		await listEvent.publishReplaceable();
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
