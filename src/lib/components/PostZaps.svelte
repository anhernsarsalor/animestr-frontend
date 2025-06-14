<script lang="ts">
	import { PublicKey, Filter, Kind, EventId } from '@rust-nostr/nostr-sdk';
	import { decode } from 'light-bolt11-decoder';
	import UserInfo from './UserInfo.svelte';
	import { createEventListStore } from '$lib/stores/eventListStore.svelte';

	let { eventId } = $props<{ eventId: EventId }>();

	function decodeBolt11Amount(bolt11Invoice: string): number {
		try {
			const decoded = decode(bolt11Invoice);
			return parseInt(decoded.sections.find((s) => s.name === 'amount')?.value || '0', 10) / 1000; // Convert millisats to sats
		} catch (error) {
			console.error('Error decoding bolt11:', error);
			return 0;
		}
	}

	const zapData = createEventListStore(
		new Filter().kind(new Kind(9735)).event(eventId),
		(event) => {
			const bolt11Tag = event.tags.filter('bolt11')[0]?.asVec();
			if (!bolt11Tag) return false;
			return true;
		}
	);
	const zaps = $derived.by<{ pubkey: PublicKey; amount: number; message?: string }[]>(() => {
		const processedZaps: {
			pubkey: PublicKey;
			amount: number;
			message?: string;
		}[] = [];

		for (const zapReceipt of zapData.events) {
			try {
				const bolt11Tag = zapReceipt.tags.filter('bolt11')[0]?.asVec();
				if (!bolt11Tag) return;

				const bolt11Invoice = bolt11Tag[1];
				const amount = decodeBolt11Amount(bolt11Invoice);

				const descriptionTag = zapReceipt.tags.filter('description')[0]?.asVec();
				let senderPubkey = '';
				let message = '';

				if (descriptionTag) {
					try {
						const zapRequest = JSON.parse(descriptionTag[1]);
						senderPubkey = zapRequest.pubkey;
						message = zapRequest.content || '';
					} catch (e) {
						console.error('Failed to parse zap request:', e);
					}
				}

				if (!senderPubkey) {
					const pTag = zapReceipt.tags.filter('P')[0]?.asVec();
					if (pTag) {
						senderPubkey = pTag[1];
					}
				}

				if (amount > 0 && senderPubkey) {
					processedZaps.push({
						pubkey: PublicKey.parse(senderPubkey),
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
			<UserInfo pubkey={zap.pubkey} />
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
