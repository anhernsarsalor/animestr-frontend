<script lang="ts">
	import { onMount } from 'svelte';
	import PostContent from './PostContent.svelte';
	import UserInfo from './UserInfo.svelte';
	import AnimeReference from './AnimeReference.svelte';
	import { Duration, Filter, Event, Kind, type EventId, Timestamp } from '@rust-nostr/nostr-sdk';
	import { nostr } from '$lib/stores/signerStore.svelte';

	let {
		eventId
	}: {
		eventId: EventId;
	} = $props();
	let event = $state<Event | undefined>(undefined);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let displayId = $state('');

	function formatDate(timestamp: number | Timestamp): string {
		if (typeof timestamp !== 'number') return formatDate(timestamp.asSecs());
		return new Date(timestamp * 1000).toLocaleString();
	}

	onMount(() => {
		displayId = eventId.toBech32();
		fetchEvent(eventId);
	});

	async function fetchEvent(id: EventId) {
		isLoading = true;
		error = null;

		const filter = new Filter().id(id).limit(1);
		const eventInStore = await nostr.db!.eventById(id);
		if (eventInStore) {
			event = eventInStore;
			isLoading = false;
			return;
		}
		const newEvent = await nostr
			.client!.fetchEvents(filter, Duration.fromSecs(20))!
			.then((e) => e.first());
		if (newEvent) {
			event = newEvent;
		} else {
			error = 'Event not found';
		}

		isLoading = false;
	}
</script>

{#if event && event.kind === new Kind(30010)}
	<AnimeReference {event} animeId="" source="" />
{:else}
	<div class="collapse-arrow bg-base-200 border-primary/20 collapse my-2 rounded-lg border">
		<input type="checkbox" checked />
		<div class="collapse-title text-primary flex items-center gap-2 py-2 text-sm font-medium">
			<span class="text-xs">🔗</span>
			Event: {displayId}...
		</div>
		<div class="collapse-content bg-base-100/50">
			{#if isLoading}
				<div class="flex justify-center py-4">
					<span class="loading loading-spinner loading-md text-primary"></span>
				</div>
			{:else if error}
				<div class="text-error py-2 text-sm">{error}</div>
			{:else if event}
				<div class="pt-2">
					<div class="mb-2">
						<UserInfo pubkey={event.author} />
					</div>
					<div class="mt-2">
						<PostContent content={event.content} emoji={{}} />
					</div>
				</div>
			{:else}
				<div class="text-error py-2 text-sm">Event not found</div>
			{/if}
		</div>
	</div>
{/if}
