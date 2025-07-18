<script lang="ts">
	import UserInfo from './UserInfo.svelte';
	import { ndk } from '$lib/stores/signerStore.svelte';

	let {
		emoji,
		authorList,
		reactionEmoji,
		onCopyReaction
	}: {
		emoji: string;
		authorList: Set<string>;
		reactionEmoji: Record<string, string>;
		onCopyReaction?: () => void;
	} = $props();

	let authorUsers = $derived(
		[...authorList].map((pubkey) =>
			ndk.getUser({
				pubkey
			})
		)
	);

	let tooltipActive: boolean | null = $state(null);
	let hideTimeout: ReturnType<typeof setTimeout> | undefined = $state(undefined);

	function showTooltip() {
		if (hideTimeout) {
			clearTimeout(hideTimeout);
			hideTimeout = undefined;
		}
		tooltipActive = true;
	}

	function hideTooltip() {
		hideTimeout = setTimeout(() => {
			tooltipActive = false;
		}, 200);
	}
</script>

<div
	class="relative"
	role="button"
	tabindex="0"
	onmouseenter={() => showTooltip()}
	onmouseleave={() => hideTooltip()}
	onfocus={() => showTooltip()}
	onblur={() => hideTooltip()}
>
	<button
		class="bg-base-300 flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 shadow-sm"
		class:bg-primary={ndk.activeUser && authorList.has(ndk.activeUser && ndk.activeUser!.pubkey)}
		onclick={() => onCopyReaction?.()}
	>
		{#if reactionEmoji[emoji]}
			<img src={reactionEmoji[emoji]} alt={emoji} class="h-6 w-6 rounded-full" />
		{:else}
			<span class="text-lg font-bold">{emoji}</span>
		{/if}
		<span
			class="text-base-content/80 text-sm font-medium"
			class:text-primary-content={ndk.activeUser &&
				authorList.has(ndk.activeUser && ndk.activeUser!.pubkey)}
		>
			{authorList.size}
		</span>
	</button>
	{#if tooltipActive}
		<div
			class="bg-base-100 rounded-box absolute bottom-full left-1/2 z-[999] mb-2 w-max -translate-x-1/2 p-2 shadow-lg"
		>
			<div class="flex flex-col gap-2">
				{#each authorUsers as author}
					<UserInfo user={author} />
				{/each}
			</div>
		</div>
	{/if}
</div>
