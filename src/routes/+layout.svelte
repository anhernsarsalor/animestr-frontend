<script lang="ts">
	import { onMount } from 'svelte';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

	injectAnalytics();
	injectSpeedInsights();

	import Loading from '$lib/components/Loading.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import { loadAllAnimeEvents } from '$lib';
	import { initSigner } from '$lib/stores/signerStore.svelte';

	let loading = $state(true);

	loadAllAnimeEvents();

	onMount(async () => {
		loading = false;
		await initSigner();
	});
</script>

<svelte:head>
	<title>Animestr</title>
</svelte:head>

{#if loading}
	<Loading />
{:else}
	<div class="bg-base-100 text-base-content flex min-h-screen flex-col">
		<Navbar />

		<div class="container mx-auto mt-4 max-w-4xl">
			<slot />
		</div>

		<footer class="footer bg-base-200 text-base-content p-4">
			<div class="mx-auto text-center text-xs opacity-70">
				<p>Powered by Nostr | {new Date().getFullYear()} Animestr</p>
			</div>
		</footer>
	</div>
{/if}
