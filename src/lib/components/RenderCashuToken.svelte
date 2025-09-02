<script lang="ts">
	import { CashuMint, CashuWallet, getDecodedToken } from '@cashu/cashu-ts';
	import Icon from '@iconify/svelte';
	import CopyButton from './CopyButton.svelte';

	let {
		token
	}: {
		token: string;
	} = $props();

	let decoded = $derived(getDecodedToken(token));

	let totalAmount = $derived(decoded?.proofs?.reduce((sum, proof) => sum + proof.amount, 0) || 0);

	let mintUrl = $derived.by(() => {
		try {
			const url = new URL(decoded?.mint || '');
			return url.hostname;
		} catch {
			return decoded?.mint || 'Unknown mint';
		}
	});

	const mint = $derived(new CashuMint(decoded.mint));
	const wallet = $derived(new CashuWallet(mint));
	const isValid = $derived(
		wallet
			.checkProofsStates(decoded.proofs)
			.then((proofs) => !proofs.some((p) => p.state !== 'UNSPENT'))
	);
</script>

<div class="card bg-base-100 border-base-300 mx-auto max-w-md border shadow-xl">
	<div class="card-body">
		<div class="card-title mb-4 flex flex-row place-content-center items-center gap-3 self-center">
			<div class="avatar placeholder">
				<div class="bg-primary text-primary-content grid w-12 place-items-center rounded-full">
					<Icon icon="cryptocurrency:btc" width="48" height="48" />
				</div>
			</div>
			<h2 class="text-center" style:margin="0">Cashu Token</h2>
		</div>

		<div class="stat bg-base-200 mb-4 rounded-lg p-4">
			<div class="stat-title text-xs">Total Amount</div>
			<div class="stat-value text-primary flex items-center gap-2">
				<Icon icon="tabler:coins" width="32" height="32" />
				{totalAmount.toLocaleString()}
			</div>
			<div class="stat-desc">{decoded?.unit === 'sat' ? 'satoshis' : decoded?.unit}</div>
		</div>

		<div class="mb-4">
			<div class="mb-2 flex items-center gap-2">
				<Icon icon="tabler:world" width="16" height="16" class="opacity-70" />
				<span class="text-sm font-semibold">Mint</span>
			</div>
			<div class="badge badge-outline badge-lg w-full justify-start p-3">
				<Icon icon="tabler:server" width="14" height="14" class="mr-2" />
				<span class="truncate">{mintUrl}</span>
			</div>
		</div>

		{#await isValid then isValid}
			{#if isValid}
				<div class="mt-4 flex justify-end">
					<div class="badge badge-success gap-2">
						<Icon icon="tabler:circle-check-filled" width="16" height="16" class="animate-pulse" />
						Valid Token
					</div>
					<CopyButton text={token} label="Copy Token" />
				</div>
			{:else}
				<div class="mt-4 flex justify-end">
					<div class="badge badge-warning gap-2">
						<Icon icon="tabler:alert-triangle-filled" width="16" height="16" />
						Already Claimed
					</div>
				</div>
			{/if}
		{/await}
	</div>
</div>
