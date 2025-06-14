<script lang="ts">
	import { nostr } from '$lib/stores/signerStore.svelte';
	import { Alphabet, Duration, Event, Filter, Kind, SingleLetterTag } from '@rust-nostr/nostr-sdk';
	import { page } from '$app/state';
	import PostContent from '$lib/components/PostContent.svelte';
	import parseAnimeEvent from '$lib/nostr/parseAnimeEvent';
	import type { AnimeData } from '$lib/nostr/types';
	import AnimeAltTitles from '$lib/components/AnimeAltTitles.svelte';
	import AnimeGenres from '$lib/components/AnimeGenres.svelte';
	import AnimeIdentifiers from '$lib/components/AnimeIdentifiers.svelte';

	let event = $state<Event | null>(null);
	let isLoading = $state(true);
	let error = $state<string | null>(null);

	let animeData = $state<AnimeData | null>(null);

	$effect(() => {
		const id = page.params.id;
		if (id) {
			fetchEvent(id);
		}
	});

	async function fetchEvent(id: string) {
		if (id.startsWith('d:')) {
			id = id.replace('d:', '');
		}

		isLoading = true;
		error = null;
		event = null;
		animeData = null;

		try {
			const filter = new Filter()
				.kind(new Kind(30010))
				.customTag(SingleLetterTag.lowercase(Alphabet.I), id)
				.limit(1);
			const results = await nostr.client?.fetchEvents(filter, Duration.fromSecs(10));
			const eventsArr = results ? results.toVec() : [];

			if (eventsArr.length > 0) {
				event = eventsArr[0];
				animeData = parseAnimeEvent(event);
				isLoading = false;
			} else {
				error = 'Event not found';
				isLoading = false;
			}
		} catch (err: unknown) {
			console.error('Error fetching event:', err);
			error = err instanceof Error ? err.message : String(err);
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>{animeData ? animeData.title : 'Loading Anime...'}</title>
</svelte:head>

<main class="bg-base-200 min-h-screen py-8">
	<div class="container mx-auto px-4">
		<div class="mb-4">
			<a href="/" class="btn btn-link text-primary px-0">← Back to home</a>
		</div>

		{#if isLoading}
			<div class="flex items-center justify-center p-10">
				<span class="loading loading-spinner loading-lg text-primary"></span>
				<p class="ml-4">Loading anime data...</p>
			</div>
		{:else if error}
			<div class="alert alert-error shadow-lg">
				<div>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6 flex-shrink-0 stroke-current"
						fill="none"
						viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
						/></svg
					>
					<div>
						<h3 class="font-bold">Error!</h3>
						<div class="text-xs">{error}</div>
						<div class="text-xs">Event ID: {page.params.id}</div>
					</div>
				</div>
			</div>
		{:else if event && animeData}
			<div class="card bg-base-100 shadow-xl">
				<div class="bg-primary text-primary-content p-0">
					<div class="grid grid-cols-1 md:grid-cols-4">
						<div class="md:col-span-1">
							{#if animeData.image}
								<img
									src={animeData.image}
									alt={animeData.title}
									class="h-full w-full object-cover md:h-[340px]"
								/>
							{:else}
								<div
									class="bg-neutral text-neutral-content flex h-60 w-full items-center justify-center md:h-[340px]"
								>
									No Image Available
								</div>
							{/if}
						</div>

						<div class="p-6 md:col-span-3">
							<h1 class="mb-4 text-2xl font-bold">{animeData.title}</h1>

							<div class="mb-6 space-y-2">
								<div class="grid grid-cols-2 gap-2">
									<div>
										<span class="font-bold">Type:</span>
										<span>{animeData.type}</span>
									</div>

									{#if animeData.episodes}
										<div>
											<span class="font-bold">Episodes:</span>
											<span>{animeData.episodes}</span>
										</div>
									{/if}

									{#if animeData.status}
										<div>
											<span class="font-bold">Status:</span>
											<span>{animeData.status}</span>
										</div>
									{/if}

									{#if animeData.season && animeData.year}
										<div>
											<span class="font-bold">Aired:</span>
											<span>{animeData.season} {animeData.year}</span>
										</div>
									{/if}
								</div>
							</div>
						</div>
					</div>
				</div>

				<div class="card-body">
					{#if animeData.altTitles && animeData.altTitles.length > 0}
						<AnimeAltTitles altTitles={animeData.altTitles} />
					{/if}

					{#if animeData.genres && animeData.genres.length > 0}
						<AnimeGenres genres={animeData.genres} />
					{/if}

					{#if animeData.identifiers && animeData.identifiers.length > 0}
						<AnimeIdentifiers identifiers={animeData.identifiers} />
					{/if}

					{#if event.content}
						<div class="border-base-300 mb-6 border-b pb-6">
							<h3 class="mb-2 text-lg font-semibold">Description</h3>
							<div class="prose">
								<PostContent content={event.content} emoji={{}} />
							</div>
						</div>
					{/if}
				</div>
			</div>
		{:else}
			<div class="alert alert-warning shadow-lg">
				<div>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6 flex-shrink-0 stroke-current"
						fill="none"
						viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/></svg
					>
					<div>
						<h3 class="font-bold">Not Found</h3>
						<div class="text-xs">Anime data not found</div>
						<div class="text-xs">Event ID: {page.params.id}</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</main>
