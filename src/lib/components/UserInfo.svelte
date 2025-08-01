<script lang="ts">
	import UserAvatar from './UserAvatar.svelte';
	import { profileLoader } from '$lib';
	import { getDisplayName, normalizeToPubkey } from 'applesauce-core/helpers';
	import { npubEncode } from 'nostr-tools/nip19';

	const {
		user,
		inline
	}: {
		user: string;
		inline?: boolean;
	} = $props();

	let pubkey = normalizeToPubkey(user);
	let npub = npubEncode(pubkey);
	let profile = profileLoader(pubkey);

	const username = $derived(getDisplayName($profile));
	const shortNpub = $derived(npub.slice(0, 6) + '...' + npub.slice(-6));
	const isLoadingProfile = $derived(!$profile);
	const size = $derived(inline ? 30 : undefined);
</script>

<div
	class="items-center gap-2"
	class:ml-2={inline}
	class:gap-1={inline}
	class:flex={!inline}
	class:inline-flex={inline}
>
	<a href={`/user/${npub}`} class="transition-opacity hover:opacity-80">
		<UserAvatar {size} user={pubkey} />
	</a>

	<a href={`/user/${npub}`} class="flex flex-col transition-opacity hover:opacity-80">
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
