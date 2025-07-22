<script lang="ts">
	import { watchListLoader, type AnimeEntry } from '$lib';
	import type { AnimeData } from '$lib/nostr/types';
	import { initSigner, ndk, nostr } from '$lib/stores/signerStore.svelte';
	import { NDKEvent } from '@nostr-dev-kit/ndk';
	import Icon from '@iconify/svelte';
	import AnimeSearchResults from './AnimeSearchResults.svelte';
	import { animeScore, WatchStatus } from '$lib/utils.svelte';
	import { from, groupBy, toArray, map, mergeMap, Observable } from 'rxjs';
	import WatchListGroup from './WatchListGroup.svelte';

	let { pubkey }: { pubkey: string } = $props();

	const watchList = watchListLoader(pubkey);

	const groupedWatchList = $derived(
		from($watchList).pipe(
			groupBy((anime: AnimeEntry) => anime.status),
			mergeMap((group) =>
				group.pipe(
					toArray(),
					map((array) => [group.key, array])
				)
			),
			toArray(),
			map((pairs) =>
				pairs.reduce((acc, [k, v]) => {
					acc[k] = v;
					return acc;
				}, {})
			)
		)
	) as unknown as Observable<{ [w: WatchStatus]: AnimeEntry[] }>;

	async function saveList() {
		if (pubkey !== ndk.signer?.pubkey!) return;
		await initSigner();
		const listEvent = new NDKEvent(ndk, {
			kind: 31111,
			tags: [
				['t', 'animestr'],
				['d', 'anime-list'],
				['description', 'My anime list'],
				...$watchList.map((anime) => [
					'i',
					anime.identifier,
					anime.score.toString(),
					anime.status.toString(),
					anime.progress.toString()
				])
			]
		});
		await listEvent.publishReplaceable();
	}

	let addDialog: HTMLDialogElement | undefined;
	let editScoreDialog: HTMLDialogElement | undefined;
	let editStatusDialog: HTMLDialogElement | undefined;
	let editProgressDialog: HTMLDialogElement | undefined;

	let selectedAnime: AnimeData | null = $state(null);
	let animeSearch = $state('');
	let newAnimeScore = $state(animeScore(50));
	let newAnimeStatus = $state(WatchStatus.Completed);
	let newAnimeProgress = $state(0);

	function doAddAnime() {
		if (animeSearch.length < 2) return;
		if (!selectedAnime) return;
		const indexOfExisting = $watchList.findIndex((anime) =>
			selectedAnime!.identifiers.some((i) => anime.identifier === i.value)
		);
		if (indexOfExisting !== -1) $watchList.splice(indexOfExisting, 1);
		$watchList.push({
			identifier: selectedAnime!.identifiers[0].value,
			status: newAnimeStatus,
			score: newAnimeScore,
			anime: selectedAnime!,
			progress: newAnimeProgress
		});
		$watchList = $watchList;
		animeSearch = '';
		newAnimeScore = animeScore(50);
		newAnimeStatus = WatchStatus.Completed;
		newAnimeProgress = 0;
		addDialog?.close();
		saveList();
	}

	let editingAnime = $state('');
	function editScore(anime: AnimeEntry) {
		if (pubkey !== ndk.signer?.pubkey!) return;
		newAnimeScore = animeScore(anime.score);
		editingAnime = anime.identifier;
		editScoreDialog?.showModal();
	}

	function editStatus(anime: AnimeEntry) {
		if (pubkey !== ndk.signer?.pubkey!) return;
		newAnimeStatus = WatchStatus.Completed;
		editingAnime = anime.identifier;
		editStatusDialog?.showModal();
	}

	function editProgress(anime: AnimeEntry) {
		if (pubkey !== ndk.signer?.pubkey!) return;
		newAnimeProgress = 0;
		editingAnime = anime.identifier;
		editProgressDialog?.showModal();
	}

	function doEditScore() {
		const indexOfExisting = $watchList.findIndex((anime) => anime.identifier === editingAnime);
		if (indexOfExisting === -1) return;
		const status = $watchList[indexOfExisting].status;
		const progress = $watchList[indexOfExisting].progress;
		$watchList.splice(indexOfExisting, 1);
		$watchList.push({
			identifier: editingAnime,
			score: newAnimeScore,
			status,
			anime: selectedAnime!,
			progress
		});
		$watchList = $watchList;
		editingAnime = '';
		newAnimeScore = animeScore(50);
		editScoreDialog?.close();
		saveList();
	}

	function doEditStatus() {
		const indexOfExisting = $watchList.findIndex((anime) => anime.identifier === editingAnime);
		if (indexOfExisting === -1) return;
		const score = $watchList[indexOfExisting].score;
		const progress = $watchList[indexOfExisting].progress;
		$watchList.splice(indexOfExisting, 1);
		$watchList.push({
			identifier: editingAnime,
			score,
			status: newAnimeStatus,
			anime: selectedAnime!,
			progress
		});
		$watchList = $watchList;
		editingAnime = '';
		newAnimeStatus = WatchStatus.Completed;
		editStatusDialog?.close();
		saveList();
	}

	function doEditProgress() {
		const indexOfExisting = $watchList.findIndex((anime) => anime.identifier === editingAnime);
		if (indexOfExisting === -1) return;
		const score = $watchList[indexOfExisting].score;
		const status = $watchList[indexOfExisting].status;
		$watchList.splice(indexOfExisting, 1);
		$watchList.push({
			identifier: editingAnime,
			score,
			status,
			anime: selectedAnime!,
			progress: newAnimeProgress
		});
		$watchList = $watchList;
		editingAnime = '';
		newAnimeProgress = 0;
		editProgressDialog?.close();
		saveList();
	}
