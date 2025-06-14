<script lang="ts">
	let { items = [] as string[], color = 'ghost' } = $props<{
		items?: string[];
		color?: 'primary' | 'ghost';
	}>();
</script>

<div class="flex flex-wrap gap-2">
	{#each items as item}
		<div class={`badge badge-${color}`}>{item}</div>
	{/each}
</div>
