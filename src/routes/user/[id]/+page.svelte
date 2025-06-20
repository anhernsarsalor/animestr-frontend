<script lang="ts">
	import EventList from '$lib/components/EventList.svelte';
	import { page } from '$app/state';
	import Loading from '$lib/components/Loading.svelte';
	import { filterNoReplies } from '$lib/nostr/filterEvents.svelte';
	import { getUserFromMention, profileSubscription } from '$lib/utils.svelte';
	import { ndk } from '$lib/stores/signerStore.svelte';
	import { NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk';
	import UserAvatar from '$lib/components/UserAvatar.svelte';

	let userId = page.params.id;

	let user = $derived(getUserFromMention(userId));
	let profile = $derived(profileSubscription(user!));

	let isLoading = $derived(!$profile);

	let events = $derived(
		ndk.$subscribe([{ kinds: [1], authors: [user!.pubkey] }], {
			closeOnEose: false,
			cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST
		})
	);

	let filteredEvents = $derived(events.filter(filterNoReplies));
</script>

<svelte:head>
	<title>{$profile?.displayName || $profile?.name || page.params.id} | User Profile</title>
</svelte:head>

{#if isLoading}
	<Loading />
{:else}
	<div class="container mx-auto max-w-3xl p-4">
		{#if $profile?.banner}
			<div class="relative mb-6 h-40 w-full overflow-hidden rounded-lg md:h-60">
				<img
					src={$profile.banner}
					alt="User banner"
					class="absolute inset-0 h-full w-full object-cover"
				/>
				<div
					class="from-base-100 via-base-100/50 absolute inset-0 bg-gradient-to-t to-transparent"
				></div>
			</div>
		{/if}
		<div class="bg-base-200 mb-6 rounded-lg p-6 pt-16 shadow-sm">
			<div class:-mt-20={$profile?.banner} class="avatar">
				<UserAvatar {user} />
			</div>

			<div class="flex flex-col">
				<h1 class="mb-1 text-2xl font-bold">
					{#if isLoading}
						<Loading inline />
					{:else}
						{$profile?.displayName || $profile?.name || user.pubkey}
					{/if}
				</h1>
				<div class="text-base-content/70 mb-3 font-mono text-sm">
					{user.npub}
				</div>
			</div>
		</div>

		<EventList
			events={filteredEvents}
			header="Notes"
			emptyMessage="This user hasn't published any notes yet."
		/>
	</div>
{/if}
