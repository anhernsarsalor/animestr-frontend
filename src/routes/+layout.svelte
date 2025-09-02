<script lang="ts">
	import { onMount } from 'svelte';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

	injectAnalytics();
	injectSpeedInsights();

	import Loading from '$lib/components/Loading.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import { allAnimeEvents } from '$lib/anime';
	import { initSigner } from '$lib/stores/signerStore.svelte';
	import Toast from '$lib/components/Toast.svelte';

	let loading = $state(true);

	allAnimeEvents.subscribe();

	onMount(async () => {
		loading = false;
		await initSigner();
	});
</script>

<svelte:head>
	<title>Animestr</title>
	<meta name="description" content="The decentralized anime focused platform" />
	<meta property="og:url" content="https://animestr.xyz" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Animestr" />
	<meta property="og:description" content="The decentralized anime focused platform" />
	<meta property="og:image" content="/" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta property="twitter:domain" content="animestr.xyz" />
	<meta property="twitter:url" content="https://animestr.xyz" />
	<meta name="twitter:title" content="Animestr" />
	<meta name="twitter:description" content="The decentralized anime focused platform" />
	<meta name="twitter:image" content="/" />
</svelte:head>

<Toast />

{#if loading}
	<Loading />
{:else}
	<div class="bg-base-100 text-base-content flex min-h-screen flex-col">
		<Navbar />

		<div class="container mx-auto mt-[92px] max-w-4xl">
			<slot />
		</div>

		<footer class="footer bg-base-200 text-base-content p-4">
			<div class="mx-auto text-center text-xs opacity-70">
				<p>Powered by Nostr | {new Date().getFullYear()} Animestr</p>
			</div>
		</footer>
	</div>
{/if}
