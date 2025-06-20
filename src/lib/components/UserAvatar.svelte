<script lang="ts">
	import { getColorFromPubkey, profileSubscription } from '$lib/utils.svelte';
	import { type NDKUser } from '@nostr-dev-kit/ndk';

	let {
		user,
		size = 52,
		borderWidth = 4
	}: { user?: NDKUser; size?: number; borderWidth?: number } = $props();
	let profile = $derived(profileSubscription(user));
	let loading = $derived(!$profile);
	let border = $derived(getColorFromPubkey(user!.pubkey));
</script>

<div class="avatar relative" style:height="{size}px" style:width="{size}px">
	<div
		class="mask mask-hexagon-2 absolute"
		style:height="{size}px"
		style:width="{size}px"
		style:background={border}
	></div>
	<div
		class="mask mask-hexagon-2 relative"
		style:width="{size - borderWidth * 2}px"
		style:height="{size - borderWidth * 2}px"
		style:transform="translate({borderWidth}px, {borderWidth}px)"
	>
		{#if loading}
			<img
				src="https://api.dicebear.com/9.x/avataaars-neutral/svg?seed={user?.pubkey}"
				alt="{user?.npub} avatar"
				width="100%"
			/>
		{:else}
			<img width={size} class="aspect-square" src={$profile!.picture} alt="User avatar" />
		{/if}
	</div>
</div>
