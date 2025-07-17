<script lang="ts">
	import { profileLoader } from '$lib';
	import { getColorFromPubkey } from '$lib/utils.svelte';
	import { type NDKUser } from '@nostr-dev-kit/ndk';
	import { getProfilePicture } from 'applesauce-core/helpers';

	let {
		user,
		size = 52,
		borderWidth = 4
	}: { user: NDKUser; size?: number; borderWidth?: number } = $props();

	let profile = profileLoader(user.pubkey);
	let picture = $derived(
		getProfilePicture(
			$profile,
			`https://api.dicebear.com/9.x/avataaars-neutral/svg?seed=${user.pubkey}`
		)
	);
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
		<img width={size} class="aspect-square" src={picture} alt="{user.npub} avatar" />
	</div>
</div>
