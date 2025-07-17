<script lang="ts">
	import data from '@emoji-mart/data';
	import Icon from '@iconify/svelte';
	import { Picker } from 'emoji-mart';

	export interface EmojiData {
		id: string;
		name: string;
		native: string;
		unified: string;
		keywords: string[];
		shortcodes: string;
	}

	let open = $state(false);

	let {
		onSelected
	}: {
		onSelected?: (emoji: EmojiData) => void;
	} = $props();

	let pickerDiv = $state();

	$effect(() => {
		if (open)
			new Picker({
				parent: pickerDiv,
				data: data,
				emojiButtonSize: 50,
				emojiSize: 38,
				emojiButtonColors: ['rgba(102, 51, 153, .2)'],
				icons: 'solid',
				onEmojiSelect: (emoji: EmojiData) => {
					onSelected?.(emoji);
					open = false;
				},
				onClickoutside: () => {
					open = false;
				}
			});
	});
</script>

<div>
	<button class="btn btn-circle text-2xl" onclick={() => (open = !open)}>
		<Icon inline icon="ic:twotone-add-reaction" />
	</button>

	{#if open}
		<div class="fixed top-1/2 left-1/2 z-[999] -translate-1/2" bind:this={pickerDiv}></div>
	{/if}
</div>
