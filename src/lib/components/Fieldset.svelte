<script lang="ts">
	import Icon from '@iconify/svelte';

	let {
		title,
		icon,
		label,
		error
	}: {
		title: string;
		icon?: string;
		label?: string;
		error?: string;
	} = $props();
</script>

<fieldset class="fieldset bg-base-200 border-base-300 rounded-box w-full border p-4">
	<legend class="fieldset-legend">
		{#if icon}
			<Icon {icon} width="20" height="20" class="text-warning" />
		{/if}
		{title}
	</legend>

	{#if label}
		<p class="label">{label}</p>
	{/if}

	<slot />

	{#if error}
		<div role="alert" class="alert alert-error alert-outline">
			<span>{error}</span>
		</div>
	{/if}
</fieldset>
