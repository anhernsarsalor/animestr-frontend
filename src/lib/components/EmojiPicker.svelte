<script lang="ts">
	import { loadUserEmojiPreference } from '$lib/emojiPacks';
	import { nostr } from '$lib/stores/signerStore.svelte';
	import data from '@emoji-mart/data';
	import Icon from '@iconify/svelte';
	import { Picker } from 'emoji-mart';
	import { readable } from 'svelte/store';

	export interface EmojiData {
		id: string;
		name: string;
		native: string;
		unified: string;
		keywords: string[];
		src: string;
		shortcodes: string;
	}

	let open = $state(false);

	let {
		onSelected
	}: {
		onSelected?: (emoji: EmojiData) => void;
	} = $props();

	let pickerDiv = $state();
	let activePicker: Picker | null;

	let customEmoji = $derived(
		nostr.activeUser ? loadUserEmojiPreference(nostr.activeUser) : readable([])
	);

	$effect(() => {
		if (open) {
			const custom = [
				{
					id: 'custom',
					name: 'Custom',
					emojis: $customEmoji.map((emoji) => ({
						id: emoji[0],
						name: emoji[0],
						keywords: [emoji[0], 'custom'],
						skins: [{ src: emoji[1] }]
					}))
				}
			];
			if (activePicker) {
				activePicker.update({
					custom
				});
			} else
				activePicker = new Picker({
					parent: pickerDiv,
					data: data,
					emojiButtonSize: 50,
					emojiSize: 38,
					emojiButtonColors: ['rgba(102, 51, 153, .2)'],
					icons: 'solid',
					custom,
					onEmojiSelect: (emoji: EmojiData) => {
						onSelected?.(emoji);
						open = false;
					},
					onClickoutside: () => {
						open = false;
					}
				});
		} else if (activePicker) activePicker = null;
	});
</script>

{#if nostr.activeUser}
	<div>
		<button class="btn btn-circle text-2xl" onclick={() => (open = !open)}>
			<Icon inline icon="ic:twotone-add-reaction" />
		</button>

		{#if open}
			<div class="fixed top-1/2 left-1/2 z-[999] -translate-1/2" bind:this={pickerDiv}></div>
		{/if}
	</div>
{/if}
