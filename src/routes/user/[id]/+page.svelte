<script lang="ts">
	import EventList from '$lib/components/EventList.svelte';
	import {
		Filter,
		Kind,
		KindStandard,
		PublicKey,
		Nip19Profile,
		Metadata
	} from '@rust-nostr/nostr-sdk';
	import { loadUserMetadata, getColorFromPubkey, getInitials } from '$lib/nostr/user.svelte';
	import { page } from '$app/state';
	import Loading from '$lib/components/Loading.svelte';
	import { filterNoReplies } from '$lib/nostr/filterEvents.svelte';
	import PlaceholderAvatar from '$lib/components/PlaceholderAvatar.svelte';

	let userMetadata = $state<Metadata | null>(null);
	let pubkeyObj = $derived(parseUserId(page.params.id));
	let isLoading = $state(true);
	let imgError = $state(false);

	const EVENTS_PER_PAGE = 20;

	function handleImgError() {
		imgError = true;
	}

	function parseUserId(id: string): PublicKey {
		try {
			if (id.startsWith('npub')) {
				return PublicKey.parse(id);
			}
			if (id.startsWith('nprofile')) {
				const profile = Nip19Profile.fromBech32(id);
				return profile.publicKey();
			}
			return PublicKey.parse(id);
		} catch (e) {
			console.error('Error parsing user ID:', e);
			return PublicKey.parse(id);
		}
	}

	async function loadUserData() {
		isLoading = true;
		imgError = false;

		try {
			pubkeyObj = parseUserId(page.params.id);

			userMetadata = await loadUserMetadata(pubkeyObj, (metadata) => {
				userMetadata = metadata;
			});

			isLoading = false;
		} catch (err) {
			console.error('Error fetching user data:', err);
			isLoading = false;
		}
	}

	let previousId: string | null = null;

	$effect(() => {
		const currentUserId = page.params.id;
		if (currentUserId !== previousId) {
			loadUserData();
			previousId = currentUserId;
		}
	});

	let query = $derived(
		new Filter().kind(Kind.fromStd(KindStandard.TextNote)).author(pubkeyObj!).limit(EVENTS_PER_PAGE)
	);
</script>

<svelte:head>
	<title>{userMetadata?.getName() || page.params.id} | User Profile</title>
</svelte:head>

{#if !pubkeyObj}
	<Loading />
{:else}
	<div class="container mx-auto max-w-3xl p-4">
		{#if userMetadata?.getBanner()}
			<div class="relative mb-6 h-40 w-full overflow-hidden rounded-lg md:h-60">
				<img
					src={userMetadata.getBanner()}
					alt="User banner"
					class="absolute inset-0 h-full w-full object-cover"
				/>
				<div
					class="from-base-100 via-base-100/50 absolute inset-0 bg-gradient-to-t to-transparent"
				></div>
			</div>
		{/if}
		<div class="bg-base-200 mb-6 rounded-lg p-6 pt-16 shadow-sm">
			<div class:-mt-20={userMetadata?.getBanner()} class="avatar">
				<div
					class="h-32 w-32 overflow-hidden rounded-full border-4 md:h-40 md:w-40"
					style="border: 4px solid {getColorFromPubkey(pubkeyObj)};"
				>
					{#if userMetadata?.picture && !imgError}
						<img
							src={userMetadata.getPicture()}
							alt="User avatar"
							onerror={handleImgError}
							class="object-cover"
						/>
					{:else}
						<PlaceholderAvatar pubkey={pubkeyObj} />
					{/if}
				</div>
			</div>

			<div class="flex flex-col">
				<h1 class="mb-1 text-2xl font-bold">
					{#if isLoading && !userMetadata}
						<div class="bg-base-300 h-8 w-48 animate-pulse rounded"></div>
					{:else}
						{userMetadata?.getDisplayName() || userMetadata?.getName() || pubkeyObj.toBech32()}
					{/if}
				</h1>
				<div class="text-base-content/70 mb-3 font-mono text-sm">
					{pubkeyObj.toBech32()}
				</div>
			</div>
		</div>

		{#key query}
			<EventList
				{query}
				filterFn={filterNoReplies}
				header="Notes"
				emptyMessage="This user hasn't published any notes yet."
			/>
		{/key}
	</div>
{/if}
