<script lang="ts">
	import { from, interval, switchMap, tap, takeWhile, timer } from 'rxjs';
	import Loading from './Loading.svelte';
	import QrCode from './QRCode.svelte';
	let {
		invoice,
		verify,
		onclosed
	}: {
		invoice: string;
		verify?: string;
		onclosed?: () => void;
	} = $props();

	let settled = $state(false);
	let open = $state(true);

	$effect(() => {
		if (!open) onclosed?.();
	});

	$effect(() => {
		if (!verify) return;
		const subscription = interval(1000)
			.pipe(
				switchMap(() => from(fetch(verify).then((res) => res.json()))),
				tap((response) => {
					if (response.settled) {
						settled = true;
						timer(2000).subscribe(() => {
							open = false;
						});
					}
				}),
				takeWhile((response) => !response.settled && open, true)
			)
			.subscribe(console.log);

		return () => subscription.unsubscribe();
	});
</script>

<dialog class="modal" {open}>
	<div class="modal-box">
		<h3 class="text-lg font-bold">Invoice</h3>
		{#if invoice}
			<QrCode text={invoice} />
			<pre>{invoice}</pre>
		{:else}
			<div class="flex items-center justify-center p-10">
				<Loading inline />
			</div>
		{/if}
		{#if settled}
			<h1 class="text-center text-lg text-green-500">Paid!</h1>
		{/if}
		{#if invoice}
			<button onclick={() => (open = false)}>Close</button>
		{/if}
	</div>
</dialog>
