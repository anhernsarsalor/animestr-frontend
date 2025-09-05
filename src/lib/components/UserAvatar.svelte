<script lang="ts">
	import { profileLoader } from '$lib';
	import { getProfilePicture, normalizeToPubkey } from 'applesauce-core/helpers';
	import { loadImage } from '$lib/imagecache';
	import { untrack } from 'svelte';
	import UserAvatarDisplay from './UserAvatarDisplay.svelte';

	let {
		user,
		size = 52,
		borderWidth = 4
	}: { user: string; size?: number; borderWidth?: number } = $props();

	let pubkey = $derived(normalizeToPubkey(user));
	let profile = $derived(profileLoader(pubkey));
	let profilePicture = $derived(getProfilePicture($profile));

	let currentPicture = $state('');
	let isLoading = $state(false);

	async function handleImageLoad() {
		if (isLoading) return;

		isLoading = true;

		if (profilePicture) {
			const profileLoaded = await loadImage(profilePicture);
			if (profileLoaded) {
				currentPicture = profilePicture;
				isLoading = false;
				return;
			}
		}

		isLoading = false;
	}

	$effect(() => {
		profilePicture;

		untrack(() => {
			handleImageLoad();
		});
	});
</script>

<UserAvatarDisplay {pubkey} url={profilePicture} {size} {borderWidth} />
