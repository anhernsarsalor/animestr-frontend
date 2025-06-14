<script lang="ts">
	let {
		type = 'info',
		title = '',
		message = '',
		details = null
	} = $props<{
		type?: 'error' | 'warning' | 'info';
		title?: string;
		message?: string;
		details?: string | null;
	}>();
</script>

<div class={`alert alert-${type} shadow-lg`}>
	<div class="flex items-start gap-3">
		{#if type === 'error'}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-6 w-6 flex-shrink-0 stroke-current"
				fill="none"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
		{:else if type === 'warning'}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-6 w-6 flex-shrink-0 stroke-current"
				fill="none"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
				/>
			</svg>
		{:else}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-6 w-6 flex-shrink-0 stroke-current"
				fill="none"
				viewBox="0 0 24 24"
			>
				<circle cx="12" cy="12" r="10" stroke-width="2" />
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01" />
			</svg>
		{/if}
		<div>
			<h3 class="font-bold">{title}</h3>
			<div class="text-xs">{message}</div>
			{#if details}
				<div class="text-xs">{details}</div>
			{/if}
		</div>
	</div>
</div>
