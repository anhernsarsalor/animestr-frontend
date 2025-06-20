<script lang="ts">
	import UserInfo from './UserInfo.svelte';
	import NDK, {
		eventHasETagMarkers,
		NDKEvent,
		NDKSubscriptionCacheUsage,
		NDKUser
	} from '@nostr-dev-kit/ndk';
	import { ndk } from '$lib/stores/signerStore.svelte';
	import EmojiPicker, { type EmojiData } from './EmojiPicker.svelte';
	import PostReaction from './PostReaction.svelte';

	let { event }: { event: NDKEvent } = $props();

	let reactionEvents = ndk.$subscribe(
		[
			{
				'#e': [event.id],
				kinds: [7]
			}
		],
		{
			closeOnEose: false,
			cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST
		}
	);

	const reactionsData = $derived.by(() => {
		const reactionAuthors: Record<string, NDKUser[]> = {};
		const emojiMapping: Record<string, string> = {};

		for (const reaction of reactionEvents) {
			const emojiTags = reaction.tags.filter((x) => x[0] === 'emoji');
			if (emojiTags.length === 1) {
				const [, emoji, url] = emojiTags[0]!;
				emojiMapping[emoji] = url;
				if (!reactionAuthors[emoji]) {
					reactionAuthors[emoji] = [];
				}
				reactionAuthors[emoji].push(reaction.author);
			} else {
				let emoji = reaction.content.trim();
				if (emoji === '+') emoji = '👍';
				if (emoji) {
					if (!reactionAuthors[emoji]) {
						reactionAuthors[emoji] = [];
					}
					reactionAuthors[emoji].push(reaction.author);
				}
			}
		}
		return { authors: reactionAuthors, emojis: emojiMapping };
	});

	const reactions = $derived(reactionsData.authors);
	const reactionEmoji = $derived(reactionsData.emojis);

	async function onEmojiSelected(emoji: EmojiData | string) {
		if (typeof emoji !== 'string') return emoji.native;
		const reactionEvent = {
			kind: 7,
			tags: [['e', event.id]],
			content: emoji
		};
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
