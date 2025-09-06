<script lang="ts">
	import { simpleAddressLoader } from '$lib';
	import { normalizeToPubkey } from 'applesauce-core/helpers';
	import UserAvatar from './UserAvatar.svelte';
	import Username from './Username.svelte';
	import { map, tap } from 'rxjs';

	let { pubkey }: { pubkey: string } = $props();

	let following = $derived(
		simpleAddressLoader({
			kind: 3,
			pubkey: normalizeToPubkey(pubkey)
		}).pipe(
			map((t) => t.tags.filter((t) => t[0] === 'p')),
			map((t) => t.map((t) => t[1]))
		)
	);
</script>

<ul class="list bg-base-100 rounded-box shadow-md">
	{#each $following as follow}
		<li class="list-row">
			<div>
				<UserAvatar user={follow} />
			</div>
			<div>
				<div>
					<Username user={follow} />
				</div>
				<a href="/user/{follow}" class="text-xs font-semibold uppercase opacity-60">
					View Profile
				</a>
			</div>
		</li>
	{/each}
</ul>
