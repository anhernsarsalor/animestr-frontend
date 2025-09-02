<script lang="ts">
	import { type Node } from 'unist';

	import AnimestrLogo from './AnimestrLogo.svelte';
	import NostrEventReference from './NostrEventReference.svelte';
	import YoutubeEmbed from './YoutubeEmbed.svelte';
	import Self from './RenderMarkdownNode.svelte';
	import UserInfo from './UserInfo.svelte';
	import AnimeReference from './AnimeReference.svelte';
	import Katex from 'svelte-katex';
	import RenderCashuToken from './RenderCashuToken.svelte';

	let {
		node,
		emoji
	}: {
		node: Node;
		emoji: Record<string, string>;
	} = $props();
</script>

{#snippet children(children, emoji)}
	{#each children as child}
		<Self node={child} {emoji} />
	{/each}
{/snippet}

{#if node.type === 'root'}
	{@render children(node.children, emoji)}
{:else if node.type === 'paragraph'}
	<p>{@render children(node.children, emoji)}</p>
{:else if node.type === 'text'}
	{node.value}
{:else if node.type === 'hashtag'}
	<a href="/hashtag/{node.tag}" class="hashtag">
		{@render children(node.children, emoji)}
	</a>
{:else if node.type === 'animestr-logo'}
	<AnimestrLogo inline />
{:else if node.type === 'link'}
	<a href={node.url} title={node.title}>
		{@render children(node.children, emoji)}
	</a>
{:else if node.type === 'image'}
	<img
		src={node.url}
		title={node.title}
		alt={node.alt}
		class="mx-auto my-2.5 h-auto max-w-full rounded-lg object-contain shadow-sm"
		loading="lazy"
		width={node.size ? node.size : null}
	/>
{:else if node.type === 'event'}
	<NostrEventReference eventId={node.id} />
{:else if node.type === 'youtube'}
	<YoutubeEmbed videoId={node.videoId} />
{:else if node.type === 'npub'}
	<UserInfo user={node.id} inline />
{:else if node.type === 'anime'}
	<AnimeReference source={node.source} animeId={node.id} />
{:else if node.type === 'heading'}
	{#if node.depth === 1}
		<h1 class="text-2xl">{@render children(node.children, emoji)}</h1>
	{:else if node.depth === 2}
		<h2 class="text-xl">{@render children(node.children, emoji)}</h2>
	{:else if node.depth === 3}
		<h3 class="text-lg">{@render children(node.children, emoji)}</h3>
	{:else if node.depth === 4}
		<h4>{@render children(node.children, emoji)}</h4>
	{:else}
		{@render children(node.children, emoji)}
	{/if}
{:else if node.type === 'emoji'}
	:{node.emoji}: <!-- TODO -->
{:else if node.type === 'strong'}
	<b>{@render children(node.children, emoji)}</b>
{:else if node.type === 'emphasis'}
	<i>{@render children(node.children, emoji)}</i>
{:else if node.type === 'underlined'}
	<u>{@render children(node.children, emoji)}</u>
{:else if node.type === 'delete'}
	<s>{@render children(node.children, emoji)}</s>
{:else if node.type === 'inlineCode'}
	<kbd>{node.value}</kbd>
{:else if node.type === 'code'}
	<pre lang={node.lang}>{node.value}</pre>
{:else if node.type === 'ruby'}
	<ruby>{@render children(node.children, emoji)}</ruby>
{:else if node.type === 'rb'}
	<rb>{node.value}</rb>
{:else if node.type === 'rt'}
	<rt>{node.value}</rt>
{:else if node.type === 'inlineMath'}
	<Katex>{node.value}</Katex>
{:else if node.type === 'math'}
	<Katex displayMode>{node.value}</Katex>
{:else if node.type === 'list'}
	{#if node.ordered}
		<ol>{@render children(node.children, emoji)}</ol>
	{:else}
		<ul>{@render children(node.children, emoji)}</ul>
	{/if}
{:else if node.type === 'listItem'}
	<li>{@render children(node.children, emoji)}</li>
{:else if node.type === 'blockquote'}
	<blockquote>{@render children(node.children, emoji)}</blockquote>
{:else if node.type === 'break'}
	<br />
{:else if node.type === 'thematicBreak'}
	<hr />
{:else if node.type === 'html'}
	{node.value}
{:else if node.type === 'cashuToken'}
	<RenderCashuToken token={node.value} />
{:else}
	<p>
		Unknown node: {JSON.stringify(node)}, if you see this, please let
		<UserInfo user="74fb3ef27cd8985d7fefc6e94d178290275f5492557b4a166ab9cd1458adabc7" inline />
		know
	</p>
{/if}
