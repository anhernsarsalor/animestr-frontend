<script lang="ts">
	import EventList from '$lib/components/EventList.svelte';
	import NewPostEditor from '$lib/components/NewPostEditor.svelte';
	import { filterNoReplies } from '$lib/nostr/filterEvents.svelte';
	import { nostr } from '$lib/stores/signerStore.svelte';
	import { timelineLoader } from '$lib';

	const animeCreators = [
		'bd2f96f56347abe90464d1c220d093e325fe41212926b9eb8c056c5f6ab08280',
		'4a8eb573952d3a8a4d1f65d2652b8a5cc9a03d1ac716d8192b4bcc6615968c60'
	];

	const timeline = timelineLoader(
		{
			kinds: [1, 24, 31111],
			'#t': ['animestr']
		},
		{
			kinds: [1],
			'#p': animeCreators
		},
		{
			kinds: [30618],
			authors: ['74fb3ef27cd8985d7fefc6e94d178290275f5492557b4a166ab9cd1458adabc7'],
			'#d': ['animestr-web']
		}
	).pipe(filterNoReplies);
</script>

<svelte:head>
	<title>Home | Animestr</title>
	<meta property="og:title" content="Home | Animestr" />
	<meta name="twitter:title" content="Home | Animestr" />
</svelte:head>

{#if nostr.activeUser}
	<NewPostEditor />
{/if}

<div class="mb-6">
	<EventList events={timeline} header="Recent Posts" />
</div>
