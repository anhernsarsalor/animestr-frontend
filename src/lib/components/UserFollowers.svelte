<script lang="ts">
	import { timelineLoader } from '$lib';
	import { normalizeToPubkey } from 'applesauce-core/helpers';
	import UserAvatar from './UserAvatar.svelte';
	import Username from './Username.svelte';

	let { pubkey }: { pubkey: string } = $props();

	let followers = $derived(
		timelineLoader({
			kinds: [3],
			'#p': [normalizeToPubkey(pubkey)]
		})
	);
</script>

<ul class="list bg-base-100 rounded-box shadow-md">
	{#each $followers as follower}
		<li class="list-row">
			<div>
				<UserAvatar user={follower.pubkey} />
			</div>
			<div>
				<div>
					<Username user={follower.pubkey} />
				</div>
				<a href="/user/{follower.pubkey}" class="text-xs font-semibold uppercase opacity-60">
					View Profile
				</a>
			</div>
		</li>
	{/each}
</ul>
