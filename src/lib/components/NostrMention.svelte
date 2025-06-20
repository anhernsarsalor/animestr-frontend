<script lang="ts">
	import PlaceholderAvatar from './PlaceholderAvatar.svelte';
	import { getUserFromMention, profileSubscription } from '$lib/utils.svelte';

	interface Props {
		pubkey: string;
	}

	let { pubkey }: Props = $props();
	let user = $derived(getUserFromMention(pubkey));
	let { profile } = $derived(profileSubscription(user!)());

	$inspect(profile);

	let isLoading = $derived(!profile);
	let avatar = $derived(profile?.picture || '');
	let username = $derived(
		profile?.displayName || profile?.name || pubkey.slice(0, 6) + '...' + pubkey.slice(-6)
	);
</script>

<a href={`/user/${user?.pubkey}`} class="mention inline-flex items-center hover:underline">
	{#if avatar}
		<img
			src={avatar}
			alt="User avatar"
			class="mr-1 h-4 w-4 flex-shrink-0 rounded-full object-cover"
		/>
	{:else}
		<PlaceholderAvatar {user} />
	{/if}

	{#if isLoading}
		<span class="bg-base-300 inline-block h-4 w-24 animate-pulse rounded"></span>
	{:else if username}
		<span class="text-xs font-medium">
			@{username}
		</span>
	{:else}
		<span class="text-xs font-medium">
			@{user!.npub.slice(0, 6)}...{user!.npub.slice(-6)}
		</span>
	{/if}
</a>

<style>
	a.mention img {
		display: inline-block;
	}
</style>
