<script lang="ts">
	import UserInfo from '$lib/components/UserInfo.svelte';
	import { nip19 } from 'nostr-tools';
	import NostrEventReference from './NostrEventReference.svelte';

	let {
		json = '',
		title = 'JSON Pretty Printer',
		copyable = true
	}: {
		json: any;
		title: string;
		collapsible: boolean;
		copyable: boolean;
	} = $props();

	let jsonInput = $state(typeof json === 'string' ? json : JSON.stringify(json, null, 2));
	let copied = $state(false);

	let parsedJson = $derived(JSON.parse(jsonInput));
	let prettyJson = $derived(parsedJson === null ? '' : JSON.stringify(parsedJson, null, 2));

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(prettyJson);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}

	function formatValue(value: any, depth = 0): string {
		if (value === null) return 'null';
		if (value === undefined) return 'undefined';
		if (typeof value === 'boolean') return value.toString();
		if (typeof value === 'number') return value.toString();
		if (typeof value === 'string') return value;
		if (Array.isArray(value)) {
			if (value.length === 0) return '[]';
			return `[${value.length} items]`;
		}
		if (typeof value === 'object') {
			const keys = Object.keys(value);
			return `{${keys.length} properties}`;
		}
		return String(value);
	}

	function getValueType(value: any): string {
		if (value === null) return 'null';
		if (Array.isArray(value)) return 'array';
		return typeof value;
	}

	function isExpandable(value: any): boolean {
		return (
			(Array.isArray(value) && value.length > 0) ||
			(typeof value === 'object' && value !== null && Object.keys(value).length > 0)
		);
	}

	function formatTimestamp(timestamp: number): string {
		return new Date(timestamp * 1000).toISOString();
	}

	function isNostrTimestamp(key: string): boolean {
		return key === 'created_at' || key.includes('_at');
	}

	function getTagTypeColor(tagType: string): string {
		const colors: Record<string, string> = {
			p: 'badge-primary',
			e: 'badge-secondary',
			t: 'badge-accent',
			r: 'badge-info',
			a: 'badge-success',
			g: 'badge-warning',
			d: 'badge-error'
		};
		return colors[tagType] || 'badge-neutral';
	}

	function getTagTypeLabel(tagType: string): string {
		const labels: Record<string, string> = {
			p: '👤 Pubkey',
			e: '📝 Event',
			t: '🏷️ Topic',
			r: '🔗 Relay',
			a: '📍 Address',
			g: '👥 Group',
			d: '🆔 Identifier'
		};
		return labels[tagType] || `#${tagType}`;
	}
</script>

