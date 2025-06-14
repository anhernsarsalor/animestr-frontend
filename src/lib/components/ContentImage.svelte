<script lang="ts">
	interface Props {
		src: string;
		alt?: string;
		maxWidth?: string;
		centered?: boolean;
	}

	let { src, alt = 'Image', maxWidth }: Props = $props();

	let style = $derived(() => {
		if (maxWidth) {
			return maxWidth.includes('%') || maxWidth.includes('px')
				? `max-width: ${maxWidth};`
				: `max-width: ${maxWidth}px;`;
		}
		return '';
	});
</script>

<img
	{src}
	{alt}
	style={style()}
	class="mx-auto my-2.5 h-auto max-w-full rounded-lg object-contain shadow-sm"
	loading="lazy"
/>
