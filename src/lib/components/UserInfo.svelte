<script lang="ts">
	import UserAvatar from './UserAvatar.svelte';
	import { normalizeToPubkey } from 'applesauce-core/helpers';
	import { npubEncode } from 'nostr-tools/nip19';
	import Username from './Username.svelte';

	const {
		user,
		inline
	}: {
		user: string;
		inline?: boolean;
	} = $props();

	let pubkey = $derived(normalizeToPubkey(user));
	let npub = $derived(npubEncode(pubkey));

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

	<Username user={pubkey} {inline} />
</div>
