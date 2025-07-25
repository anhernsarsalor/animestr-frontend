<script lang="ts">
	import type { AnimeData } from '$lib/anime';

	let { identifiers } = $props<{ identifiers: AnimeData['identifiers'] }>();
</script>

{#if identifiers && identifiers.length > 0}
	<div class="border-base-300 mb-6 border-b pb-6">
		<h3 class="mb-2 text-lg font-semibold">External Links</h3>
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
			{#each identifiers as id}
				<div class="card bg-base-200 p-3">
					<span class="text-sm font-medium">{id.type}</span>
					<span class="text-xs break-all">
						{id.value.replace(/^(anilist:|mal:|anidb:|url:)/, '')}
					</span>
				</div>
			{/each}
		</div>
	</div>
{/if}