</script>

<dialog bind:this={addDialog} class="modal">
	<div class="modal-box">
		<fieldset class="fieldset bg-base-200 border-base-300 rounded-box border p-4">
			<legend class="fieldset-legend">Name</legend>
			<input class="input input-bordered w-full grow" type="text" bind:value={animeSearch} />
		</fieldset>
		<AnimeSearchResults query={animeSearch} bind:selectedAnime />
		<fieldset class="fieldset bg-base-200 border-base-300 rounded-box mt-4 border p-4">
			<legend class="fieldset-legend">Score</legend>
			<input
				class="range w-full"
				type="range"
				min={0}
				max={100}
				step={0.01}
				bind:value={newAnimeScore.value}
			/>
			<span style:color={newAnimeScore.color} class="text-bold">{newAnimeScore.toString()}</span>
		</fieldset>
		<fieldset class="fieldset bg-base-200 border-base-300 rounded-box border p-4">
			<legend class="fieldset-legend">Status</legend>
			<select class="select select-ghost" bind:value={newAnimeStatus}>
				<option value={0}>Watching</option>
				<option value={1}>Completed</option>
				<option value={2}>On-Hold</option>
				<option value={3}>Dropped</option>
				<option value={4}>Planned</option>
			</select>
		</fieldset>
		<button class="btn btn-primary mt-4" onclick={doAddAnime}> Add! </button>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>

<dialog bind:this={editScoreDialog} class="modal">
	<div class="modal-box">
		<fieldset class="fieldset bg-base-200 border-base-300 rounded-box border p-4">
			<legend class="fieldset-legend">Edit Score</legend>
			<input
				class="range w-full"
				type="range"
				min={0}
				max={100}
				step={0.01}
				bind:value={newAnimeScore}
			/>
			<span style:color={newAnimeScore.color} class="text-bold">{newAnimeScore}</span>
		</fieldset>
		<button class="btn btn-primary mt-4" onclick={doEditScore}>Save</button>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>

<dialog bind:this={editStatusDialog} class="modal">
	<div class="modal-box">
		<fieldset class="fieldset bg-base-200 border-base-300 rounded-box border p-4">
			<legend class="fieldset-legend">Edit Status</legend>
			<select class="select select-ghost" bind:value={newAnimeStatus}>
				<option value={0}>Watching</option>
				<option value={1}>Completed</option>
				<option value={2}>On-Hold</option>
				<option value={3}>Dropped</option>
				<option value={4}>Planned</option>
			</select>
		</fieldset>
		<button class="btn btn-primary mt-4" onclick={doEditStatus}>Save</button>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>

<dialog bind:this={editProgressDialog} class="modal">
	<div class="modal-box">
		<fieldset class="fieldset bg-base-200 border-base-300 rounded-box border p-4">
			<legend class="fieldset-legend">Edit Progress</legend>
			<input min="0" class="input" type="number" bind:value={newAnimeProgress} />
		</fieldset>
		<button class="btn btn-primary mt-4" onclick={doEditProgress}>Save</button>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>

{#if pubkey === nostr.activeUser?.pubkey}
	<button class="btn btn-primary mt-4 mb-4 w-full" onclick={() => addDialog?.showModal()}>
		<Icon icon="mingcute:plus-fill" /> Add
	</button>
{/if}

{#each Object.entries($groupedWatchList) as group}
	<WatchListGroup group={group[0]} anime={group[1]} {editScore} {editStatus} {editProgress} />
{:else}
	<p>The list is either loading, or this user doesn't have any anime on their list :(</p>
{/each}
