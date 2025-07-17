<script lang="ts">
	import { onMount } from 'svelte';

	import Loading from '$lib/components/Loading.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import { loadAllAnimeEvents, timelineLoaderToSvelteReadable } from '$lib';

	let loading = $state(true);

	loadAllAnimeEvents();

	onMount(async () => {
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
