<script lang="ts">
	import { getColorFromPubkey, profileSubscription } from '$lib/utils.svelte';
	import PlaceholderAvatar from './PlaceholderAvatar.svelte';
	import { type NDKUser } from '@nostr-dev-kit/ndk';

	const {
		user
	}: {
		user: NDKUser;
	} = $props();

	let { profile } = profileSubscription(user)();

	const shortNpub = $derived(user.npub.slice(0, 6) + '...' + user.npub.slice(-6));
	const metadata = $derived(profile || null);
	const username = $derived(metadata?.displayName || metadata?.name || shortNpub);
	const avatar = $derived(metadata?.picture || '');
	const isLoadingProfile = $derived(!metadata);
	const avatarColor = $derived(getColorFromPubkey(user.pubkey));
</script>

<div class="flex items-center gap-3">
	<a href={`/user/${user.npub}`} class="avatar transition-opacity hover:opacity-80">
		<div
			class="h-12 w-12 overflow-hidden rounded-full border-3"
			style="border: 2px solid {avatarColor};"
		>
			{#if avatar}
				<img src={avatar} alt="User avatar" class="object-cover" />
			{:else}
				<PlaceholderAvatar {user} />
			{/if}
		</div>
	</a>

	<a href={`/user/${user.npub}`} class="flex flex-col transition-opacity hover:opacity-80">
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