<div class="card bg-base-100 shadow-lg">
	<div class="card-header">
		<div class="flex items-center justify-between border-b p-4">
			<h3 class="text-lg font-semibold">{title}</h3>
			<div class="flex gap-2">
				{#if copyable && prettyJson}
					<button class="btn btn-sm btn-ghost" onclick={copyToClipboard} title="Copy to clipboard">
						{#if copied}
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								/>
							</svg>
							Copied!
						{:else}
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
								/>
							</svg>
							Copy
						{/if}
					</button>
				{/if}
			</div>
		</div>
	</div>

	<div class="card-body p-0">
		{#if parsedJson && typeof parsedJson === 'object'}
			<div class="overflow-x-auto">
				<table class="table-zebra table w-full">
					<thead>
						<tr class="bg-base-200">
							<th class="font-semibold">Property</th>
							<th class="font-semibold">Value</th>
							<th class="w-20 font-semibold">Type</th>
						</tr>
					</thead>
					<tbody>
						{#each Object.entries(parsedJson) as [key, value]}
							<tr class="hover">
								<td class="text-primary font-mono text-sm font-medium">
									{key}
								</td>
								<td class="max-w-md min-w-0">
									{#if key === 'tags' && Array.isArray(value)}
										<div class="space-y-3">
											{#each value as tag, index}
												{#if Array.isArray(tag) && tag.length > 0}
													<div class="card card-compact bg-base-200 border">
														<div class="card-body">
															<div class="mb-2 flex items-center gap-2">
																<span class="badge {getTagTypeColor(tag[0])}"
																	>{getTagTypeLabel(tag[0])}</span
																>
																<span class="text-xs opacity-60">#{index}</span>
															</div>

															{#if tag[0] === 'p' && tag[1]}
																<div class="bg-base-100 rounded-lg p-3">
																	<UserInfo user={tag[1]} />
																	{#if tag[2]}
																		<div class="mt-2 text-xs opacity-60">
																			<span class="font-medium">Relay:</span>
																			<span class="font-mono">{tag[2]}</span>
																		</div>
																	{/if}
																	{#if tag[3]}
																		<div class="mt-1 text-xs opacity-60">
																			<span class="font-medium">Petname:</span>
																			{tag[3]}
																		</div>
																	{/if}
																</div>
															{:else if tag[0] === 'e' && tag[1]}
																<div class="bg-base-100 rounded-lg p-3">
																	<a href="/event/{tag[1]}">
																		{nip19.noteEncode(tag[1])}
																	</a>
																	<NostrEventReference eventId={tag[1]} />
																	{#if tag[2]}
																		<div class="mt-2 text-xs opacity-60">
																			<span class="font-medium">Relay:</span>
																			<span class="font-mono">{tag[2]}</span>
																		</div>
																	{/if}
																</div>
															{:else}
																<div class="space-y-2">
																	{#each tag.slice(1) as tagValue, tagIndex}
																		<div class="flex items-start gap-2">
																			<span class="badge badge-outline badge-xs mt-1"
																				>{tagIndex + 1}</span
																			>
																			<div class="flex-1">
																				{#if typeof tagValue === 'string' && tagValue.length > 80}
																					{#if isNostrTimestamp(tag[0])}
																						<div class="text-xs opacity-60">
																							📅 {formatTimestamp(Number.parseInt(tagValue))}
																						</div>
																					{:else}
																						<details class="bg-base-100 collapse">
																							<summary
																								class="collapse-title min-h-0 cursor-pointer p-2 text-sm"
																							>
																								<span class="font-mono text-xs opacity-80">
																									{tagValue.substring(0, 80)}...
																								</span>
																							</summary>
																							<div class="collapse-content px-2 pb-2">
																								<div
																									class="bg-base-300 max-h-24 overflow-y-auto rounded p-2"
																								>
																									<pre
																										class="font-mono text-xs break-all whitespace-pre-wrap">{tagValue}</pre>
																								</div>
																							</div>
																						</details>
																					{/if}
																				{:else}
																					<span class="font-mono text-sm break-all">{tagValue}</span
																					>
																					{#if isNostrTimestamp(tag[0])}
																						<div class="text-xs opacity-60">
																							📅 {formatTimestamp(tagValue)}
																						</div>
																					{/if}
																				{/if}
																			</div>
																		</div>
																	{/each}
																</div>
															{/if}
														</div>
													</div>
												{:else}
													<div class="alert alert-warning alert-sm">
														<span>Invalid tag format at index {index}</span>
													</div>
												{/if}
											{/each}
										</div>
									{:else if isExpandable(value)}
										<details class="collapse-arrow bg-base-100 collapse border">
											<summary class="collapse-title min-h-0 py-2">
												<span class="text-sm opacity-70">
													{formatValue(value)}
												</span>
											</summary>
											<div class="collapse-content pt-0">
												{#if Array.isArray(value)}
													<div class="space-y-2">
														{#each value as item, index}
															<div class="flex items-start gap-2">
																<span class="badge badge-outline badge-sm">{index}</span>
																<div class="flex-1">
																	{#if typeof item === 'object' && item !== null}
																		<div class="bg-base-200 rounded p-2 text-sm">
																			<pre
																				class="font-mono text-xs whitespace-pre-wrap">{JSON.stringify(
																					item,
																					null,
																					2
																				)}</pre>
																		</div>
																	{:else}
																		<span class="font-mono text-sm">{String(item)}</span>
																	{/if}
																</div>
															</div>
														{/each}
													</div>
												{:else}
													<div class="bg-base-200 rounded p-2">
														<pre
															class="overflow-x-auto font-mono text-xs whitespace-pre-wrap">{JSON.stringify(
																value,
																null,
																2
															)}</pre>
													</div>
												{/if}
											</div>
										</details>
									{:else}
										<div class="space-y-1">
											<div class="font-mono text-sm break-all">
												{#if typeof value === 'string' && value.length > 100}
													<details class="collapse bg-transparent">
														<summary class="collapse-title min-h-0 cursor-pointer p-0 text-sm">
															<span class="block max-w-xs truncate">
																{value.substring(0, 100)}...
															</span>
															<span class="ml-2 text-xs opacity-50">Click to expand</span>
														</summary>
														<div class="collapse-content p-0 pt-2">
															<div class="bg-base-200 max-h-32 overflow-y-auto rounded p-2">
																<pre class="text-xs break-all whitespace-pre-wrap">{value}</pre>
															</div>
														</div>
													</details>
												{:else}
													<span class="break-all">{formatValue(value)}</span>
												{/if}
											</div>
											{#if isNostrTimestamp(key)}
												<div class="text-xs opacity-60">
													📅 {formatTimestamp(value)}
												</div>
											{/if}
										</div>
									{/if}
								</td>
								<td>
									<span class="badge badge-outline badge-sm font-mono">
										{getValueType(value)}
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="p-4">
				<div class="alert alert-warning">
					<svg class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 15c-.77.833.192 2.5 1.732 2.5z"
						/>
					</svg>
					<span>Invalid JSON or not an object</span>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	pre,
	.font-mono {
		font-family: 'Fira Code', 'SF Mono', 'Monaco', 'Consolas', monospace;
	}

	.table td {
		vertical-align: top;
	}

	.collapse-title {
		cursor: pointer;
	}

	.break-all {
		word-break: break-all;
		overflow-wrap: anywhere;
	}
</style>
