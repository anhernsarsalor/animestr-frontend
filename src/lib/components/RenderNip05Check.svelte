<script lang="ts">
	import { isValidNip05 } from '$lib/utils.svelte';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	let {
		nip05,
		pubkey
	}: {
		nip05: string;
		pubkey: string;
	} = $props();

	let validating = $state(true);
	let isValid = $state(false);

	onMount(() => {
		isValidNip05(pubkey)(nip05).then((valid) => {
			isValid = valid;
			validating = false;
		});
	});
</script>

{#if validating}
	<div class="text-info flex items-center gap-2">
		<Icon icon="line-md:loading-twotone-loop" width="18" height="18" />
		<span class="text-sm font-medium">{nip05}</span>
	</div>
{:else if isValid}
	<div class="text-success flex items-center gap-2">
		<Icon icon="mdi:check-decagram" width="18" height="18" />
		<span class="text-sm font-medium">{nip05}</span>
	</div>
{:else}
	<div class="text-error flex items-center gap-2">
		<Icon icon="line-md:alert-circle-twotone-loop" width="18" height="18" />
		<span class="text-sm font-medium">{nip05}</span>
	</div>
{/if}
