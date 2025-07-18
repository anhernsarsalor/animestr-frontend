<script lang="ts">
	import { initSigner } from '$lib/stores/signerStore.svelte';
	import { init as initNostrLogin } from 'nostr-login';
	import Icon from '@iconify/svelte';
	import AnimestrLogo from '$lib/components/AnimestrLogo.svelte';
	import NavbarMenu from '$lib/components/Navbar/NavbarMenu.svelte';
	import { onMount } from 'svelte';
	import UserAvatar from './UserAvatar.svelte';
	import { nostr } from '$lib/stores/signerStore.svelte';
	import { goto } from '$app/navigation';
	import Loading from './Loading.svelte';
	import AnimeSearchResults from './AnimeSearchResults.svelte';
	import type { AnimeData } from '$lib/nostr/types';

	let search = $state('');
	let searchDialog: HTMLDialogElement | null = null;
	let searchInput: HTMLInputElement | null = null;
	let selectedAnime: AnimeData | null = $state(null);

	$effect(() => {
		if (selectedAnime) goto(`/anime/${selectedAnime.identifiers[0].value}`);
	});

	function openSearchDialog() {
		searchDialog?.showModal();
		setTimeout(() => {
			// TODO: figure out how to listen for showModal completion instead
			searchInput?.focus();
		}, 100);
	}

	onMount(() => {
		window.addEventListener('keydown', (event) => {
			if (event.ctrlKey && event.key === 'p') {
				event.preventDefault();
				openSearchDialog();
			}
		});
	});

	function keyPress(e: KeyboardEvent) {
		if (e.key != 'Enter') return;
		if (search.startsWith('npub') || search.startsWith('nprofile')) {
			goto(`/user/${search}`);
		}
		searchDialog?.close();
	}

	let isLoggingIn = $state(false);

	async function login() {
		isLoggingIn = true;
		await initNostrLogin({
			methods: ['connect', 'extension', 'local'],
			title: 'Animestr',
			description: 'Animestr is a nostr client focused on anime',
			noBanner: true,
			localSignup: true,
			signupRelays: 'wss://anime.nostr1.com'
		});
		await initSigner();
		isLoggingIn = false;
	}
</script>

<div class="navbar bg-base-300 shadow-sm">
	<NavbarMenu />
	<div class="navbar-center">
		<a href="/">
			<AnimestrLogo />
		</a>
	</div>
	<div class="navbar-end">
		<button onclick={openSearchDialog} class="btn btn-ghost btn-circle">
			<Icon icon="line-md:search-twotone" width="32" />
		</button>
		<button
			class="btn btn-ghost btn-circle"
			onclick={() => alert('Notifications are not implemented yet')}
		>
			<Icon icon="line-md:bell-twotone-loop" width="32" />
		</button>
		<div class="mr-4">
			{#if nostr.activeUser}
				<button popovertarget="user-menu">
					<UserAvatar user={nostr.activeUser} />
				</button>
			{:else}
				<button onclick={login} class="btn btn-ghost btn-circle">
					{#if isLoggingIn}
						<Loading inline />
					{:else}
						Login
					{/if}
				</button>
			{/if}
		</div>
		{#if nostr.activeUser}
			<ul
				class="dropdown menu rounded-box bg-base-100 w-52 text-xl shadow-sm"
				popover
				id="user-menu"
				onclick={() => document.getElementById('user-menu')?.hidePopover()}
			>
				<li>
					<a href="/user/{nostr.activeUser?.npub}">
						<Icon icon="line-md:person-twotone" /> Profile
					</a>
				</li>
				<li>
					<a href="/user/{nostr.activeUser?.npub}/watch-list">
						<Icon icon="line-md:watch-twotone" /> Watch List
					</a>
				</li>
				<li>
					<a href="/settings">
						<Icon icon="line-md:pencil-twotone" /> Settings <!-- TODO: find a better icon for setting -->
					</a>
				</li>
				<li>
					<a href="/logout">
						<Icon icon="line-md:close-circle-twotone" /> Logout
					</a>
				</li>
			</ul>
		{/if}
	</div>
</div>

<dialog bind:this={searchDialog} class="modal">
	<div class="modal-box">
		<h3 class="text-lg font-bold">Search</h3>
		<p>Search for an anime, or a nostr user by putting the name of the anime or the npub below</p>
		<label class="input mt-2 w-full">
			<Icon icon="line-md:search-twotone" />
			<input
				bind:this={searchInput}
				type="search"
				placeholder="Search for an anime or user"
				class="grow"
				bind:value={search}
				onkeypress={keyPress}
			/>
			<kbd class="kbd kbd-sm">Ctrl</kbd>
			<kbd class="kbd kbd-sm">P</kbd>
		</label>
		<div class="mt-4 max-h-[400px] overflow-y-auto">
			<AnimeSearchResults query={search} bind:selectedAnime />
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
