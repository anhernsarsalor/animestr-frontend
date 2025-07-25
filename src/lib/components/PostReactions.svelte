<script lang="ts">
	import { nostr } from '$lib/stores/signerStore.svelte';
	import EmojiPicker, { type EmojiData } from './EmojiPicker.svelte';
	import PostReaction from './PostReaction.svelte';
	import type { Event, NostrEvent } from 'nostr-tools';
	import { createEvent } from '$lib';
	import { reactionsForEvent, type ReactionEmoji } from '$lib/reactions';

	let { event }: { event: Event } = $props();

	let reactions = reactionsForEvent(event);

	function isReactionEmoji(emoji: EmojiData | ReactionEmoji | string): emoji is ReactionEmoji {
		if (typeof emoji === 'string') return false;
		if (!(emoji as any).type) return false;
		return emoji.hasOwnProperty('type');
	}

	async function onEmojiSelected(emoji: EmojiData | ReactionEmoji | string) {
		if (!nostr.activeUser) {
			console.warn('No active user to react with');
			return;
		}
		const reactionEvent = {
			kind: 7,
			tags: [['e', event.id]]
		} as NostrEvent;

		if (typeof emoji === 'string') reactionEvent.content = emoji;
		else if (isReactionEmoji(emoji)) {
			reactionEvent.content = emoji.emoji;
			if (emoji.type === 'custom') reactionEvent.tags.push(['emoji', emoji.emoji, emoji.url]);
		} else {
			if (emoji.native) reactionEvent.content = emoji.native;
			else if (emoji.src) {
				reactionEvent.content = emoji.name;
				reactionEvent.tags.push(['emoji', emoji.name, emoji.src]);
			}
		}
		await createEvent(reactionEvent);
	}

	function onCopyReaction(emoji: string) {
		return () => onEmojiSelected(emoji);
	}
</script>

<div class="text-base-content/70 flex flex-wrap items-center gap-3 text-sm">
	<EmojiPicker onSelected={onEmojiSelected} />
	{#each $reactions as reaction}
		<PostReaction
			emoji={reaction.emoji}
			authorList={reaction.authors}
			onCopyReaction={onCopyReaction(reaction.emoji)}
		/>
	{:else}
		<span class="italic opacity-50">No reactions yet</span>
	{/each}
</div>
