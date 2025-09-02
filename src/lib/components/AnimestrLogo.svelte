<script lang="ts">
	let { inline = false, link = false } = $props();
</script>

{#snippet content()}
	{#if inline}
		<span class="inline-flex h-[0] items-center" style="line-height: 1;">
			<img
				src="/logo-without-text.webp"
				alt="animestr logo"
				class="w-8 select-none"
				style="transform: translateY(30%); "
			/>
			<span style="transform: translateY(50%);">
				<span class="text-secondary">Anime</span><span class="text-primary">str</span>
			</span>
		</span>
	{:else}
		<h1 class="join items-center text-2xl font-bold">
			<img src="/logo-without-text.webp" alt="animestr logo" class="w-12 select-none" />
			<span class="text-secondary">Anime</span><span class="text-primary">str</span>
			<span class="badge badge-accent badge-sm ml-2">Alpha</span>
		</h1>
	{/if}
{/snippet}

{#if link}
	<a href="https://animestr.xyz/{link}">
		{@render content()}
	</a>
{:else}
	{@render content()}
{/if}
