<script lang="ts">
	import { contentProcessor } from '$lib/stores/contentProcessor.js';
	import ContentImage from './ContentImage.svelte';
	import YouTubeEmbed from './YoutubeEmbed.svelte';
	import ContentVideo from './ContentVideo.svelte';
	import NostrEventReference from './NostrEventReference.svelte';
	import AnimeReference from './AnimeReference.svelte';
	import AnimestrLogo from './AnimestrLogo.svelte';
	import PostContent from './PostContent.svelte';
	import UserInfo from './UserInfo.svelte';

	interface Props {
		content: string;
		originalContent: string;
		emoji: Record<string, string>;
		isEdited?: boolean;
		isSensitive?: boolean;
	}

	let { content, originalContent, emoji, isEdited, isSensitive }: Props = $props();

	let showOriginal = $state(false);
	let showSensitive = $state(false);

	let contentToProcess = $derived(showOriginal ? originalContent : content);
	let processedContent = $derived(contentProcessor.process(contentToProcess, emoji));
</script>

{#if isSensitive && !showSensitive}
	<div class="relative">
		<!-- Completely hidden content -->
		<div class="invisible">
			<PostContent {originalContent} {content} {emoji} {isEdited} />
		</div>
		<button
			class="bg-base-300 absolute inset-0 flex cursor-pointer items-center justify-center rounded-lg"
			onclick={() => (showSensitive = true)}
		>
			<div class="text-center">
				<svg
					class="text-base-content/60 mx-auto mb-2 h-12 w-12"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
					/>
				</svg>
				<p class="font-medium">Sensitive Content</p>
				<p class="text-base-content/60 text-sm">Click to view</p>
			</div>
		</button>
	</div>
{:else}
	<div class="content">
		{#each processedContent as segment}
			{#if segment.type === 'text'}
				<span>{@html segment.content}</span>
			{:else if segment.type === 'animestr-logo'}
				<AnimestrLogo inline />
			{:else if segment.type === 'image'}
				<ContentImage src={segment.content} />
			{:else if segment.type === 'hashtag'}
				<a class="hashtag" href={`/hashtag/${segment.content}`}>#{segment.content}</a>
			{:else if segment.type === 'url'}
				<a class="url-link" href={segment.content} target="_blank">{segment.content}</a>
			{:else if segment.type === 'mention'}
				<UserInfo user={segment.data} inline />
			{:else if segment.type === 'youtube'}
				<YouTubeEmbed videoId={segment.content} />
			{:else if segment.type === 'video'}
				<ContentVideo src={segment.content} />
			{:else if segment.type === 'markdown'}
				{#if segment.data.element === 'link' && 'href' in segment.data}
					<a href={segment.data.href as string} target="_blank" class="url-link">
						{segment.content}
					</a>
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
			<button
				onclick={() => (showOriginal = !showOriginal)}
				class="text-primary ml-2 hover:underline"
			>
				{showOriginal ? 'Show edited' : 'Show original'}
			</button>
		</span>
	{/if}
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
