<script lang="ts">
	import { NDKEvent } from '@nostr-dev-kit/ndk';
	import { ndk, nostr } from '$lib/stores/signerStore.svelte';
	import EmojiPicker, { type EmojiData } from './EmojiPicker.svelte';
	import PostReaction from './PostReaction.svelte';
	import type { Event, NostrEvent } from 'nostr-tools';
	import { reactionsLoaderToSvelteReadable } from '$lib';

	let { event }: { event: Event } = $props();

	let reactionsData = reactionsLoaderToSvelteReadable(event);

	const reactions = $derived($reactionsData.authors);
	const reactionEmoji = $derived($reactionsData.emojis);

	async function onEmojiSelected(emoji: EmojiData | string) {
		if (!nostr.activeUser) {
			console.warn('No active user to react with');
			return;
		}
		const reactionEvent = {
			kind: 7,
			tags: [['e', event.id]]
		} as NostrEvent;
		if (typeof emoji !== 'string') {
			if (emoji.native) return onEmojiSelected(emoji.native);
			if (emoji.src) {
				reactionEvent.content = emoji.name;
				reactionEmoji[emoji.name] = emoji.src;
				emoji = emoji.name;
			} else return;
		}
		if (reactionEmoji[emoji]) reactionEvent.tags.push(['emoji', emoji, reactionEmoji[emoji]]);
		const reaction = new NDKEvent(ndk, reactionEvent);
		await reaction.publish();
	}

	function onCopyReaction(emoji: string) {
		return () => onEmojiSelected(emoji);
	}
</script>

<div class="text-base-content/70 flex flex-wrap items-center gap-3 text-sm">
	<EmojiPicker onSelected={onEmojiSelected} />
	{#if Object.keys(reactions).length === 0}
		<span class="italic opacity-50">No reactions yet</span>
	{:else}
		{#each Object.entries(reactions) as [emoji, authorList]}
			<PostReaction {emoji} {authorList} {reactionEmoji} onCopyReaction={onCopyReaction(emoji)} />
		{/each}
	{/if}
</div>
