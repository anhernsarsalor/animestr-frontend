<script lang="ts">
	import { Carta, MarkdownEditor } from 'carta-md';
	import 'carta-md/default.css';
	import UserAvatar from './UserAvatar.svelte';
	import { nostr } from '$lib/stores/signerStore.svelte';
	import type { Event } from 'nostr-tools';
	import { createEvent } from '$lib';

	const carta = new Carta({
		sanitizer: false,
		extensions: []
	});

	let { replyTo }: { replyTo?: Event } = $props();

	let content = $state('');

	async function createPost() {
		let event = {
			kind: 1,
			content,
			tags: [['t', 'animestr']]
		};
		if (replyTo) {
			if (replyTo.kind === 24) {
				event.kind = 24;
				event.tags.push(['q', replyTo.id]);
			} else {
				const root = replyTo.tags.find((t) => t[0] === 'e' && t[3] === 'root')?.[1];
				if (root) {
					event.tags.push(['e', root, '', 'root']);
					event.tags.push(['e', replyTo.id, '', 'reply']);
				} else event.tags.push(['e', replyTo.id, '', 'root']);
			}
			event.tags.push(['p', replyTo.pubkey]);
		}
		await createEvent(event);
		content = '';
	}
</script>

<div class="card bg-base-200/50 border-base-300 mb-6 border shadow-sm">
	<div class="card-body p-4">
		<div class="flex gap-4">
			<UserAvatar user={nostr.activeUser} />

			<div class="flex-1">
				<MarkdownEditor mode="tabs" theme="animestr" bind:value={content} {carta} />
				<div class="card-actions mt-2 justify-end">
					<button onclick={createPost} class="btn btn-primary btn-sm" disabled={!content.trim()}>
						Post
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								d="M10.894 2.894a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 16.571V11a1 1 0 112 0v5.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.41l-7-14z"
							/>
						</svg>
					</button>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	:global(.carta-renderer) {
		display: none;
	}
</style>
