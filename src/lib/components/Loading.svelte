<script lang="ts">
	import Loading from './Loading.svelte';

	let {
		inline
	}: {
		inline?: boolean;
	} = $props();
</script>

{#if inline}
	<span class="loading loading-infinity text-primary w-[50%] max-w-[500px] self-center"></span>
{:else}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
		<Loading inline />
	</div>
{/if}
