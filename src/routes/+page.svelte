<script lang="ts">
	import AnimestrLogo from '$lib/components/AnimestrLogo.svelte';
	import EventList from '$lib/components/EventList.svelte';
	import NewPostEditor from '$lib/components/NewPostEditor.svelte';
	import { filterNoReplies } from '$lib/nostr/filterEvents.svelte';
	import { nostr } from '$lib/stores/signerStore.svelte';
	import { timelineLoaderToSvelteReadable } from '$lib';

	const animeCreators = [
		'bd2f96f56347abe90464d1c220d093e325fe41212926b9eb8c056c5f6ab08280',
		'4a8eb573952d3a8a4d1f65d2652b8a5cc9a03d1ac716d8192b4bcc6615968c60'
	];

	const timeline = timelineLoaderToSvelteReadable(
		{
			kinds: [1, 31111],
			'#t': ['animestr']
		},
		{
			kinds: [1],
			'#p': animeCreators
		}
	);

	const filteredEvents = $derived($timeline.filter(filterNoReplies));
</script>

{#if nostr.activeUser}
	<NewPostEditor />
{/if}

<div class="mb-6">
	<EventList events={filteredEvents} header="Recent Posts" />
</div>
