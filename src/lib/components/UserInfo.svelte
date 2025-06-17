<script lang="ts">
	import { loadUserMetadata, getColorFromPubkey } from '$lib/nostr/user.svelte';
	import { Metadata, type PublicKey } from '@rust-nostr/nostr-sdk';
	import PlaceholderAvatar from './PlaceholderAvatar.svelte';

	const {
		pubkey
	}: {
		pubkey: PublicKey;
	} = $props();

	let isLoadingProfile = $state(true);
	let imgError = $state(false);

	let metadata = $state<Metadata | undefined>();
	let username = $derived(metadata?.getName() || '');
	let avatar = $derived(metadata?.getPicture() || '');

	$effect(() => {
		if (!pubkey) return;

		isLoadingProfile = true;

		loadUserMetadata(pubkey)
			.then((newMetadata) => {
				if (newMetadata) metadata = newMetadata;
				isLoadingProfile = false;
			})
			.catch((err) => {
				console.error('Error loading profile:', err);
				isLoadingProfile = false;
			});
	});

	function handleImgError() {
		imgError = true;
	}

	const shortNpub = pubkey.toBech32().slice(0, 6) + '...' + pubkey.toBech32().slice(-6);
	const avatarColor = getColorFromPubkey(pubkey);
</script>

<div class="flex items-center gap-3">
	<a href={`/user/${pubkey.toBech32()}`} class="avatar transition-opacity hover:opacity-80">
		<div
			class="h-12 w-12 overflow-hidden rounded-full border-3"
			style="border: 2px solid {avatarColor};"
		>
			{#if avatar && !imgError}
				<img src={avatar} alt="User avatar" onerror={handleImgError} class="object-cover" />
			{:else}
				<PlaceholderAvatar {pubkey} />
			{/if}
		</div>
	</a>

	<a href={`/user/${pubkey.toBech32()}`} class="flex flex-col transition-opacity hover:opacity-80">
		<span class="leading-tight font-semibold">
			{#if username}
				{username}
			{:else if isLoadingProfile}
				<span class="bg-base-300 inline-block h-4 w-24 animate-pulse rounded"></span>
			{:else}
				{shortNpub}
			{/if}
		</span>
		<span class="text-xs font-medium">{shortNpub}</span>
	</a>
</div>
