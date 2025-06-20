<script lang="ts">
	import type { NDKUser } from '@nostr-dev-kit/ndk';

	let { user }: { user?: NDKUser } = $props();
</script>

<img
	class="avatar max-h-[50px] max-w-[50px] overflow-hidden rounded-full"
	src="https://api.dicebear.com/9.x/avataaars-neutral/svg?seed={user?.pubkey}"
	alt="{user?.npub} avatar"
/>
