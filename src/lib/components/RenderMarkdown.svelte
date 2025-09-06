<script lang="ts">
	import { parseMarkdown } from '$lib/parseMarkdown';
	import Loading from './Loading.svelte';
	import RenderMarkdownNode from './RenderMarkdownNode.svelte';

	let {
		markdown,
		emoji
	}: {
		markdown: string;
		emoji: Record<string, string>;
	} = $props();

	let parsed = $derived(parseMarkdown(markdown));
</script>

{#await parsed}
	<Loading inline />
{:then parsed}
	<RenderMarkdownNode node={parsed} {emoji} />
{/await}
