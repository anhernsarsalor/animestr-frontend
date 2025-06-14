<script lang="ts">
	import type { PublicKey } from '@rust-nostr/nostr-sdk';

	let { pubkey }: { pubkey: PublicKey } = $props();
</script>

<img
	class="avatar overflow-hidden rounded-full"
	src="https://api.dicebear.com/9.x/avataaars-neutral/svg?seed={pubkey.toHex()}"
	alt="{pubkey.toBech32()} avatar"
/>
