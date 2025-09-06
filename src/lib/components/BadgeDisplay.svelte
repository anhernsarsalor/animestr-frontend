<script lang="ts">
	import { profileLoader, type BadgeInfo } from '$lib';
	import { getDisplayName, type ProfileContent } from 'applesauce-core/helpers';
	import { getProfileContent } from '$lib/utils.svelte';
	import UserInfo from './UserInfo.svelte';
	import Dialog from './Dialog.svelte';

	let {
		badges
	}: {
		badges: BadgeInfo[];
	} = $props();

	let selectedBadge = $state<BadgeInfo | null>(null);
	let showModal = $state(false);

	function openBadgeModal(badge: BadgeInfo) {
		selectedBadge = badge;
		showModal = true;
	}

	let authorProfileStore = $derived(selectedBadge ? profileLoader(selectedBadge.author) : null);
	let authorProfile = $derived(authorProfileStore ? $authorProfileStore : undefined);
</script>

{#if badges.length > 0}
	<div class="mb-6">
		<div class="flex flex-wrap gap-2">
			{#each badges as badge}
				<button
					class="badge-item group relative overflow-hidden rounded-xl p-3 transition-all duration-300 hover:scale-105"
					onclick={() => openBadgeModal(badge)}
				>
					{#if badge.image}
						<img
							src={badge.image}
							alt={badge.name}
							class="h-12 w-12 rounded-lg object-cover transition-transform group-hover:scale-110"
							loading="lazy"
						/>
					{:else}
						<div
							class="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg text-xl"
						>
							🏆
						</div>
					{/if}
				</button>
			{/each}
		</div>
	</div>
{/if}

{#if showModal && selectedBadge}
	<Dialog bind:open={showModal}>
		<div class="mb-6 flex justify-center">
			{#if selectedBadge.image}
				<img
					src={selectedBadge.image}
					alt={selectedBadge.name}
					class="h-24 w-24 rounded-2xl shadow-lg"
				/>
			{:else}
				<div
					class="bg-primary/20 flex h-24 w-24 items-center justify-center rounded-2xl text-4xl shadow-lg"
				>
					🏆
				</div>
			{/if}
		</div>
		<h3 class="text-primary mb-3 text-center text-xl font-bold">
			{selectedBadge.name}
		</h3>
		<div class="bg-base-200/50 mb-6 rounded-lg p-4">
			<p class="text-base-content/80 text-sm leading-relaxed">
				{selectedBadge.description}
			</p>
		</div>
		<div class="border-base-300 border-t pt-4">
			<p class="text-base-content/60 mb-3 text-sm font-medium">Awarded by:</p>
			<UserInfo user={selectedBadge.author} />
		</div>
		<div class="mt-4 text-center">
			<p class="text-base-content/40 text-xs">
				Awarded {selectedBadge.awarded.toLocaleDateString()}
			</p>
		</div>
	</Dialog>
{/if}

<style>
	.badge-item {
		position: relative;
		cursor: pointer;
		min-width: 72px;
		min-height: 72px;
	}
</style>
