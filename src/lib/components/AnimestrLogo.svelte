<script lang="ts">
	let { inline = false } = $props();
</script>

{#if inline}
	<span class="text-secondary">Anime</span><span class="text-primary">str</span>
{:else}
	<h1 class="text-2xl font-bold">
		<span class="text-secondary">Anime</span><span class="text-primary">str</span>
		<span class="badge badge-accent badge-sm ml-2">Alpha</span>
	</h1>
{/if}
