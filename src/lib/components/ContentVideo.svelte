<script lang="ts">
	interface Props {
		src: string;
	}

	let { src }: Props = $props();
</script>

<video {src} controls>
	<source {src} type="video/webm" />
	Your browser does not support the video tag.
</video>

<style>
	video {
		max-width: 100%;
		height: auto;
		max-height: 500px;
		border-radius: 8px;
		margin: 10px 0;
		display: block;
	}
</style>
