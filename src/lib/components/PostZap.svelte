<script lang="ts">
	import type { ParsedZapEvent } from '$lib';
	import UserInfo from './UserInfo.svelte';

	let { zap }: { zap: ParsedZapEvent } = $props();
</script>

<div
	class="bg-secondary border-secondary text-secondary-content flex items-center gap-3 rounded-full border px-3 py-2 shadow-sm"
>
	<UserInfo user={zap.sender} />
	<div class="flex flex-col">
		<span class="text-sm font-medium">
			{zap.amount.toLocaleString()} sats
		</span>
		{#if zap.message}
			<span class="text-xs italic">{zap.message}</span>
		{/if}
	</div>
</div>
