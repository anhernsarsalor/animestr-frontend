<script lang="ts">
	import AnimestrLogo from '$lib/components/AnimestrLogo.svelte';
	import EventList from '$lib/components/EventList.svelte';
	import NewPostEditor from '$lib/components/NewPostEditor.svelte';
	import { filterNoReplies } from '$lib/nostr/filterEvents.svelte';
	import { ndk } from '$lib/stores/signerStore.svelte';

	const animeCreators = [
		'bd2f96f56347abe90464d1c220d093e325fe41212926b9eb8c056c5f6ab08280',
		'4a8eb573952d3a8a4d1f65d2652b8a5cc9a03d1ac716d8192b4bcc6615968c60'
	];

	const events = ndk.$subscribe(
		[
			{ kinds: [1], '#t': ['animestr'] },
			{ kinds: [1], authors: animeCreators }
		],
		{
			closeOnEose: false,
			autoStart: true
		}
	);

	const filteredEvents = $derived(events.filter(filterNoReplies));
</script>

<div class="container mx-auto max-w-4xl">
	<div class="navbar bg-base-100 rounded-box mb-6 shadow-lg">
		<div class="navbar-start">
			<label for="main-drawer" class="btn btn-square btn-ghost drawer-button lg:hidden">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					class="inline-block h-5 w-5 stroke-current"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 12h16M4 18h16"
					></path>
				</svg>
			</label>
			<div class="ml-2 lg:ml-0">
				<AnimestrLogo />
				<p class="text-sm opacity-70">Explore anime discussions on Nostr</p>
			</div>
		</div>
	</div>

	<NewPostEditor />

	<div class="mb-6">
		<EventList events={filteredEvents} header="Recent Posts" emptyMessage="No events found." />
	</div>
</div>
