<script lang="ts">
	import type { AnimeData } from '$lib/nostr/types';

	let { altTitles } = $props<{ altTitles: AnimeData['altTitles'] }>();
</script>

{#if altTitles && altTitles.length > 0}
	<div class="border-base-300 mb-6 border-b pb-6">
		<h3 class="mb-2 text-lg font-semibold">Alternative Titles</h3>
		<div class="flex flex-wrap gap-2">
			{#each altTitles as title}
				<div class="badge badge-ghost">{title}</div>
			{/each}
		</div>
	</div>
{/if}
