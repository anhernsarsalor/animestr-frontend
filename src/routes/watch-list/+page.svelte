<script>
	import WatchList from '$lib/components/WatchList.svelte';
	import { nostr } from '$lib/stores/signerStore.svelte';

	let loggedIn = $derived(nostr.activeUser !== undefined);
</script>

{#if !loggedIn}
	<div class="flex h-screen items-center justify-center">
		<h1 class="text-xl">Please login to view your watch list</h1>
	</div>
{:else}
	<WatchList />
{/if}
