<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { profileLoader } from '$lib';
	import WatchList from '$lib/components/WatchList.svelte';
	import { getDisplayName, getProfileContent, normalizeToPubkey } from 'applesauce-core/helpers';
	import { npubEncode } from 'nostr-tools/nip19';

	let pubkey = $derived(normalizeToPubkey(page.params.id));
	let npub = $derived(npubEncode(pubkey));
	let profileRaw = $derived(profileLoader(pubkey));
	let profile = $derived($profileRaw ? getProfileContent($profileRaw) : undefined);
	let username = $derived(getDisplayName(profile, npub));
</script>

<svelte:head>
	<title>{username}'s Profile | Animestr</title>
	<meta property="og:title" content="{username}'s Watch List | Animestr" />
	<meta property="og:image" content={profile?.banner} />
	<meta name="twitter:title" content="{username}'s Watch List | Animestr" />
	<meta name="twitter:image" content={profile?.banner} />
</svelte:head>

<button class="btn btn-secondary" onclick={() => goto(`/user/${pubkey}`)}> Back to Profile </button>

<WatchList {pubkey} />
