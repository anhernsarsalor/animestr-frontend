<script lang="ts">
	import { onMount } from 'svelte';

	onMount(() => {
		document.addEventListener('nlAuth', (e: CustomEvent<{ type: string }>) => {
			console.log('nlAuth event received:', e);
			if (e.detail.type === 'logout') window.location.href = '/';
		});
		document.dispatchEvent(new Event('nlLogout'));
	});
</script>
