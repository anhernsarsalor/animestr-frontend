<script lang="ts">
	import { page } from '$app/state';
	import AnimeAltTitles from '$lib/components/AnimeAltTitles.svelte';
	import AnimeGenres from '$lib/components/AnimeGenres.svelte';
	import AnimeIdentifiers from '$lib/components/AnimeIdentifiers.svelte';
	import Loading from '$lib/components/Loading.svelte';
	import { animeEventLoader } from '$lib/anime';
	import AnimeBasicInfo from '$lib/components/AnimeBasicInfo.svelte';

	let animeData = animeEventLoader(page.params.id);

	let isLoading = $derived(!animeData);
</script>

<svelte:head>
	<title>{animeData ? $animeData?.title : 'Loading Anime...'}</title>
</svelte:head>

<main class="bg-base-200 min-h-screen py-8">
	<div class="container mx-auto px-4">
		<div class="mb-4">
			<a href="/" class="btn btn-link text-primary px-0">← Back to home</a>
		</div>

		{#if isLoading}
			<div class="flex items-center justify-center p-10">
				<Loading inline />
				<p class="ml-4">Loading anime data...</p>
			</div>
		{:else if $animeData}
			<div class="card bg-base-100 shadow-xl">
				<div class="bg-primary text-primary-content p-0">
					<div class="grid grid-cols-1 md:grid-cols-4">
						<div class="md:col-span-1">
							{#if $animeData.image}
								<img
									src={$animeData.image}
									alt={$animeData.title}
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

						<AnimeBasicInfo anime={$animeData} />
					</div>
				</div>

				<div class="card-body">
					{#if $animeData.altTitles && $animeData.altTitles.length > 0}
						<AnimeAltTitles altTitles={$animeData.altTitles} />
					{/if}

					{#if $animeData.genres && $animeData.genres.length > 0}
						<AnimeGenres genres={$animeData.genres} />
					{/if}

					{#if $animeData.identifiers && $animeData.identifiers.length > 0}
						<AnimeIdentifiers identifiers={$animeData.identifiers} />
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
