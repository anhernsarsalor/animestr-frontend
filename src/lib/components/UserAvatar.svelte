<script lang="ts">
	import { profileLoader } from '$lib';
	import { getColorFromPubkey } from '$lib/utils.svelte';
	import { getProfilePicture, normalizeToPubkey } from 'applesauce-core/helpers';
	import { loadImage } from '$lib/imagecache';
	import { untrack } from 'svelte';
	import { createAvatar } from '@dicebear/core';
	import { funEmoji } from '@dicebear/collection';

	let {
		user,
		size = 52,
		borderWidth = 4
	}: { user: string; size?: number; borderWidth?: number } = $props();

	let pubkey = $derived(normalizeToPubkey(user));
	let profile = $derived(profileLoader(pubkey));
	let profilePicture = $derived(getProfilePicture($profile));
	let border = $derived(getColorFromPubkey(pubkey));
	let basePicture = $derived(
		createAvatar(funEmoji, {
			seed: pubkey
		})
	);

	let currentPicture = $state('');
	let isLoading = $state(false);

	async function handleImageLoad() {
		if (isLoading) return;

		isLoading = true;

		if (profilePicture) {
			const profileLoaded = await loadImage(profilePicture);
			if (profileLoaded) {
				currentPicture = profilePicture;
				isLoading = false;
				return;
			}
		}

		isLoading = false;
	}

	$effect(() => {
		profilePicture;

		untrack(() => {
			handleImageLoad();
		});
	});

	let outerDropletPath = $derived.by(() => {
		const centerX = size / 2;
		const centerY = size / 2;
		const width = size * 0.4;
		const height = size * 0.45;

		return `M ${centerX} ${centerY - height}
                C ${centerX + width * 0.6} ${centerY - height * 0.7},
                  ${centerX + width} ${centerY - height * 0.2},
                  ${centerX + width} ${centerY + height * 0.3}
                C ${centerX + width} ${centerY + height * 0.8},
                  ${centerX + width * 0.3} ${centerY + height},
                  ${centerX} ${centerY + height}
                C ${centerX - width * 0.3} ${centerY + height},
                  ${centerX - width} ${centerY + height * 0.8},
                  ${centerX - width} ${centerY + height * 0.3}
                C ${centerX - width} ${centerY - height * 0.2},
                  ${centerX - width * 0.6} ${centerY - height * 0.7},
                  ${centerX} ${centerY - height} Z`;
	});

	let innerDropletPath = $derived.by(() => {
		const centerX = size / 2;
		const centerY = size / 2;
		const scale = (size - borderWidth) / size;
		const width = size * 0.4 * scale;
		const height = size * 0.45 * scale;

		return `M ${centerX} ${centerY - height}
                C ${centerX + width * 0.6} ${centerY - height * 0.7},
                  ${centerX + width} ${centerY - height * 0.2},
                  ${centerX + width} ${centerY + height * 0.3}
                C ${centerX + width} ${centerY + height * 0.8},
                  ${centerX + width * 0.3} ${centerY + height},
                  ${centerX} ${centerY + height}
                C ${centerX - width * 0.3} ${centerY + height},
                  ${centerX - width} ${centerY + height * 0.8},
                  ${centerX - width} ${centerY + height * 0.3}
                C ${centerX - width} ${centerY - height * 0.2},
                  ${centerX - width * 0.6} ${centerY - height * 0.7},
                  ${centerX} ${centerY - height} Z`;
	});
</script>

{#if size < 32}
	<img
		class="avatar rounded"
		width={size}
		src={currentPicture}
		style:border="{borderWidth / 2}px solid {border}"
		style:opacity={isLoading ? 0.7 : 1}
	/>
{:else}
	<div class="avatar" style:width="{size}px" style:height="{size}px">
		<svg width={size} height={size} class="block">
			<defs>
				<pattern id="img-pattern-{pubkey}" patternUnits="userSpaceOnUse" width="100%" height="100%">
					{#if isLoading}
						{@html basePicture}
					{:else}
						<image
							href={currentPicture}
							x="0"
							y="0"
							width="100%"
							height="100%"
							preserveAspectRatio="xMidYMid slice"
						/>
					{/if}
				</pattern>
				<clipPath id="egg-clip-{pubkey}">
					<path d={innerDropletPath} />
				</clipPath>
			</defs>

			<path d={outerDropletPath} fill={border} />

			<rect
				x={borderWidth}
				y={0}
				width={size - borderWidth / 2}
				height={size - borderWidth / 2}
				fill="url(#img-pattern-{pubkey})"
				clip-path="url(#egg-clip-{pubkey})"
				style:opacity={isLoading ? 0.7 : 1}
			/>
		</svg>
	</div>
{/if}
