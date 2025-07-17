<script lang="ts">
	let { url } = $props();
</script>

<a href={url}>{url}</a>

<style>
	a {
		color: var(--color-info);
	}
</style>
