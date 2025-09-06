<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	let {
		open = $bindable()
	}: {
		open: boolean;
	} = $props();

	let dialogEl: HTMLDialogElement;

	$effect(() => {
		if (open) dialogEl?.showModal();
		else dialogEl?.close();
	});
</script>

<dialog bind:this={dialogEl} onclose={() => (open = false)} aria-modal="true">
	<div
		class="modal-box from-base-100 to-base-200 relative max-w-md bg-gradient-to-br shadow-2xl"
		role="document"
	>
		<button
			class="btn btn-circle btn-ghost btn-sm hover:bg-error/20 hover:text-error absolute top-4 right-4"
			aria-label="Close modal"
			onclick={() => (open = false)}
		>
			✕
		</button>
		<slot />
	</div>
</dialog>

<style>
	dialog {
		padding: 0;
		margin: auto;
		border: none;
		background: transparent;
		max-width: 90vw;
		max-height: 90vh;
		width: auto;
		height: auto;
		overflow: visible;
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	dialog::backdrop {
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(32px);
		opacity: 1;
	}

	.modal-box {
		opacity: 1;
		animation: modalSlideIn 0.3s ease-out;
		border-radius: 50px;
		border: 2px solid rgba(from var(--color-base-300) r g b / 20%);
	}

	@keyframes modalSlideIn {
		from {
			opacity: 0;
			transform: scale(0) translateY(-20px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	@media (prefers-color-scheme: dark) {
		dialog::backdrop {
			background: rgba(0, 0, 0, 0.8);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.modal-box {
			animation: none;
		}
	}
</style>
