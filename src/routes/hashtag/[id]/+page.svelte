<script lang="ts">
	import EventList from '$lib/components/EventList.svelte';
	import { Filter, Kind, KindStandard } from '@rust-nostr/nostr-sdk';
	import { page } from '$app/state';
	import { filterNoReplies } from '$lib/nostr/filterEvents.svelte';

	const { data } = $props();
	let hashtag = $derived(data.hashtag || '');

	$inspect(hashtag);

	const query = $derived(
		new Filter().kind(Kind.fromStd(KindStandard.TextNote)).hashtag(hashtag).limit(20)
	);
</script>

<svelte:head>
	<title>#{hashtag || ''} | Hashtag Feed</title>
</svelte:head>

<div class="container mx-auto max-w-3xl p-4">
	<div class="bg-base-200 mb-6 rounded-lg p-6 shadow-sm">
		<h1 class="mb-2 flex items-center text-3xl font-bold">
			<span class="text-blue-500">#{hashtag || ''}</span>
		</h1>
		<p class="text-base-content/70 mb-4">Posts tagged with #{hashtag || ''}</p>

		<form action="/hashtag" method="GET" class="mt-3 flex gap-2">
			<div class="relative flex-1">
				<input
					type="text"
					name="tag"
					placeholder="Search for another hashtag"
					class="input input-bordered w-full pr-10"
					aria-label="Search hashtags"
				/>
				<button type="submit" class="absolute top-1/2 right-3 -translate-y-1/2" aria-label="Search">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<circle cx="11" cy="11" r="8"></circle>
						<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
					</svg>
				</button>
			</div>
		</form>
	</div>

	<div class="space-y-4">
		{#key hashtag}
			<EventList
				{query}
				filterFn={filterNoReplies}
				header={`Posts tagged with #${hashtag}`}
				emptyMessage={`There are no posts with the hashtag #${hashtag}.`}
			/>
		{/key}
	</div>
</div>
