<script lang="ts">
	import { Metadata, PublicKey } from '@rust-nostr/nostr-sdk';
	import { loadUserMetadata } from '$lib/nostr/user.svelte';
	import PlaceholderAvatar from './PlaceholderAvatar.svelte';

	interface Props {
		pubkey: string;
	}

	let { pubkey }: Props = $props();

	let isLoading = $state(true);
	let imgError = $state(false);
	let pubkeyObj: PublicKey = $derived(PublicKey.parse(pubkey));
	let metadata = $state<Metadata | undefined>();
	let username = $derived<string | undefined>(metadata?.getName());
	let avatar = $derived<string | undefined>(metadata?.getPicture());

	$effect(() => {
		try {
			loadUserData();
		} catch (e) {
			console.warn('Invalid pubkey for NostrMention:', pubkey);
			isLoading = false;
		}
	});

	async function loadUserData() {
		try {
			isLoading = true;
			metadata = await loadUserMetadata(pubkeyObj);
		} catch (e) {
			console.error('Error loading user metadata:', e);
		} finally {
			isLoading = false;
		}
	}

	function handleImgError() {
		imgError = true;
	}
</script>

<a href={`/user/${pubkeyObj.toBech32()}`} class="mention inline-flex items-center hover:underline">
	{#if avatar && !imgError}
		<img
			src={avatar}
			alt="User avatar"
			onerror={handleImgError}
			class="mr-1 h-4 w-4 flex-shrink-0 rounded-full object-cover"
		/>
	{:else}
		<PlaceholderAvatar pubkey={pubkeyObj} />
	{/if}

	{#if isLoading}
		<span class="bg-base-300 inline-block h-4 w-24 animate-pulse rounded"></span>
	{:else if username}
		<span class="text-xs font-medium">
			@{username}
		</span>
	{:else}
		<span class="text-xs font-medium">
			@{pubkeyObj.toBech32().slice(0, 6)}...{pubkeyObj.toBech32().slice(-6)}
		</span>
	{/if}
</a>

<style>
	a.mention img {
		display: inline-block;
	}
</style>
