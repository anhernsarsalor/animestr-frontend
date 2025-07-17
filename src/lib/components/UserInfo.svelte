<script lang="ts">
	import { type NDKUser } from '@nostr-dev-kit/ndk';
	import UserAvatar from './UserAvatar.svelte';
	import { profileLoader } from '$lib';
	import { getDisplayName } from 'applesauce-core/helpers';

	const {
		user,
		inline
	}: {
		user: NDKUser;
		inline?: boolean;
	} = $props();

	let profile = profileLoader(user.pubkey);

	const username = $derived(getDisplayName($profile));
	const shortNpub = $derived(user.npub.slice(0, 6) + '...' + user.npub.slice(-6));
	const isLoadingProfile = $derived(!$profile);
	const size = $derived(inline ? 30 : undefined);
</script>

<div
	class="items-center gap-2"
	class:gap-1={inline}
	class:flex={!inline}
	class:inline-flex={inline}
>
	<a href={`/user/${user.npub}`} class="transition-opacity hover:opacity-80">
		<UserAvatar {size} {user} />
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
		{#if !inline}
			<span class="text-xs font-medium">{shortNpub}</span>
		{/if}
	</a>
</div>
