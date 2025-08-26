<script lang="ts">
	import { getLastNotificationTime, notificationsLoader } from '$lib';
	import RenderMarkdown from '$lib/components/RenderMarkdown.svelte';
	import UserInfo from '$lib/components/UserInfo.svelte';
	import { nostr } from '$lib/stores/signerStore.svelte';
	import { truncateContent } from '$lib/text';
	import { type Event } from 'nostr-tools';
	import { from, startWith } from 'rxjs';

	let lastNotificationTime = $state(getLastNotificationTime());

	const notifications = $derived(
		nostr.activeUser ? notificationsLoader() : from([]).pipe(startWith([]))
	);

	$effect(() => {
		notifications.subscribe((n) => {
			if (n.length === 0) return;
			if (n[0].created_at > lastNotificationTime) {
				localStorage.setItem('notifications-last', (n[0].created_at + 1).toString());
				lastNotificationTime = n[0].created_at + 1;
			}
		});
	});

	function getNotificationType(event: Event) {
		switch (event.kind) {
			case 1:
			case 24:
				return {
					label: 'Mentioned you',
					icon: '💬',
					color: 'badge-primary',
					bgColor: 'bg-primary/10'
				};
			case 4:
				return {
					label: 'Sent an insecure DM',
					icon: '📧',
					color: 'badge-info',
					bgColor: 'bg-info/10'
				};
			case 7:
				let icon: string | [string, string] = event.content === '+' ? '❤️' : event.content;
				const emoji = event.tags.filter((t) => t[0] === 'emoji')[0];
				if (emoji) icon = [emoji[1], emoji[2]];
				return {
					label: 'Reacted',
					icon,
					color: 'badge-accent',
					bgColor: 'bg-accent/10'
				};
			case 1111:
				return {
					label: 'Commented',
					icon: '💭',
					color: 'badge-secondary',
					bgColor: 'bg-secondary/10'
				};
			default:
				return {
					label: 'Unknown action',
					icon: '❓',
					color: 'badge-ghost',
					bgColor: 'bg-base-200'
				};
		}
	}

	function formatTime(timestamp: number) {
		const now = Date.now() / 1000;
		const diff = now - timestamp;

		if (diff < 60) return 'just now';
		if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
		if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
		return `${Math.floor(diff / 86400)}d ago`;
	}
</script>

<div class="container mx-auto max-w-2xl p-4">
	<div class="mb-6 flex items-center gap-3">
		<div class="text-3xl">🔔</div>
		<h1 class="text-2xl font-bold">Notifications</h1>
		{#if $notifications.length > 0}
			<div class="badge badge-primary badge-sm">{$notifications.length}</div>
		{/if}
	</div>

	{#if $notifications.length === 0}
		<div class="card bg-base-100 shadow-sm">
			<div class="card-body py-16 text-center">
				<div class="mb-4 text-6xl opacity-30">🔕</div>
				<h3 class="text-base-content/60 text-lg font-semibold">No notifications yet</h3>
				<p class="text-base-content/50 text-sm">
					You'll see mentions, reactions, and comments here
				</p>
			</div>
		</div>
	{:else}
		<div class="space-y-3">
			{#each $notifications as mention (mention.id || mention.pubkey + mention.created_at)}
				{@const notifType = getNotificationType(mention)}
				<a
					href="/event/{mention.id}"
					class="card bg-base-300 border-base-200 border shadow-sm transition-shadow hover:shadow-md"
				>
					<div class="card-body p-4">
						<div class="flex items-start gap-3">
							<div class="flex-shrink-0">
								<div class="bg-neutral text-neutral-content h-10 w-10 rounded-full">
									<span class="absolute text-lg" style:transform="translate(40%, 25%)">
										{#if Array.isArray(notifType.icon)}
											<img src={notifType.icon[1]} class="w-[24px]" />
										{:else}
											{notifType.icon}
										{/if}
									</span>
								</div>
							</div>

							<div class="min-w-0 flex-grow">
								<div class="mb-2 flex items-center gap-2">
									<UserInfo user={mention.pubkey} />
									<div class="badge {notifType.color} badge-sm">{notifType.label}</div>
								</div>

								{#if mention.created_at}
									<div class="text-base-content/50 text-xs">
										{formatTime(mention.created_at)}
									</div>
								{/if}
							</div>
						</div>

						{#if mention.kind === 1 || mention.kind === 24}
							<div class="mt-3 rounded-lg p-3 {notifType.bgColor} border-base-300 border">
								<div class="flex items-start gap-2">
									<div class="text-primary mt-0.5">💬</div>
									<div class="flex-grow">
										<p class="text-sm leading-relaxed">
											<RenderMarkdown markdown={truncateContent(mention.content)} emoji={{}} />
										</p>
									</div>
								</div>
							</div>
						{:else if mention.kind === 1111}
							<div class="mt-3 rounded-lg p-3 {notifType.bgColor} border-base-300 border">
								<div class="flex items-start gap-2">
									<div class="text-secondary mt-0.5">💭</div>
									<div class="flex-grow">
										<p class="text-sm leading-relaxed">
											{truncateContent(mention.content)}
										</p>
									</div>
								</div>
							</div>
						{:else if mention.kind === 7}
							<div class="mt-3 rounded-lg p-3 {notifType.bgColor} border-base-300 border">
								<div class="flex items-center gap-2">
									<span class="text-base-content/70 text-sm">
										Reacted to your note with "
										{#if Array.isArray(notifType.icon)}
											<img src={notifType.icon[1]} class="inline w-[24px]" />
										{:else}
											{notifType.icon}
										{/if}
										"
									</span>
								</div>
							</div>
						{:else if mention.kind === 4}
							<div class="mt-3 rounded-lg p-3 {notifType.bgColor} border-base-300 border">
								<div class="flex items-center gap-2">
									<span class="text-base-content/70 text-sm">
										Sent an unsecure DM. Use another app to read this.
									</span>
								</div>
							</div>
						{:else}
							<div class="bg-base-200 border-base-300 mt-3 rounded-lg border p-3">
								<div class="flex items-center gap-2">
									<div class="text-base-content/50">❓</div>
									<span class="text-base-content/50 text-sm">
										Unknown action (kind {mention.kind})
									</span>
								</div>
							</div>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
