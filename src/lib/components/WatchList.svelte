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
				['t', 'animestr'],
				['d', 'anime-list'],
				['description', 'My anime list'],
				...watchListEntries.map((anime) => ['i', anime.identifier, normalizeScore(anime.score)])
			]
		});
		await listEvent.publishReplaceable();
	}

	let addDialog: HTMLDialogElement | undefined;

	let newAnimeId = $state('');
	let newAnimeScore = $state(50);

	function parseOklch(v: string) {
		const parenthesesValues = v.match(/\(([^)]+)\)/);
		if (!parenthesesValues || parenthesesValues.length < 2) {
			return [];
		}
		return parenthesesValues[1].replace(/\%/g, '').split(' ').map(parseFloat);
	}

	function interpolateBetweenThreeValues(value: number, val1: number, val2: number, val3: number) {
		if (value <= 0.5) return val1 + (val2 - val1) * value * 2;
		return val2 + (val3 - val2) * (value - 0.5) * 2;
	}

	function colorScore(score: number) {
		const lowScoreColor = parseOklch(
			getComputedStyle(document.documentElement).getPropertyValue('--color-error')
		);
		const mediumScoreColor = parseOklch(
			getComputedStyle(document.documentElement).getPropertyValue('--color-warning')
		);
		const highScoreColor = parseOklch(
			getComputedStyle(document.documentElement).getPropertyValue('--color-success')
		);

		const normalScore = Math.min(Math.max(score / 100, 0), 1);
		const lValue = interpolateBetweenThreeValues(
			normalScore,
			lowScoreColor[0],
			mediumScoreColor[0],
			highScoreColor[0]
		);
		const cValue = interpolateBetweenThreeValues(
			normalScore,
			lowScoreColor[1],
			mediumScoreColor[1],
			highScoreColor[1]
		);
		const hValue = interpolateBetweenThreeValues(
			normalScore,
			lowScoreColor[2],
			mediumScoreColor[2],
			highScoreColor[2]
		);

		return 'oklch(' + lValue.toFixed(2) + '% ' + cValue.toFixed(2) + ' ' + hValue.toFixed(2) + ')';
	}

	function doAddAnime() {
		const indexOfExisting = watchListEntries.findIndex((anime) => anime.identifier === newAnimeId);
		if (indexOfExisting !== -1) watchListEntries.splice(indexOfExisting, 1);
		watchListEntries.push({
			identifier: newAnimeId,
			score: newAnimeScore
		});
		newAnimeId = '';
		newAnimeScore = 50;
		addDialog?.close();
	}
</script>

<dialog bind:this={addDialog} class="modal">
	<div class="modal-box">
		<fieldset class="fieldset bg-base-200 border-base-300 rounded-box border p-4">
			<legend class="fieldset-legend">Identifier</legend>
			<input class="input input-bordered w-full grow" type="text" bind:value={newAnimeId} />
			<p class="label">In the future this will have a proper search functionality</p>
		</fieldset>
		<fieldset class="fieldset bg-base-200 border-base-300 rounded-box mt-4 border p-4">
			<legend class="fieldset-legend">Score</legend>
			<input
				class="range w-full"
				type="range"
				min={0}
				max={100}
				step={0.01}
				bind:value={newAnimeScore}
			/>
			<span style:color={colorScore(newAnimeScore)} class="text-bold">{newAnimeScore}</span>
		</fieldset>
		<button class="btn btn-primary mt-4" onclick={doAddAnime}> Add! </button>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>

<ul class="watch-list">
	<button onclick={saveList}>Save</button>
	<button onclick={addDialog?.showModal()}>Add</button>
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
