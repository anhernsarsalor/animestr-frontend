<script lang="ts">
	import type { AnimeData } from '$lib/nostr/types';

	let { anime }: { anime: AnimeData } = $props();
</script>

<div class="p-6 md:col-span-3">
	<h1 class="mb-4 text-2xl font-bold">{anime.title}</h1>

	<div class="mb-6 space-y-2">
		<div class="grid grid-cols-2 gap-2">
			<div>
				<span class="font-bold">Type:</span>
				<span>{anime.type}</span>
			</div>

			{#if anime.episodes}
				<div>
					<span class="font-bold">Episodes:</span>
					<span>{anime.episodes}</span>
				</div>
			{/if}

			{#if anime.status}
				<div>
					<span class="font-bold">Status:</span>
					<span>{anime.status}</span>
				</div>
			{/if}

			{#if anime.season && anime.year}
				<div>
					<span class="font-bold">Aired:</span>
					<span>{anime.season} {anime.year}</span>
				</div>
			{/if}
		</div>
	</div>
</div>
