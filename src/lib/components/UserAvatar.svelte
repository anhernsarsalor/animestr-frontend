<script lang="ts">
	import { loadUserMetadata } from '$lib/nostr/user.svelte';
	import type { Metadata, PublicKey } from '@rust-nostr/nostr-sdk';
	import PlaceholderAvatar from './PlaceholderAvatar.svelte';

	let { pubkey }: { pubkey: PublicKey } = $props();
	let metadata = $state<Metadata | undefined>();
	let avatar = $derived(metadata?.getPicture() || '');

	$effect(() => {
		loadUserMetadata(pubkey).then((m) => (metadata = m));
	});
</script>

<div class="avatar">
	{#if metadata}
		<img
			class="aspect-square max-h-[50px] max-w-[50px] rounded-full"
			src={avatar}
			alt="User avatar"
		/>
	{:else}
		<PlaceholderAvatar {pubkey} />
	{/if}
</div>
