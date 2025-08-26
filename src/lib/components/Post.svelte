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
	import { contentEditsLoader } from '$lib';
	import { Observable } from 'rxjs';
	import LightningPopup from './LightningPopup.svelte';
	import { getZapInvoice } from '$lib/zaps';
	import Icon from '@iconify/svelte';
	import { nostr } from '$lib/stores/signerStore.svelte';
	import PrettyJson from './PrettyJson.svelte';

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

	let contentEdit = contentEditsLoader(event);
	let postContent = $derived($contentEdit ? $contentEdit.content : event.content);
	let repliesVisible = $state(false);
	let isSensitiveContent = $state(
		!!event.tags.find((t) => t[0] === 'sensitive-content') ||
			(usersWhoPostNSFWWithoutMarks.includes(event.pubkey) && event.content.includes('http')) // only mark as sensitive if the user posts an image
	);

	let invoice: Observable<string> | undefined = $state();
	let zapModalOpen = $state(false);
	let zapAmount = $state(1);
	let zapComment = $state('');

	function zap() {
		zapAmount = 1;
		zapComment = '';
		zapModalOpen = true;
	}

	async function doZap() {
		zapModalOpen = false;
		invoice = getZapInvoice(event, zapAmount, zapComment || '');
	}

	function cancel() {
		zapModalOpen = false;
	}
</script>

{#if invoice}
	<LightningPopup
		onclosed={() => (invoice = undefined)}
		invoice={$invoice?.invoice}
		verify={$invoice?.verify}
	/>
{/if}

<dialog class="modal" open={zapModalOpen}>
	<div class="modal-box flex flex-col gap-4">
		<h3 class="text-center text-lg font-bold">Send Zap</h3>

		<div class="flex flex-col gap-2">
			<label class="text-sm font-medium">Amount (sats)</label>
			<div class="join w-full">
				<input
					class="input input-bordered join-item w-full"
					type="number"
					min={1}
					max={10000}
					step={1}
					bind:value={zapAmount}
					placeholder="Enter amount"
				/>
				<span class="btn btn-neutral join-item rounded-r-full">sats</span>
			</div>
		</div>

		<div class="flex flex-wrap justify-center gap-2">
			<button class="btn btn-outline" onclick={() => (zapAmount = 21)}>21</button>
			<button class="btn btn-outline" onclick={() => (zapAmount = 42)}>42</button>
			<button class="btn btn-outline" onclick={() => (zapAmount = 100)}>100</button>
			<button class="btn btn-outline" onclick={() => (zapAmount = 210)}>210</button>
			<button class="btn btn-outline" onclick={() => (zapAmount = 1000)}>1000</button>
		</div>

		<div class="flex flex-col gap-2">
			<label class="text-sm font-medium">Adjust amount</label>
			<input
				class="range range-primary w-full"
				type="range"
				min={1}
				max={10000}
				step={1}
				bind:value={zapAmount}
			/>
		</div>

		<div class="flex flex-col gap-2">
			<label class="text-sm font-medium">Message (optional)</label>
			<input
				class="input input-bordered w-full"
				type="text"
				maxlength={200}
				bind:value={zapComment}
				placeholder="Add a message..."
			/>
		</div>

		<button class="btn btn-primary w-full gap-2" onclick={doZap}>
			<Icon icon="icon-park-twotone:lightning" />
			Zap!
		</button>
		<button class="btn btn-secondary w-full" onclick={cancel}> Cancel </button>
	</div>
</dialog>

<div
	class="card bg-base-200 border-base-300 border shadow-sm transition-all hover:shadow-md"
	transition:scale
>
	<div class="card-body gap-4 p-4">
		<div class="flex items-start justify-between">
			<div class="flex-1">
				<UserInfo user={event.pubkey} />
			</div>
			<div
				class="tooltip tooltip-left shrink"
				data-tip={dayjs(event.created_at! * 1000).format('YYYY-MM-DD HH:mm:ss')}
			>
				<span class="text-base-content/60 text-xs font-medium">
					{dayjs(event.created_at! * 1000).fromNow()}
				</span>
			</div>
			<a class="btn btn-ghost shrink-0" href="/event/{event.id}">#</a>
		</div>

		{#if event.kind === 1 || event.kind === 1111 || event.kind === 24}
			<PostContent
				originalContent={event.content}
				content={postContent}
				isEdited={$contentEdit !== undefined}
				isSensitive={isSensitiveContent}
				emoji={emoji()}
			/>
		{:else if event.kind === 31111}
			<PostContentListUpdate {event} />
		{:else}
			<PrettyJson title="Unknown Event" json={event} />
		{/if}

		<div class="card-actions mt-2 justify-end">
			{#if nostr.activeUser}
				<button class="btn btn-circle text-2xl" onclick={zap}>
					<Icon icon="icon-park-twotone:lightning" />
				</button>
			{/if}
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
