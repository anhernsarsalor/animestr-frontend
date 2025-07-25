<script lang="ts">
	import type { AnimeData } from '$lib/anime';

	let { genres } = $props<{ genres: AnimeData['genres'] }>();
</script>

{#if genres && genres.length > 0}
	<div class="border-base-300 mb-6 border-b pb-6">
		<h3 class="mb-2 text-lg font-semibold">Genres</h3>
		<div class="flex flex-wrap gap-2">
			{#each genres as genre}
				<div class="badge badge-primary">{genre}</div>
			{/each}
		</div>
	</div>
{/if}
