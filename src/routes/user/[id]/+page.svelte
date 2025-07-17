<script lang="ts">
	import EventList from '$lib/components/EventList.svelte';
	import { page } from '$app/state';
	import Loading from '$lib/components/Loading.svelte';
	import { filterNoReplies } from '$lib/nostr/filterEvents.svelte';
	import { getUserFromMention } from '$lib/utils.svelte';
	import UserAvatar from '$lib/components/UserAvatar.svelte';
	import { profileLoader, timelineLoaderToSvelteReadable } from '$lib';
	import { getDisplayName, getProfileContent } from 'applesauce-core/helpers';

	let userId = $derived(page.params.id);
	let user = $derived(getUserFromMention(userId));
	let profileRaw = $derived(profileLoader(user.pubkey!));
	let profile = $derived($profileRaw ? getProfileContent($profileRaw) : undefined);
	let username = $derived(getDisplayName(profile, user.npub));

	let isLoading = $derived(!profile);

	let events = timelineLoaderToSvelteReadable({
		kinds: [1, 31111],
		authors: [user.pubkey]
	});

	let filteredEvents = $derived($events.filter(filterNoReplies));
</script>

<svelte:head>
	<title>{username} | User Profile</title>
</svelte:head>

{#if isLoading}
	<Loading />
{:else}
	<div class="container mx-auto max-w-3xl p-4">
		{#if profile?.banner}
			<div class="relative mb-6 h-40 w-full overflow-hidden rounded-lg md:h-60">
				<img
					src={profile.banner}
					alt="User banner"
					class="absolute inset-0 h-full w-full object-cover"
				/>
				<div
					class="from-base-100 via-base-100/50 absolute inset-0 bg-gradient-to-t to-transparent"
				></div>
			</div>
		{/if}
		<div class="bg-base-200 mb-6 rounded-lg p-6 pt-16 shadow-sm">
			<div class:-mt-20={profile?.banner} class="avatar">
				<UserAvatar {user} />
			</div>

			<div class="flex flex-col">
				<h1 class="mb-1 text-2xl font-bold">
					{#if isLoading}
						<Loading inline />
					{:else}
						{username}
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
