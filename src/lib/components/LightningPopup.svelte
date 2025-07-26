<script lang="ts">
	import { onMount } from 'svelte';
	import { from, interval, switchMap, tap, takeWhile } from 'rxjs';
	import Loading from './Loading.svelte';
	import QrCode from './QRCode.svelte';
	let {
		invoice,
		verify
	}: {
		invoice: string;
		verify?: string;
	} = $props();

	let settled = $state(false);
	let open = $state(true);

	$effect(() => {
		if (!verify) return;
		const subscription = interval(1000)
			.pipe(
				switchMap(() => from(fetch(verify).then((res) => res.json()))),
				tap((response) => {
					if (response.settled) {
						settled = true;
						setTimeout(() => {
							open = false;
						}, 2000);
					}
				}),
				takeWhile((response) => !response.settled, true)
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
			<Loading inline />
		{/if}
		{#if settled}
			<h1 class="text-center text-lg text-green-500">Paid!</h1>
		{/if}
		<button onclick={() => (open = false)}>Close</button>
	</div>
</dialog>
