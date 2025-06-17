<script lang="ts">
	import { Event, Filter, Kind, KindStandard } from '@rust-nostr/nostr-sdk';
	import UserInfo from './UserInfo.svelte';
	import PostContent from './PostContent.svelte';
	import PostZaps from './PostZaps.svelte';
	// @ts-ignore - External module
	import dayjs from 'dayjs';
	// @ts-ignore - External module
	import relativeTime from 'dayjs/plugin/relativeTime';
	import { fly } from 'svelte/transition';
	import PostReactions from './PostReactions.svelte';
	import { createEventListStore } from '$lib/stores/eventListStore.svelte';

	dayjs.extend(relativeTime);

	interface Props {
		event: Event;
	}

	const { event }: Props = $props();

	function formatDate(timestamp: string): string {
		const date = dayjs(timestamp);
		return date.fromNow();
	}

	function formatFullDate(timestamp: string): string {
		return dayjs(timestamp).format('MMM D, YYYY h:mm A');
	}

	const emoji = $derived(() => {
		const allEmoji: Record<string, string> = {};
		for (let tag of event.tags.filter('emoji').map((tag) => tag.asVec())) {
			allEmoji[tag[1]] = tag[2];
		}
		return allEmoji;
	});

	const allEventsRelatedToThisPost = createEventListStore(
		new Filter()
			.kinds([
				new Kind(1010), // edits
				Kind.fromStd(KindStandard.Reaction),
				new Kind(9735) // zaps
			])
			.event(event.id)
	);

	const contentEdits = $derived(
		allEventsRelatedToThisPost.events
			.filter((event) => event.kind.asU16() === 1010)
			.filter((event) =>
				event.tags.filter('alt').some((t) => t.asVec()[1] === 'Content Change Event')
			)
			.sort((a, b) => b.createdAt.asSecs() - a.createdAt.asSecs())
	);

	const reactions = $derived(
		allEventsRelatedToThisPost.events
			.filter((event) => event.kind.asU16() === Kind.fromStd(KindStandard.Reaction).asU16())
			.sort((a, b) => b.createdAt.asSecs() - a.createdAt.asSecs())
	);

	const zapEvents = $derived(
		allEventsRelatedToThisPost.events
			.filter((event) => event.kind.asU16() === 9735)
			.sort((a, b) => b.createdAt.asSecs() - a.createdAt.asSecs())
	);

	const latestContentEdit = $derived(contentEdits[0]);
	const postContent = $derived(latestContentEdit ? latestContentEdit.content : event.content);
</script>

<div
	class="card bg-base-200 border-base-300 border shadow-sm transition-all hover:shadow-md"
	transition:fly
>
	<div class="card-body gap-4 p-4">
		<div class="flex items-start justify-between">
			<UserInfo pubkey={event.author} />
			<div
				class="tooltip tooltip-left"
				data-tip={formatFullDate(event.createdAt.toHumanDatetime())}
			>
				<span class="text-base-content/60 text-xs font-medium">
					{formatDate(event.createdAt.toHumanDatetime())}
				</span>
			</div>
		</div>

		<PostContent
			originalContent={event.content}
			content={postContent}
			isEdited={latestContentEdit !== undefined}
			emoji={emoji()}
		/>

		<div class="card-actions mt-2 justify-end">
			<PostReactions reactionEvents={reactions} />
			<PostZaps {zapEvents} />
		</div>
		<div class="card-footer">
			<details>
				<summary>Json</summary>
				<pre>{event.asPrettyJson()}</pre>
			</details>
		</div>
	</div>
</div>
