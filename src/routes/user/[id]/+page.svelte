<script lang="ts">
	import EventList from '$lib/components/EventList.svelte';
	import { page } from '$app/state';
	import Loading from '$lib/components/Loading.svelte';
	import { filterNoReplies } from '$lib/nostr/filterEvents.svelte';
	import UserAvatar from '$lib/components/UserAvatar.svelte';
	import { profileLoader, timelineLoader } from '$lib';
	import { getDisplayName, getProfileContent, normalizeToPubkey } from 'applesauce-core/helpers';
	import WatchList from '$lib/components/WatchList.svelte';
	import { npubEncode } from 'nostr-tools/nip19';

	let pubkey = $derived(normalizeToPubkey(page.params.id));
	let npub = $derived(npubEncode(pubkey));
	let profileRaw = $derived(profileLoader(pubkey));
	let profile = $derived($profileRaw ? getProfileContent($profileRaw) : undefined);
	let username = $derived(getDisplayName(profile, npub));

	let isLoading = $derived(!profile);

	let selectedTab = $state('notes');

	const events = $derived(
		timelineLoader({
			kinds: [1, 31111],
			authors: [pubkey]
		}).pipe(filterNoReplies)
	);
</script>

<svelte:head>
	<title>{username}'s Profile | Animestr</title>
	<meta property="og:title" content="{username}'s Profile | Animestr" />
	<meta property="og:image" content={profile?.banner} />
	<meta name="twitter:title" content="{username}'s Profile | Animestr" />
	<meta name="twitter:image" content={profile?.banner} />
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
				<UserAvatar user={pubkey} />
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
					{npub}
				</div>
			</div>
		</div>

		<div class="tabs tabs-box">
			<input
				type="radio"
				name="userTabs"
				class="tab"
				aria-label="Notes"
				value="notes"
				bind:group={selectedTab}
			/>
			<div class="tab-content bg-base-100 border-base-300 p-6">
				<EventList {events} emptyMessage="This user hasn't published any notes yet." />
			</div>

			<input
				type="radio"
				name="userTabs"
				class="tab"
				aria-label="Anime Watch List"
				value="anime-list"
				bind:group={selectedTab}
			/>
			<div class="tab-content bg-base-100 border-base-300 p-6">
				<WatchList {pubkey} />
			</div>
		</div>
	</div>
{/if}
