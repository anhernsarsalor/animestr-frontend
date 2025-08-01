<script lang="ts">
	import { profileLoader } from '$lib';
	import { getColorFromPubkey } from '$lib/utils.svelte';
	import { getProfilePicture, normalizeToPubkey } from 'applesauce-core/helpers';

	let {
		user,
		size = 52,
		borderWidth = 4
	}: { user: string; size?: number; borderWidth?: number } = $props();

	let pubkey = normalizeToPubkey(user);
	let profile = profileLoader(pubkey);
	let basePicture = $derived(`https://api.dicebear.com/9.x/avataaars-neutral/svg?seed=${pubkey}`);
	let picture = $derived(getProfilePicture($profile, basePicture));
	let border = $derived(getColorFromPubkey(pubkey));

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
		src={picture}
		onerror={(e) => (e.target.src = basePicture)}
		style:border="{borderWidth / 2}px solid {border}"
	/>
{:else}
	<div class="avatar" style:width="{size}px" style:height="{size}px">
		<svg width={size} height={size} class="block">
			<defs>
				<pattern id="img-pattern-{pubkey}" patternUnits="userSpaceOnUse" width="100%" height="100%">
					<image
						href={picture}
						x="0"
						y="0"
						width="100%"
						height="100%"
						preserveAspectRatio="xMidYMid slice"
						onerror={(e) => (e.target.href = basePicture)}
					/>
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
			/>
		</svg>
	</div>
{/if}
