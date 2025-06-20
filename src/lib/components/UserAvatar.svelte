<script lang="ts">
	import PlaceholderAvatar from './PlaceholderAvatar.svelte';
	import { type NDKUser } from '@nostr-dev-kit/ndk';
	import { profileSubscription } from '$lib/utils.svelte';

	let { user }: { user?: NDKUser } = $props();
	let { profile } = profileSubscription(user!)();
	let loading = $derived(!profile);
</script>

<div class="avatar">
	{#if loading}
		<PlaceholderAvatar {user} />
	{:else}
		<img
			class="aspect-square max-h-[50px] max-w-[50px] rounded-full"
			src={profile!.picture}
			alt="User avatar"
		/>
	{/if}
</div>
