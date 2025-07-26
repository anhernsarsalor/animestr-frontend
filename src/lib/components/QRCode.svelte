<script lang="ts">
	import { qr } from 'headless-qr';

	let { text }: { text: string } = $props();
	let canvas: HTMLCanvasElement;

	$effect(() => {
		const modules = qr(text);

		const ctx = canvas.getContext('2d');
		canvas.width = canvas.height = modules.length;

		ctx!.fillStyle = 'black';

		modules.forEach((row, y) => {
			row.forEach((cell, x) => {
				if (cell) {
					ctx!.fillRect(x, y, 1, 1);
				}
			});
		});
	});
</script>

<canvas bind:this={canvas}></canvas>

<style>
	canvas {
		width: 100%;
		aspect-ratio: 1;
		image-rendering: pixelated;
		background-color: white;
		padding: 20px;
	}
</style>
