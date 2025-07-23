<script lang="ts">
	import { page } from '$app/state';
	import { eventLoader } from '$lib';
	import Loading from '$lib/components/Loading.svelte';
	import Post from '$lib/components/Post.svelte';

	let eventId = page.params.id;

	let event = eventLoader(eventId);
</script>

{#if !$event}
	<Loading />
{:else}
	<Post event={$event} />
{/if}
