<script lang="ts">
	import { NDKSubscriptionCacheUsage, type NDKEvent, type NDKKind } from '@nostr-dev-kit/ndk';
	import { scale } from 'svelte/transition';
	import UserInfo from './UserInfo.svelte';
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	import PostContent from './PostContent.svelte';
	import { ndk } from '$lib/stores/signerStore.svelte';
	import PostZaps from './PostZaps.svelte';
	import PostReactions from './PostReactions.svelte';
	import PostReplies from './PostReplies.svelte';
	import Loading from './Loading.svelte';

	const { event }: { event: NDKEvent } = $props();
	dayjs.extend(relativeTime);

	const emoji = $derived(() => {
		const allEmoji: Record<string, string> = {};
		for (let tag of event.tags.filter((tag) => tag[0] === 'emoji')) allEmoji[tag[1]] = tag[2];
		return allEmoji;
	});

	let altEvents = ndk.$subscribe(
		[
			{
				kinds: [1010 as NDKKind],
				authors: [event.author.pubkey],
				'#e': [event.id]
			}
		],
		{
			closeOnEose: false,
			cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST
		}
	);

	let contentEdits = $derived(
		altEvents
			.filter((e) => e.tags.some((t) => t[0] === 'alt' && t[1] === 'Content Change Event'))
			.sort((a, b) => b.created_at! - a.created_at!)
	);
	let postContent = $derived(contentEdits.length > 0 ? contentEdits[0].content : event.content);

	let repliesVisible = $state(false);
</script>

<div
	class="card bg-base-200 border-base-300 border shadow-sm transition-all hover:shadow-md"
	transition:scale
>
	<div class="card-body gap-4 p-4">
		<div class="flex items-start justify-between">
			<UserInfo user={event.author} />
			<div
				class="tooltip tooltip-left"
				data-tip={dayjs(event.created_at! * 1000).format('YYYY-MM-DD HH:mm:ss')}
			>
				<span class="text-base-content/60 text-xs font-medium">
					{dayjs(event.created_at! * 1000).fromNow()}
				</span>
			</div>
		</div>

		<PostContent
			originalContent={event.content}
			content={postContent}
			isEdited={contentEdits.length > 0}
			emoji={emoji()}
		/>

		<div class="card-actions mt-2 justify-end">
			<PostReactions {event} />
			<PostZaps {event} />
		</div>
		<div class="card-footer">
			<details bind:open={repliesVisible}>
				<summary>Replies</summary>
				{#if repliesVisible}
					<PostReplies parent={event} />
				{:else}
					<Loading inline />
				{/if}
			</details>
			<details>
				<summary>Json</summary>
				<pre>{JSON.stringify(event.rawEvent())}</pre>
			</details>
		</div>
	</div>
</div>
