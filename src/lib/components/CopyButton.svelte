<script lang="ts">
	import { showToast } from '$lib/utils.svelte';
	import Icon from '@iconify/svelte';

	let {
		text,
		label = 'Copy'
	}: {
		text: string;
		label?: string;
	} = $props();

	let copied = $state(false);

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(text);
			copied = true;
			showToast('Copied to clipboard!', 'success');
			setTimeout(() => (copied = false), 2000);
		} catch (err) {
			if (typeof window !== 'undefined' && (window as any).showToast)
				(window as any).showToast('Failed to copy', 'error');
		}
	}
</script>

<button class="btn gap-2" class:btn-success={copied} onclick={handleCopy} aria-label={label}>
	{#if copied}
		<Icon icon="tabler:check" width="16" height="16" />
	{:else}
		<Icon icon="tabler:copy" width="16" height="16" />
	{/if}
	{copied ? 'Copied!' : label}
</button>
