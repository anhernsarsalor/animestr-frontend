<script lang="ts">
	import UserInfo from './UserInfo.svelte';
	import type { Event } from 'nostr-tools';
	import { zapsLoaderToSvelteReadable } from '$lib';

	let { event }: { event: Event } = $props();

	let zaps = zapsLoaderToSvelteReadable(event);
</script>

<div class="flex flex-col gap-2">
	{#each $zaps as zap}
		<div
			class="bg-secondary border-secondary text-secondary-content flex items-center gap-3 rounded-full border px-3 py-2 shadow-sm"
		>
			<UserInfo user={zap.user} />
			<div class="flex flex-col">
				<span class="text-sm font-medium">
					{zap.amount.toLocaleString()} sats
				</span>
				{#if zap.message}
					<span class="text-xs italic">{zap.message}</span>
				{/if}
			</div>
		</div>
	{/each}
</div>
