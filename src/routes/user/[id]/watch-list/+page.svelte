<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import WatchList from '$lib/components/WatchList.svelte';
	import { normalizeToPubkey } from 'applesauce-core/helpers';

	let pubkey = $derived(normalizeToPubkey(page.params.id));
</script>

<button class="btn btn-secondary" onclick={() => goto(`/user/${pubkey}`)}> Back to Profile </button>

<WatchList {pubkey} />
