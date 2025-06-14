<script lang="ts">
	import { contentProcessor } from '$lib/stores/contentProcessor.js';
	import ContentImage from './ContentImage.svelte';
	import YouTubeEmbed from './YoutubeEmbed.svelte';
	import NostrMention from './NostrMention.svelte';
	import ContentVideo from './ContentVideo.svelte';
	import NostrEventReference from './NostrEventReference.svelte';
	import AnimeReference from './AnimeReference.svelte';

	interface Props {
		content: string;
		originalContent: string;
		emoji: Record<string, string>;
		isEdited?: boolean;
	}

	let { content, originalContent, emoji, isEdited }: Props = $props();

	let showOriginal = $state(false);

	function toggleContent() {
		showOriginal = !showOriginal;
	}

	let contentToProcess = $derived(showOriginal ? originalContent : content);
	let processedContent = $derived(contentProcessor.process(contentToProcess, emoji));
</script>

<div class="content">
	{#each processedContent as segment}
		{#if segment.type === 'text'}
			<span>{@html segment.content}</span>
		{:else if segment.type === 'image'}
			<ContentImage src={segment.content} />
		{:else if segment.type === 'hashtag'}
			<a class="hashtag" href={`/hashtag/${segment.content}`}>#{segment.content}</a>
		{:else if segment.type === 'url'}
			<a class="url-link" href={segment.content} target="_blank">{segment.content}</a>
		{:else if segment.type === 'mention'}
			<NostrMention pubkey={segment.content} />
		{:else if segment.type === 'youtube'}
			<YouTubeEmbed videoId={segment.content} />
		{:else if segment.type === 'video'}
			<ContentVideo src={segment.content} />
		{:else if segment.type === 'markdown'}
			{#if segment.data.element === 'link' && 'href' in segment.data}
				<a href={segment.data.href as string} target="_blank" class="url-link">{segment.content}</a>
			{:else if segment.data.element === 'anime'}
				<AnimeReference animeId={segment.data.content} source={segment.data.source} />
			{:else}
				<svelte:element this={segment.data.element}>{segment.content}</svelte:element>
			{/if}
		{:else if segment.type === 'event'}
			<NostrEventReference eventId={segment.content} />
		{:else if segment.type === 'anime'}
			<AnimeReference animeId={segment.data.id} source={segment.data.source} />
		{:else}
			{JSON.stringify(segment)}
		{/if}
	{/each}
</div>

{#if isEdited}
	<span class="text-base-content/60 text-xs font-medium">
		{showOriginal ? 'Original' : 'Edited'}
		<button onclick={toggleContent} class="text-primary ml-2 hover:underline">
			{showOriginal ? 'Show edited' : 'Show original'}
		</button>
	</span>
{/if}

<style>
	.content {
		word-break: break-word;
		margin-top: 10px;
		line-height: 1.6;
		overflow-wrap: break-word;
	}

	:global(.content p) {
		margin: 0 0 1em 0;
	}

	:global(.content p:last-child) {
		margin-bottom: 0;
	}

	:global(.content h1, .content h2, .content h3, .content h4, .content h5, .content h6) {
		margin: 1.2em 0 0.6em 0;
		line-height: 1.3;
	}

	:global(
		.content h1:first-child,
		.content h2:first-child,
		.content h3:first-child,
		.content h4:first-child,
		.content h5:first-child,
		.content h6:first-child
	) {
		margin-top: 0;
	}

	:global(.youtube-container) {
		position: relative;
		width: 100%;
		padding-bottom: 56.25%; /* 16:9 aspect ratio */
		margin: 10px 0;
		border-radius: 8px;
		overflow: hidden;
	}

	:global(.youtube-thumbnail-container) {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		cursor: pointer;
	}

	:global(.youtube-thumbnail) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	:global(.youtube-play-button) {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 68px;
		height: 48px;
		background-color: rgba(33, 33, 33, 0.8);
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.2s;
	}

	:global(.youtube-play-button::before) {
		content: '';
		border-style: solid;
		border-width: 12px 0 12px 20px;
		border-color: transparent transparent transparent #fff;
		display: block;
		margin-left: 4px;
	}

	:global(.youtube-thumbnail-container:hover .youtube-play-button) {
		background-color: #ff0000;
	}

	:global(.youtube-embed) {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border-radius: 8px;
	}

	:global(.centered-content) {
		text-align: center;
		margin: 15px 0;
	}

	:global(.centered-content p) {
		text-align: center;
	}

	:global(.content a) {
		text-decoration: none;
		transition: opacity 0.2s ease;
	}

	:global(.content a:hover) {
		text-decoration: underline;
		opacity: 0.8;
	}

	:global(.url-link) {
		color: #1d9bf0;
	}

	:global(.hashtag) {
		color: #1d9bf0;
		font-weight: 500;
	}

	:global(.mention) {
		color: #1d9bf0;
		font-weight: 500;
	}

	:global(.content code) {
		background-color: rgba(175, 184, 193, 0.2);
		padding: 0.2em 0.4em;
		border-radius: 3px;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.9em;
	}

	:global(.content pre) {
		background-color: rgba(175, 184, 193, 0.1);
		padding: 1em;
		border-radius: 6px;
		overflow-x: auto;
		margin: 1em 0;
	}

	:global(.content pre code) {
		background: none;
		padding: 0;
	}

	:global(.content blockquote) {
		border-left: 4px solid green;
		color: green;
		margin: 1em 0;
		padding-left: 1em;
		font-style: italic;
		opacity: 0.8;
	}

	:global(.content del) {
		opacity: 0.7;
	}

	:global(.nostr-event-reference) {
		margin: 10px 0;
		border: 1px solid rgba(29, 155, 240, 0.2);
		border-radius: 8px;
		overflow: hidden;
	}

	:global(.event-details) {
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.9em;
	}

	:global(.event-summary) {
		padding: 10px;
		background-color: rgba(29, 155, 240, 0.1);
		cursor: pointer;
		user-select: none;
		color: #1d9bf0;
		font-weight: 500;
	}

	:global(.event-data) {
		padding: 10px;
		background-color: rgba(175, 184, 193, 0.1);
		margin: 0;
		overflow-x: auto;
		max-height: 300px;
		overflow-y: auto;
	}
</style>
