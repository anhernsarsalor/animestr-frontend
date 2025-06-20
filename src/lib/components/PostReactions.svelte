<script lang="ts">
	import UserInfo from './UserInfo.svelte';
	import { NDKSubscriptionCacheUsage, NDKUser, type NDKEvent } from '@nostr-dev-kit/ndk';
	import { ndk } from '$lib/stores/signerStore.svelte';

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

	let activeTooltip: string | null = $state(null);
	let hideTimeout: ReturnType<typeof setTimeout> | undefined = $state(undefined);

	function showTooltip(emoji: string) {
		if (hideTimeout) {
			clearTimeout(hideTimeout);
			hideTimeout = undefined;
		}
		activeTooltip = emoji;
	}

	function hideTooltip() {
		hideTimeout = setTimeout(() => {
			activeTooltip = null;
		}, 200);
	}
</script>

<div class="text-base-content/70 flex flex-wrap items-center gap-3 text-sm">
	{#if Object.keys(reactions).length === 0}
		<span class="italic opacity-50">No reactions yet</span>
	{:else}
		{#each Object.entries(reactions) as [emoji, authorList]}
			<div
				class="relative"
				role="button"
				tabindex="0"
				onmouseenter={() => showTooltip(emoji)}
				onmouseleave={() => hideTooltip()}
				onfocus={() => showTooltip(emoji)}
				onblur={() => hideTooltip()}
			>
				<div
					class="bg-base-300 flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 shadow-sm"
				>
					{#if reactionEmoji[emoji]}
						<img src={reactionEmoji[emoji]} alt={emoji} class="h-6 w-6 rounded-full" />
					{:else}
						<span class="text-lg font-bold">{emoji}</span>
					{/if}
					<span class="text-base-content/80 text-sm font-medium">{authorList.length}</span>
				</div>
				{#if activeTooltip === emoji}
					<div
						class="bg-base-100 rounded-box absolute bottom-full left-1/2 z-[999] mb-2 w-max -translate-x-1/2 p-2 shadow-lg"
					>
						<div class="flex flex-col gap-2">
							{#each authorList as author}
								<UserInfo user={author} />
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/each}
	{/if}
</div>
