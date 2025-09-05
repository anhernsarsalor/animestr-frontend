<script lang="ts">
	import { loadImage } from '$lib/imagecache';
	import { untrack } from 'svelte';
	import { createAvatar } from '@dicebear/core';
	import { funEmoji } from '@dicebear/collection';
	import { getColorFromPubkey } from '$lib/utils.svelte';

	let {
		pubkey,
		url,
		size = 96,
		borderWidth = 4
	}: {
		pubkey: string;
		url?: string;
		size?: number;
		borderWidth?: number;
	} = $props();

	const borderColor = $derived(getColorFromPubkey(pubkey));
	const fallbackAvatar = $derived(createAvatar(funEmoji, { seed: pubkey }));

	let currentImage = $state('');
	let isLoading = $state(false);
	const sizeClass = $derived(`w-[${size}px]`);

	async function loadProfileImage(): Promise<void> {
		if (isLoading || !url) return;

		isLoading = true;

		try {
			const imageLoaded = await loadImage(url);
			currentImage = imageLoaded ? url : '';
		} catch (error) {
			console.warn('Failed to load profile image:', error);
			currentImage = '';
		} finally {
			isLoading = false;
		}
	}

	$effect(() => {
		url;
		untrack(() => {
			loadProfileImage();
		});
	});

	const fallbackDataUrl = $derived.by(() => {
		const svgString = fallbackAvatar.toString();
		const bytes = new TextEncoder().encode(svgString);
		const base64 = btoa(String.fromCharCode(...bytes));
		return `data:image/svg+xml;base64,${base64}`;
	});
</script>

<div class="avatar">
	<div
		class="avatar-container mask mask-hexagon-2 {sizeClass}"
		style:width="{size}px"
		style:height="{size}px"
		style:--border-color={borderColor}
		style:--border-width="{borderWidth}px"
		style:opacity={isLoading ? 0.7 : 1}
	>
		<div class="avatar-border mask mask-hexagon-2"></div>

		<div class="avatar-content mask mask-hexagon-2">
			<img
				src={currentImage || fallbackDataUrl}
				alt="User avatar"
				class="avatar-image"
				loading="lazy"
			/>
		</div>
	</div>
</div>

<style>
	.avatar-container {
		position: relative;
		transition: opacity 0.2s ease;
	}

	.avatar-border {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: var(--border-color);
		z-index: 1;
	}

	.avatar-content {
		position: absolute;
		top: var(--border-width);
		left: var(--border-width);
		width: calc(100% - var(--border-width) * 2);
		height: calc(100% - var(--border-width) * 2);
		z-index: 2;
		overflow: hidden;
	}

	.avatar-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	/* Loading state */
	.avatar-container[style*='opacity: 0.7'] {
		filter: blur(1px);
	}

	/* Responsive sizing fallback */
	@media (max-width: 640px) {
		.avatar-container {
			min-width: 32px;
			min-height: 32px;
		}
	}
</style>
