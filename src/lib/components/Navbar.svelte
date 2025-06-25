<script lang="ts">
	import Icon from '@iconify/svelte';
	import AnimestrLogo from '$lib/components/AnimestrLogo.svelte';
	import NavbarMenu from '$lib/components/Navbar/NavbarMenu.svelte';
	import { onMount } from 'svelte';
	import UserAvatar from './UserAvatar.svelte';
	import { nostr } from '$lib/stores/signerStore.svelte';
	import { goto } from '$app/navigation';

	// TODO: implement easy search functionality using names, need to figure out a faster algorithm than querying nostr, ndk is too slow

	let search = $state('');
	let searchDialog: HTMLDialogElement | null = null;
	let searchInput: HTMLInputElement | null = null;

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
		} else {
			goto(`/anime/${search}`);
		}
		searchDialog?.close();
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
		<a href="/watch-list">
			<UserAvatar user={nostr.activeUser} />
		</a>
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
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
