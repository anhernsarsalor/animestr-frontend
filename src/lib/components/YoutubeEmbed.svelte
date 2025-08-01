<script lang="ts">
	interface Props {
		videoId: string;
	}

	let { videoId }: Props = $props();
	let isLoaded = $state(false);

	function loadVideo() {
		isLoaded = true;
	}
</script>

<div class="youtube-container">
	{#if !isLoaded}
		<div class="youtube-thumbnail-container" onclick={loadVideo}>
			<img
				src="https://i.ytimg.com/vi/{videoId}/hqdefault.jpg"
				alt="YouTube thumbnail"
				class="youtube-thumbnail"
				loading="lazy"
			/>
			<div class="youtube-play-button"></div>
		</div>
	{:else}
		<iframe
			src="https://www.youtube.com/embed/{videoId}?autoplay=1"
			class="youtube-embed"
			frameborder="0"
			allowfullscreen
			loading="lazy"
			allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
		></iframe>
	{/if}
</div>
