<script lang="ts">
	import { animeLoaderWithFilter, type AnimeData } from '$lib/anime';
	import { readable } from 'svelte/store';
	import AnimeBasicInfo from './AnimeBasicInfo.svelte';

	let { query, selectedAnime = $bindable() }: { query: string; selectedAnime: AnimeData | null } =
		$props();

	function searchAnime(query: string) {
		if (query.length < 2) return readable([]);
		return animeLoaderWithFilter(query);
	}

	let animeMatchingSearch = $derived(searchAnime(query));
</script>

{#if $animeMatchingSearch.length === 0 && query.length >= 2}
	<p class="mt-2 text-sm text-gray-500">No anime found matching "{query}"</p>
{:else}
	<ul class="grid grid-cols-1 gap-4">
		{#each $animeMatchingSearch as anime}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<li
				class="cursor-pointer"
				class:border-2={selectedAnime?.identifiers[0].value === anime.identifiers[0].value}
				class:border-solid={selectedAnime?.identifiers[0].value === anime.identifiers[0].value}
				class:border-primary={selectedAnime?.identifiers[0].value === anime.identifiers[0].value}
				onclick={() => (selectedAnime = anime)}
			>
				<div class="card image-full">
					<figure>
						<img src={anime.image} alt={anime.title} class="max-h-[300px] w-full" />
					</figure>
					<div class="card-body">
						<AnimeBasicInfo {anime} />
					</div>
				</div>
			</li>
		{/each}
	</ul>
{/if}
