<script lang="ts">
	import EventList from '$lib/components/EventList.svelte';
	import NewPostEditor from '$lib/components/NewPostEditor.svelte';
	import { filterNoReplies } from '$lib/nostr/filterEvents.svelte';
	import { Filter, Kind, KindStandard, PublicKey } from '@rust-nostr/nostr-sdk';

	const animeCreators = ['bd2f96f56347abe90464d1c220d093e325fe41212926b9eb8c056c5f6ab08280'].map(
		PublicKey.parse
	);

	let query = $state([
		new Filter().kind(Kind.fromStd(KindStandard.TextNote)).hashtag('animestr').limit(20),
		new Filter().kind(Kind.fromStd(KindStandard.TextNote)).authors(animeCreators).limit(20)
	]);

	function reloadQuery() {
		query = [...query];
	}
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
				<h1 class="text-2xl font-bold">
					<span class="text-secondary">Anime</span><span class="text-primary">str</span>
					<span class="badge badge-accent badge-sm ml-2">Alpha</span>
				</h1>
				<p class="text-sm opacity-70">Explore anime discussions on Nostr</p>
			</div>
		</div>
	</div>

	<NewPostEditor onPost={reloadQuery} />

	<div class="mb-6">
		<EventList
			{query}
			filterFn={filterNoReplies}
			header="Recent Posts"
			emptyMessage="No events found."
		/>
	</div>
</div>
