<script lang="ts">
	import UserInfo from './UserInfo.svelte';
	import { NDKSubscriptionCacheUsage, NDKUser, type NDKEvent } from '@nostr-dev-kit/ndk';
	import { ndk } from '$lib/stores/signerStore.svelte';
	import { decodeBolt11Amount, getUserFromMention } from '$lib/utils.svelte';

	let { event }: { event: NDKEvent } = $props();

	let zapEvents = ndk.$subscribe(
		[
			{
				kinds: [9735],
				'#e': [event.id]
			}
		],
		{
			closeOnEose: false,
			cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST
		}
	);

	const zaps = $derived.by<{ user: NDKUser; amount: number; message?: string }[]>(() => {
		const processedZaps: {
			user: NDKUser;
			amount: number;
			message?: string;
		}[] = [];

		for (const zapReceipt of zapEvents) {
			try {
				const bolt11Invoice = zapReceipt.tags.find((x) => x[0] === 'bolt11')?.[1];
				if (!bolt11Invoice) return;

				const amount = decodeBolt11Amount(bolt11Invoice);

				const description = zapReceipt.tags.find((x) => x[0] === 'description')?.[1];
				let senderPubkey = '';
				let message = '';

				if (description) {
					try {
						const zapRequest = JSON.parse(description);
						senderPubkey = zapRequest.pubkey;
						message = zapRequest.content || '';
					} catch (e) {
						console.error('Failed to parse zap request:', e);
					}
				}

				if (!senderPubkey) {
					const pTag = zapReceipt.tags.find((x) => x[0] === 'P')?.[1];
					if (pTag) {
						senderPubkey = pTag;
					}
				}

				if (amount > 0 && senderPubkey) {
					processedZaps.push({
						user: getUserFromMention(senderPubkey),
						amount,
						message: message || undefined
					});
				}
			} catch (error) {
				console.error('Error processing zap receipt:', error);
			}
		}

		return processedZaps.sort((a, b) => b.amount - a.amount);
	});
</script>

<div class="flex flex-col gap-2">
	{#each zaps as zap}
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
