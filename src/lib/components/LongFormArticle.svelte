<script lang="ts">
	import type { Event } from 'nostr-tools';
	import PostContent from './PostContent.svelte';

	let { event }: { event: Event } = $props();

	let title = event.tags.find((t) => t[0] === 'title')?.[1];
	let image = event.tags.find((t) => t[0] === 'image')?.[1];
	let summary = event.tags.find((t) => t[0] === 'summary')?.[1];

	const allEmoji: Record<string, string> = {};
	for (let tag of event.tags.filter((tag) => tag[0] === 'emoji')) allEmoji[tag[1]] = tag[2];
</script>

<div class="card bg-base-300 shadow-sm">
	{#if image}
		<figure>
			<img src={image} alt={title} />
		</figure>
	{/if}
	<div class="card-body">
		<h2 class="card-title block text-center">{title}</h2>
		{#if summary}
			<p>{summary}</p>
		{/if}
		<div class="divider"></div>
		<PostContent content={event.content} originalContent={event.content} emoji={allEmoji} />
	</div>
</div>
