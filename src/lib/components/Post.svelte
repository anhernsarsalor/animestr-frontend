<script lang="ts">
	import { scale } from 'svelte/transition';
	import UserInfo from './UserInfo.svelte';
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	import PostContent from './PostContent.svelte';
	import PostZaps from './PostZaps.svelte';
	import PostReactions from './PostReactions.svelte';
	import PostReplies from './PostReplies.svelte';
	import Loading from './Loading.svelte';
	import PostContentListUpdate from './PostContentListUpdate.svelte';
	import type { Event } from 'nostr-tools';
	import { timelineLoaderToSvelteReadable } from '$lib';

	const usersWhoPostNSFWWithoutMarks = [
		// 'bd2f96f56347abe90464d1c220d093e325fe41212926b9eb8c056c5f6ab08280' // sorry anime waifu daily
	];

	const { event }: { event: Event } = $props();
	dayjs.extend(relativeTime);

	const emoji = $derived(() => {
		const allEmoji: Record<string, string> = {};
		for (let tag of event.tags.filter((tag) => tag[0] === 'emoji')) allEmoji[tag[1]] = tag[2];
		return allEmoji;
	});

	let altEvents = timelineLoaderToSvelteReadable({
		kinds: [1010],
		authors: [event.pubkey],
		'#e': [event.id]
	});

	let contentEdits = $derived(
		$altEvents
			.filter((e) => e.tags.some((t) => t[0] === 'alt' && t[1] === 'Content Change Event'))
			.sort((a, b) => b.created_at! - a.created_at!)
	);
	let postContent = $derived(contentEdits.length > 0 ? contentEdits[0].content : event.content);
	let repliesVisible = $state(false);
	let isSensitiveContent = $state(
		!!event.tags.find((t) => t[0] === 'sensitive-content') ||
			(usersWhoPostNSFWWithoutMarks.includes(event.pubkey) && event.content.includes('http')) // only mark as sensitive if the user posts an image
	);
</script>

<div
	class="card bg-base-200 border-base-300 border shadow-sm transition-all hover:shadow-md"
	transition:scale
>
	<div class="card-body gap-4 p-4">
		<div class="flex items-start justify-between">
			<UserInfo user={event.pubkey} />
			<div
				class="tooltip tooltip-left"
				data-tip={dayjs(event.created_at! * 1000).format('YYYY-MM-DD HH:mm:ss')}
			>
				<span class="text-base-content/60 text-xs font-medium">
					{dayjs(event.created_at! * 1000).fromNow()}
				</span>
			</div>
		</div>

		{#if event.kind === 1}
			<PostContent
				originalContent={event.content}
				content={postContent}
				isEdited={contentEdits.length > 0}
				isSensitive={isSensitiveContent}
				emoji={emoji()}
			/>
		{:else}
			<PostContentListUpdate {event} />
		{/if}

		<div class="card-actions mt-2 justify-end">
			<PostReactions {event} />
			<PostZaps {event} />
		</div>
		<div class="card-footer">
			<details class="collapse-arrow collapse" bind:open={repliesVisible}>
				<summary class="collapse-title">Replies</summary>
				<div class="collapse-content">
					{#if repliesVisible}
						<PostReplies parent={event} />
					{:else}
						<Loading inline />
					{/if}
				</div>
			</details>
		</div>
	</div>
</div>
