<script lang="ts">
	import {
		createEvent,
		emojiPacksSvelteReadable,
		emojiPreferenceEvent,
		loadUserEmojiPacks,
		type EmojiPack
	} from '$lib';
	import Loading from '$lib/components/Loading.svelte';
	import { nostr } from '$lib/stores/signerStore.svelte';
	import type { EventTemplate } from 'nostr-tools';
	import { readable } from 'svelte/store';

	const allEmojiPacks = emojiPacksSvelteReadable();
	let userEmojiPreferenceEvent = $derived(
		nostr.activeUser ? emojiPreferenceEvent(nostr.activeUser) : readable(null)
	);
	let userEmojiPacks = $derived(
		nostr.activeUser ? loadUserEmojiPacks(nostr.activeUser) : readable([])
	);

	let page = $state(0);
	let filter = $state('');

	$effect(() => {
		if (filter || !filter) page = 0; // XXX: filter || !filter is a hack for making svelte happy and work both when there is a filter and when there isn't
	});

	let filteredEmojiPacks = $derived(
		filter === ''
			? $allEmojiPacks
			: $allEmojiPacks.filter(
					(p) =>
						p.author.toLowerCase() === filter.toLowerCase() ||
						p.title.toLowerCase().includes(filter.toLowerCase()) ||
						p.emoji.some((e) => e[0].toLowerCase().includes(filter.toLowerCase()))
				)
	);
	let itemsInPage = $derived(filteredEmojiPacks.slice(page * 10, (page + 1) * 10));

	function reloadUserEmojiPacks() {
		userEmojiPreferenceEvent = emojiPreferenceEvent(nostr.activeUser!);
		userEmojiPacks = loadUserEmojiPacks(nostr.activeUser!);
	}

	async function subscribe(pack: EmojiPack) {
		let preferenceEvent: EventTemplate | Event = $userEmojiPreferenceEvent
			? $userEmojiPreferenceEvent
			: {
					content: '',
					kind: 10030,
					tags: [['alt', 'Emoji selection']],
					created_at: Math.floor(Date.now() / 1000)
				};
		if (
			preferenceEvent.tags.some(
				(t) => t[0] === 'a' && t[1] === `30030:${pack.author}:${pack.identifier}`
			)
		)
			return;
		preferenceEvent.tags.push(['a', `30030:${pack.author}:${pack.identifier}`]);
		preferenceEvent.created_at = Math.floor(Date.now() / 1000);
		await createEvent(preferenceEvent);
		reloadUserEmojiPacks();
	}

	async function unsubscribe(pack: EmojiPack) {
		if (!$userEmojiPreferenceEvent) return;
		let preferenceEvent = $userEmojiPreferenceEvent;
		preferenceEvent.tags = preferenceEvent.tags.filter(
			(x) => !(x[0] === 'a' && x[1] === `30030:${pack.author}:${pack.identifier}`)
		);
		preferenceEvent.created_at = Math.floor(Date.now() / 1000);
		await createEvent(preferenceEvent);
		reloadUserEmojiPacks();
	}
</script>

<svelte:head>
	<title>Emoji Packs | Animestr</title>
</svelte:head>

<h1 class="text-2xl">Emoji Packs</h1>

<div class="hidden">
	{JSON.stringify($userEmojiPreferenceEvent)}
	<!-- TODO: don't do this, find a better way -->
</div>

<input
	type="search"
	class="input input-bordered mt-4 mb-4 w-full"
	placeholder="Filter"
	bind:value={filter}
/>

<div class="mb-4 flex justify-between">
	{#if page > 0}
		<button class="btn btn-primary" onclick={() => (page = page - 1)}>Previous</button>
	{:else}
		<span></span>
	{/if}
	{#if (page + 1) * 10 < filteredEmojiPacks.length}
		<button class="btn btn-secondary" onclick={() => (page = page + 1)}>Next</button>
	{/if}
</div>

<div class="flex flex-row flex-wrap justify-center gap-2">
	{#each itemsInPage as pack}
		{#key `${pack.author}:${pack.identifier}`}
			<div
				class="card bg-base-300 w-96"
				class:bg-primary={$userEmojiPacks.find(
					(x) => x[0] === pack.author && x[1] === pack.identifier
				)}
				class:text-primary-content={$userEmojiPacks.find(
					(x) => x[0] === pack.author && x[1] === pack.identifier
				)}
			>
				<div class="card-body">
					<h2 class="card-title">
						{pack.title}
					</h2>
					<div class="flex flex-row flex-wrap gap-2">
						{#each pack.emoji as emoji}
							<img src={emoji[1]} alt={emoji[0]} class="max-h-16 w-16" />
						{/each}
					</div>
					{#if nostr.activeUser}
						<div class="card-actions justify-end">
							{#if $userEmojiPacks.find((x) => x[0] === pack.author && x[1] === pack.identifier)}
								<button class="btn btn-secondary" onclick={() => unsubscribe(pack)}>
									Unsubscribe
								</button>
							{:else}
								<button class="btn btn-primary" onclick={() => subscribe(pack)}> Subscribe </button>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		{/key}
	{:else}
		{#if filter}
			<p>No emoji packs found with filter "{filter}"</p>
		{:else}
			<Loading inline />
		{/if}
	{/each}
</div>

<div class="flex justify-between">
	{#if page > 0}
		<button class="btn btn-primary" onclick={() => (page = page - 1)}>Previous</button>
	{:else}
		<span></span>
	{/if}
	{#if (page + 1) * 10 < filteredEmojiPacks.length}
		<button class="btn btn-secondary" onclick={() => (page = page + 1)}>Next</button>
	{/if}
</div>
