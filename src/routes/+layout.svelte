<script lang="ts">
	import { initSigner, nostr } from '$lib/stores/signerStore.svelte';
	import { init as initNostrLogin } from 'nostr-login';
	import { onMount } from 'svelte';

	import Loading from '$lib/components/Loading.svelte';
	import Navbar from '$lib/components/Navbar.svelte';

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
		<Navbar />

		<div class="container mx-auto max-w-4xl">
			<slot />
		</div>

		<footer class="footer bg-base-200 text-base-content p-4">
			<div class="mx-auto text-center text-xs opacity-70">
				<p>Powered by Nostr | {new Date().getFullYear()} Animestr</p>
			</div>
		</footer>
	</div>
{/if}
