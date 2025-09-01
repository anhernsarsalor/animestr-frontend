<script lang="ts">
	import { page } from '$app/state';
	import { eventLoader } from '$lib';
	import Loading from '$lib/components/Loading.svelte';
	import Post from '$lib/components/Post.svelte';

	let eventId = $derived(page.params.id);

	let event = $derived(eventLoader(eventId));
</script>

{#if !$event}
	<Loading />
{:else}
	{#key $event.id}
		<Post event={$event} direct />
	{/key}
{/if}
