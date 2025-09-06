<script lang="ts">
	import { toasts } from '$lib/utils.svelte';
	import Icon from '@iconify/svelte';

	const icons = {
		success: 'tabler:circle-check-filled',
		error: 'tabler:circle-x-filled',
		info: 'tabler:info-circle-filled',
		warning: 'tabler:alert-triangle-filled'
	};
</script>

<div class="toast toast-top toast-end z-[9999]">
	{#each toasts as toast (toast.id)}
		<div class="alert alert-{toast.type} shadow-lg">
			<Icon icon={icons[toast.type]} width="20" height="20" />
			<span>{toast.message}</span>
		</div>
	{/each}
</div>
