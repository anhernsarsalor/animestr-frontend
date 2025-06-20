<script lang="ts">
	import PostContent from './PostContent.svelte';
	import UserInfo from './UserInfo.svelte';
	import AnimeReference from './AnimeReference.svelte';
	import { ndk } from '$lib/stores/signerStore.svelte';
	import { NDKSubscriptionCacheUsage, type NDKEventId } from '@nostr-dev-kit/ndk';
	import Loading from './Loading.svelte';

	let {
		eventId
	}: {
		eventId: NDKEventId;
	} = $props();

	let realEventId = $derived(ndk.getEntity(eventId)?.data.id);

	let event = $derived(
		ndk.$subscribe(
			[
				{
					ids: [realEventId]
				}
			],
			{
				closeOnEose: true,
				cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST
			}
		)?.[0]
	);

	let isLoading = $derived(!event);
</script>

{#if event && event.kind === 30010}
	<AnimeReference {event} animeId="" source="" />
{:else}
	<div class="collapse-arrow bg-base-200 border-primary/20 collapse my-2 rounded-lg border">
		<input type="checkbox" checked />
		<div class="collapse-title text-primary flex items-center gap-2 py-2 text-sm font-medium">
			<span class="text-xs">🔗</span>
			Event: {eventId}...
		</div>
		<div class="collapse-content bg-base-100/50">
			{#if isLoading}
				<div class="flex justify-center py-4">
					<Loading inline />
				</div>
			{:else if event}
				<div class="pt-2">
					<div class="mb-2">
						<UserInfo user={event.author} />
					</div>
					<div class="mt-2">
						<PostContent originalContent={event.content} content={event.content} emoji={{}} />
					</div>
				</div>
			{:else}
				<div class="text-error py-2 text-sm">Event not found</div>
			{/if}
		</div>
	</div>
{/if}
