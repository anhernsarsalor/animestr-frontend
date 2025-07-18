<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import WatchList from '$lib/components/WatchList.svelte';
	import { getUserFromMention } from '$lib/utils.svelte';

	let user = $derived(getUserFromMention(page.params.id));
</script>

<button class="btn btn-secondary" onclick={() => goto(`/user/${page.params.id}`)}>
	Back to Profile
</button>

<WatchList pubkey={user.pubkey} />
