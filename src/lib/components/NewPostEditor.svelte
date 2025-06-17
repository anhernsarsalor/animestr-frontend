<script lang="ts">
	import UserAvatar from './UserAvatar.svelte';
	import { nostr } from '$lib/stores/signerStore.svelte';
	import { EventBuilder, Tag } from '@rust-nostr/nostr-sdk';

	let {
		onPost
	}: {
		onPost: () => void;
	} = $props();

	let content = $state('');
	let textareaElement: HTMLTextAreaElement;

	const handleInput = () => {
		if (!textareaElement) return;
		textareaElement.style.height = 'auto';
		textareaElement.style.height = `${textareaElement.scrollHeight}px`;
	};

	$effect(() => {
		if (content || !content) {
			queueMicrotask(handleInput);
		}
	});

	async function createPost() {
		const animestrHashtag = Tag.hashtag('animestr');
		const newPost = await EventBuilder.textNote(content)
			.tags([animestrHashtag])
			.sign(nostr.signer!);
		await nostr.client!.sendEvent(newPost);
		content = '';
		onPost();
	}
</script>

<div class="card bg-base-200/50 border-base-300 mb-6 border shadow-sm">
	<div class="card-body p-4">
		<div class="flex gap-4">
			<UserAvatar pubkey={nostr.pubkey!} />

			<div class="flex-1">
				<textarea
					bind:this={textareaElement}
					class="textarea textarea-ghost w-full resize-none overflow-hidden bg-transparent p-2 text-base transition-all duration-200 focus:border-transparent focus:ring-0 focus:outline-none"
					placeholder="What's on your mind?"
					bind:value={content}
					oninput={handleInput}
					rows="1"
				></textarea>
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
