<script lang="ts">
	import { profileLoader } from '$lib';
	import { getColorFromPubkey } from '$lib/utils.svelte';
	import { getProfilePicture, normalizeToPubkey } from 'applesauce-core/helpers';
	import { npubEncode } from 'nostr-tools/nip19';

	let {
		user,
		size = 52,
		borderWidth = 4
	}: { user: string; size?: number; borderWidth?: number } = $props();

	let pubkey = normalizeToPubkey(user);
	let npub = npubEncode(pubkey);
	let profile = profileLoader(pubkey);
	let picture = $derived(
		getProfilePicture($profile, `https://api.dicebear.com/9.x/avataaars-neutral/svg?seed=${pubkey}`)
	);
	let border = $derived(getColorFromPubkey(pubkey));
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
		<img width={size} class="aspect-square" src={picture} alt="{npub} avatar" />
	</div>
</div>
