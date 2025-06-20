<script lang="ts">
	import { initSigner, nostr } from '$lib/stores/signerStore.svelte';
	import { init as initNostrLogin } from 'nostr-login';
	import { onMount } from 'svelte';

	import Sidebar from '$lib/components/Sidebar.svelte';
	import Loading from '$lib/components/Loading.svelte';
	import UserAvatar from '$lib/components/UserAvatar.svelte';

	let loading = true;

	onMount(async () => {
		await initNostrLogin({
			methods: ['connect', 'extension', 'local'],
			title: 'Animestr',
			description: 'Animestr is a nostr client focused on anime',
			noBanner: true,
			localSignup: true,
			signupRelays: 'wss://anime.nostr1.com'
		});
		await initSigner();
		loading = false;
	});
</script>

{#if loading}
	<Loading />
{:else}
	<div class="bg-base-100 text-base-content flex min-h-screen flex-col">
		<header class="navbar bg-base-200 sticky top-0 z-50 shadow-md">
			<div class="navbar-start">
				<a href="/" class="btn btn-ghost text-primary text-xl font-bold normal-case">
					<span class="text-secondary">Anime</span>str
				</a>
			</div>
			<div class="navbar-end">
				<a href="/watch-list">
					<UserAvatar user={nostr.activeUser} />
				</a>
			</div>
		</header>

		<main class="animate-fade-in container mx-auto flex-grow p-4 md:px-6 lg:px-8">
			<div class="drawer lg:drawer-open">
				<input id="main-drawer" type="checkbox" class="drawer-toggle" />
				<div class="drawer-content p-4">
					<slot />
				</div>
				<div class="drawer-side">
					<label for="main-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
					<Sidebar />
				</div>
			</div>
		</main>

		<footer class="footer bg-base-200 text-base-content p-4">
			<div class="mx-auto text-center text-xs opacity-70">
				<p>Powered by Nostr | {new Date().getFullYear()} Animestr</p>
			</div>
		</footer>
	</div>
{/if}
