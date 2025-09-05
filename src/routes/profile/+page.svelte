<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import { nostr } from '$lib/stores/signerStore.svelte';
	import Fieldset from '$lib/components/Fieldset.svelte';
	import UserAvatarDisplay from '$lib/components/UserAvatarDisplay.svelte';
	import { createEvent, profileLoader } from '$lib';
	import { getProfileContent, isValidNip05, showToast } from '$lib/utils.svelte';
	import { map } from 'rxjs';
	import { updateCreatedAt } from 'applesauce-factory/operations/event';
	import RenderNip05Check from '$lib/components/RenderNip05Check.svelte';

	onMount(() => {
		if (!nostr?.activeUser) return goto('/');
		profileLoader(nostr.activeUser)
			.pipe(map(getProfileContent))
			.subscribe((profile) => {
				form.name = profile.display_name || profile.displayName || profile.name || '';
				form.about = profile.about || '';
				form.picture = profile.picture || '';
				form.banner = profile.banner || '';
				form.nip05s = profile.nip05;
				for (let i = 0; i < profile.nip05.length; i++)
					debouncedNip05Validation(profile.nip05[i], i);
				form.lud16 = profile.lud16;
				form.customFields = Object.entries(profile)
					.filter(
						([key]) =>
							![
								'name',
								'display_name',
								'displayName',
								'about',
								'picture',
								'banner',
								'nip05',
								'lud16',
								'client'
							].includes(key)
					)
					.map((i) => ({
						key: i[0],
						value: i[1] as string
					}));
			});
	});

	let form = $state({
		name: '',
		about: '',
		picture: '',
		banner: '',
		nip05s: [''],
		lud16: [''],
		customFields: [{ key: '', value: '' }]
	});

	let saving = $state(false);
	let errors: Record<string, string> = $state({});
	let touched: Record<string, boolean> = $state({});
	let validatingNip05: Record<string, boolean> = $state({});
	let nip05ValidationResults: Record<string, boolean | null> = $state({});

	let debounceTimers: Record<string, NodeJS.Timeout> = {};

	function debounce<T extends (...args: any[]) => any>(
		func: T,
		delay: number,
		key: string
	): (...args: Parameters<T>) => void {
		return (...args: Parameters<T>) => {
			if (debounceTimers[key]) {
				clearTimeout(debounceTimers[key]);
			}
			debounceTimers[key] = setTimeout(() => func(...args), delay);
		};
	}

	async function validateNip05Async(nip05: string, pubkey: string): Promise<boolean> {
		try {
			return await isValidNip05(pubkey)(nip05);
		} catch (error) {
			console.error('NIP-05 validation error:', error);
			return false;
		}
	}

	const debouncedNip05Validation = debounce(
		async (nip05: string, index: number) => {
			if (!nip05 || !isValidEmail(nip05)) {
				validatingNip05[`nip05-${index}`] = false;
				nip05ValidationResults[`nip05-${index}`] = null;
				return;
			}

			validatingNip05[`nip05-${index}`] = true;

			try {
				const isValid = await validateNip05Async(nip05, nostr.activeUser!);
				nip05ValidationResults[`nip05-${index}`] = isValid;

				if (!isValid) {
					errors[`nip05-${index}`] = 'NIP-05 validation failed';
				} else {
					const newErrors = { ...errors };
					delete newErrors[`nip05-${index}`];
					errors = newErrors;
				}
			} catch (error) {
				nip05ValidationResults[`nip05-${index}`] = false;
				errors[`nip05-${index}`] = 'NIP-05 validation error';
			} finally {
				validatingNip05[`nip05-${index}`] = false;
			}
		},
		500,
		'nip05'
	);

	function validateField(field: string, value: any, index?: number): string {
		switch (field) {
			case 'name':
				if (!value?.trim()) return 'Display name is required';
				if (value.length > 50) return 'Display name must be 50 characters or less';
				return '';
			case 'about':
				if (value?.length > 500) return 'Bio must be 500 characters or less';
				return '';
			case 'picture':
			case 'banner':
				if (value && !isValidUrl(value)) return 'Please enter a valid URL';
				return '';
			case 'nip05':
				if (!value) return '';
				if (!isValidEmail(value)) return 'Please enter a valid nip05 format';
				return '';
			case 'lightning':
				if (value && !isValidLightningAddress(value))
					return 'Please enter a valid Lightning address';
				return '';
			default:
				return '';
		}
	}

	function isValidUrl(url: string): boolean {
		try {
			new URL(url);
			return true;
		} catch {
			return false;
		}
	}

	function isValidEmail(email: string): boolean {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	}

	function isValidLightningAddress(address: string): boolean {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) || address.startsWith('lnurl');
	}

	function handleFieldBlur(field: string, value: any, index?: number) {
		const fieldKey = index !== undefined ? `${field}-${index}` : field;
		touched[fieldKey] = true;
		errors[fieldKey] = validateField(field, value, index);
	}

	function handleNip05Input(value: string, index: number) {
		const fieldKey = `nip05-${index}`;

		nip05ValidationResults[fieldKey] = null;

		errors[fieldKey] = validateField('nip05', value, index);

		if (value && isValidEmail(value)) debouncedNip05Validation(value, index);
	}

	function addNIP05() {
		form.nip05s = [...form.nip05s, ''];
	}

	function removeNIP05(index: number) {
		const fieldKey = `nip05-${index}`;
		delete validatingNip05[fieldKey];
		delete nip05ValidationResults[fieldKey];
		delete errors[fieldKey];
		delete touched[fieldKey];

		form.nip05s = form.nip05s.filter((_, i) => i !== index);
	}

	function addLightningAddress() {
		form.lud16 = [...form.lud16, ''];
	}

	function removeLightningAddress(index: number) {
		form.lud16 = form.lud16.filter((_, i) => i !== index);
	}

	function addCustomField() {
		form.customFields = [...form.customFields, { key: '', value: '' }];
	}

	function removeCustomField(index: number) {
		form.customFields = form.customFields.filter((_, i) => i !== index);
	}

	async function handleSave() {
		saving = true;

		const allErrors: Record<string, string> = {};
		allErrors.name = validateField('name', form.name);
		allErrors.about = validateField('about', form.about);
		allErrors.picture = validateField('picture', form.picture);
		allErrors.banner = validateField('banner', form.banner);

		for (let i = 0; i < form.nip05s.length; i++) {
			const nip05 = form.nip05s[i];
			const fieldKey = `nip05-${i}`;

			if (nip05) {
				allErrors[fieldKey] = validateField('nip05', nip05, i);

				if (validatingNip05[fieldKey])
					while (validatingNip05[fieldKey])
						await new Promise((resolve) => setTimeout(resolve, 100));

				if (nip05ValidationResults[fieldKey] === false)
					allErrors[fieldKey] = 'NIP-05 validation failed';
			}
		}

		form.lud16.forEach((addr, i) => {
			if (addr) allErrors[`lightning-${i}`] = validateField('lightning', addr);
		});

		errors = allErrors;
		const hasErrors = Object.values(allErrors).some(Boolean);

		if (hasErrors) {
			saving = false;
			showToast(`Failed to save profile.\n${Object.values(allErrors).join('\n')}`, 'error');
			return;
		}

		const putAnimestrFirst = (a: string, b: string) => {
			const aIsAnimestr = a.endsWith('@animestr.xyz');
			const bIsAnimestr = b.endsWith('@animestr.xyz');
			if ((aIsAnimestr && bIsAnimestr) || (!aIsAnimestr && !bIsAnimestr))
				return a.length - b.length;
			if (aIsAnimestr) return -1;
			if (bIsAnimestr) return 1;
			return 0;
		};

		const sortedNip05s = form.nip05s.sort(putAnimestrFirst);
		const sortedLud16s = form.lud16.sort(putAnimestrFirst);

		let oldContent = {
			displayName: form.name,
			display_name: form.name,
			name: form.name,
			about: form.about,
			picture: form.picture,
			banner: form.banner,
			nip05: sortedNip05s[0],
			lud16: sortedLud16s[0]
		};

		let tags = Object.entries(oldContent).filter(([key]) => key !== 'nip05' && key !== 'lud16');
		for (let nip05 of sortedNip05s) tags.push(['nip05', nip05]);
		for (let lud16 of sortedLud16s) tags.push(['lud16', lud16]);

		try {
			await createEvent(
				{
					kind: 0,
					content: JSON.stringify(oldContent),
					tags
				},
				updateCreatedAt()
			);

			showToast('Profile saved successfully!');
		} catch (error) {
			showToast('Failed to save profile', 'error');
		} finally {
			saving = false;
		}
	}

	const previewName = $derived(form.name?.trim() || 'Your display name');
	const previewAbout = $derived(
		form.about?.trim() ||
			'Tell the world who you are. Share your interests, projects, or anything that defines you.'
	);
	const hasBanner = $derived(!!form.banner?.trim());
	const hasAvatar = $derived(!!form.picture?.trim());

	const validLightningAddresses = $derived(form.lud16.filter(Boolean));
	const validCustomFields = $derived(form.customFields.filter((f) => f.key && f.value));
	const characterCount = $derived(form.about?.length || 0);

	const isFormValid = $derived(() => {
		const hasBasicErrors = Object.values(errors).some(Boolean);
		const hasValidationInProgress = Object.values(validatingNip05).some(Boolean);
		const hasValidName = !!form.name?.trim();

		return !hasBasicErrors && !hasValidationInProgress && hasValidName;
	});

	onDestroy(() => {
		Object.values(debounceTimers).forEach((timer) => clearTimeout(timer));
	});
</script>

<div class="bg-base-200 min-h-screen">
	<main class="container mx-auto max-w-7xl px-4 py-6 lg:py-8">
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
			<div class="space-y-6 lg:col-span-7 xl:col-span-8">
				<form onsubmit={handleSave} novalidate>
					<div class="card bg-base-100 border-base-300 border shadow-lg">
						<legend class="sr-only">Basic Information</legend>
						<div class="card-body">
							<div class="mb-4 flex items-center justify-between">
								<div class="flex items-center gap-3">
									<div class="bg-primary/10 rounded-lg p-2">
										<Icon icon="mdi:account-circle" width="24" height="24" class="text-primary" />
									</div>
									<div>
										<h2 class="text-xl font-semibold">Basic Information</h2>
										<p class="text-base-content/70 text-sm">Your public identity details</p>
									</div>
								</div>
								<div
									class="tooltip tooltip-left"
									data-tip="This information is visible to everyone"
								>
									<Icon
										icon="mdi:information-outline"
										width="20"
										height="20"
										class="text-base-content/60"
									/>
								</div>
							</div>

							<Fieldset title="Display Name" error={errors.name}>
								<input
									id="display-name"
									type="text"
									class="input input-bordered w-full"
									class:input-error={errors.name}
									class:input-success={touched.name && !errors.name && form.name}
									placeholder="e.g. Satoshi Nakamoto"
									bind:value={form.name}
									onblur={() => handleFieldBlur('name', form.name)}
									maxlength="50"
									required
									aria-describedby="name-help"
								/>
								<span class="label">
									<span class="label-text-alt">This is how others will see you</span>
									<span class="label-text-alt">{form.name?.length || 0}/50</span>
								</span>
							</Fieldset>

							<Fieldset title="Avatar URL" error={errors.picture}>
								<input
									id="avatar-url"
									type="url"
									class="input input-bordered w-full"
									class:input-error={errors.picture}
									class:input-success={touched.picture && !errors.picture && form.picture}
									placeholder="https://example.com/avatar.jpg"
									bind:value={form.picture}
									onblur={() => handleFieldBlur('picture', form.picture)}
									aria-describedby="avatar-help"
								/>
								<span class="label" id="avatar-help">
									<span class="label-text-alt">
										Square images work best (400×400px recommended)
									</span>
								</span>
							</Fieldset>

							<Fieldset title="Banner URL" error={errors.banner}>
								<input
									id="banner-url"
									type="url"
									class="input input-bordered w-full"
									class:input-error={errors.banner}
									class:input-success={touched.banner && !errors.banner && form.banner}
									placeholder="https://example.com/banner.jpg"
									bind:value={form.banner}
									onblur={() => handleFieldBlur('banner', form.banner)}
									aria-describedby="banner-help"
								/>
								<span class="label" id="avatar-help">
									<span class="label-text-alt">
										Wide images work best (1366×768px recommended)
									</span>
								</span>
							</Fieldset>

							<Fieldset title="Bio" error={errors.about}>
								<textarea
									id="bio"
									class="textarea textarea-bordered min-h-[120px] w-full"
									class:textarea-error={errors.about}
									class:textarea-success={touched.about && !errors.about && form.about}
									placeholder="Tell the world about yourself, your interests, projects, or anything that defines you..."
									bind:value={form.about}
									onblur={() => handleFieldBlur('about', form.about)}
									maxlength="500"
									aria-describedby="bio-help"
								></textarea>
								<span class="label" id="avatar-help">
									<span class="label-text-alt">
										You can include links and they may be auto-linked by clients
									</span>
									<span class="label-text-alt" class:text-warning={characterCount > 450}>
										{characterCount}/500
									</span>
								</span>
							</Fieldset>
						</div>
					</div>

					<div class="card bg-base-100 border-base-300 border shadow-lg">
						<legend class="sr-only">Verification and Payment Information</legend>
						<div class="card-body">
							<div class="mb-4 flex items-center justify-between">
								<div class="flex items-center gap-3">
									<div class="bg-success/10 rounded-lg p-2">
										<Icon icon="mdi:shield-check" width="24" height="24" class="text-success" />
									</div>
									<div>
										<h2 class="text-xl font-semibold">Verification & Payments</h2>
										<p class="text-base-content/70 text-sm">Verify your identity and enable tips</p>
									</div>
								</div>
								<div
									class="tooltip tooltip-left"
									data-tip="NIP-05 for verification, Lightning for receiving tips"
								>
									<Icon
										icon="mdi:information-outline"
										width="20"
										height="20"
										class="text-base-content/60"
									/>
								</div>
							</div>

							<Fieldset title="Verified Usernames (NIP-05)">
								{#each form.nip05s as nip05, index (index)}
									<div class="form-control">
										<div class="flex items-center gap-2">
											<div class="relative flex-1">
												<input
													type="text"
													inputmode="email"
													class="input input-bordered w-full"
													class:input-error={errors[`nip05-${index}`]}
													class:input-success={!errors[`nip05-${index}`] && nip05}
													placeholder="name@yourdomain.com"
													bind:value={form.nip05s[index]}
													onkeyup={() => handleNip05Input(nip05, index)}
													onblur={() => handleFieldBlur('nip05', nip05, index)}
													aria-label="NIP-05 address {index + 1}"
												/>
												{#if !errors[`nip05-${index}`] && nip05}
													<Icon
														icon="mdi:check-circle"
														width="18"
														height="18"
														class="text-success absolute top-1/2 right-3 -translate-y-1/2"
													/>
												{/if}
											</div>
											{#if form.nip05s.length > 1}
												<button
													type="button"
													class="btn btn-ghost btn-square btn-sm"
													aria-label="Remove NIP-05 address"
													onclick={() => removeNIP05(index)}
												>
													<Icon icon="mdi:close" width="18" height="18" />
												</button>
											{/if}
										</div>
										{#if errors[`nip05-${index}`]}
											<label class="label">
												<span class="label-text-alt text-error">{errors[`nip05-${index}`]}</span>
											</label>
										{/if}
									</div>
								{/each}

								<button type="button" class="btn btn-outline btn-sm gap-2" onclick={addNIP05}>
									<Icon icon="mdi:plus" width="16" height="16" />
									Add Verified Username
								</button>

								<div class="alert alert-info">
									<Icon icon="mdi:information" width="20" height="20" />
									<div class="text-sm">
										<strong>What is a verified username?</strong><br />
										A Verified Username is your easy-to-remember identity on Nostr that looks like an
										email address (e.g., rozemyne@yurgenschmidt.kingdom). It serves as your human-readable
										name that others can use to find and verify it's really you.
									</div>
								</div>
							</Fieldset>

							<Fieldset title="Lightning Addresses" icon="mdi:lightning-bolt">
								{#each form.lud16 as address, index (index)}
									<div class="form-control">
										<div class="flex items-center gap-2">
											<div class="relative flex-1">
												<Icon
													icon="mdi:lightning-bolt-outline"
													width="18"
													height="18"
													class="text-warning absolute top-1/2 left-3 -translate-y-1/2"
												/>
												<input
													type="text"
													inputmode="email"
													class="input input-bordered w-full"
													class:input-error={errors[`lightning-${index}`]}
													class:input-success={!errors[`lightning-${index}`] && address}
													placeholder="you@getalby.com"
													bind:value={form.lud16[index]}
													onblur={() => handleFieldBlur(`lightning-${index}`, address)}
													aria-label="Lightning address {index + 1}"
												/>
												{#if !errors[`lightning-${index}`] && address}
													<Icon
														icon="mdi:check-circle"
														width="18"
														height="18"
														class="text-success absolute top-1/2 right-3 -translate-y-1/2"
													/>
												{/if}
											</div>
											{#if form.lud16.length > 1}
												<button
													type="button"
													class="btn btn-ghost btn-square btn-sm"
													aria-label="Remove Lightning address"
													onclick={() => removeLightningAddress(index)}
												>
													<Icon icon="mdi:close" width="18" height="18" />
												</button>
											{/if}
										</div>
										{#if errors[`lightning-${index}`]}
											<label class="label">
												<span class="label-text-alt text-error">{errors[`lightning-${index}`]}</span
												>
											</label>
										{/if}
									</div>
								{/each}

								<button
									type="button"
									class="btn btn-outline btn-sm gap-2"
									onclick={addLightningAddress}
								>
									<Icon icon="mdi:plus" width="16" height="16" />
									Add Lightning Address
								</button>

								<div class="alert alert-warning">
									<Icon icon="mdi:lightning-bolt" width="20" height="20" />
									<div class="text-sm">
										<strong>Enable Tips</strong><br />
										Lightning addresses let people send you Bitcoin tips instantly.
									</div>
								</div>
							</Fieldset>
						</div>
					</div>

					<Fieldset title="Custom Fields">
						<div class="flex items-center gap-3">
							<div class="bg-accent/10 rounded-lg p-2">
								<Icon icon="mdi:code-braces" width="24" height="24" class="text-accent" />
							</div>
							<div>
								<h2 class="text-xl font-semibold">Custom Fields</h2>
								<p class="text-base-content/70 text-sm">Add any additional key-value pairs</p>
							</div>
						</div>
						{#each form.customFields as _, index (index)}
							<div class="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-start">
								<div class="md:col-span-5">
									<input
										type="text"
										class="input input-bordered w-full"
										placeholder="Key (e.g., website, github)"
										bind:value={form.customFields[index].key}
										aria-label="Custom field key {index + 1}"
									/>
								</div>
								<div class="md:col-span-6">
									<input
										type="text"
										class="input input-bordered w-full"
										placeholder="Value (e.g., https://example.com)"
										bind:value={form.customFields[index].value}
										aria-label="Custom field value {index + 1}"
									/>
								</div>
								<div class="flex justify-end md:col-span-1 md:justify-center">
									{#if form.customFields.length > 1}
										<button
											type="button"
											class="btn btn-ghost btn-square btn-sm"
											aria-label="Remove custom field"
											onclick={() => removeCustomField(index)}
										>
											<Icon icon="mdi:delete-outline" width="18" height="18" />
										</button>
									{/if}
								</div>
							</div>
						{/each}

						<button type="button" class="btn btn-outline btn-sm gap-2" onclick={addCustomField}>
							<Icon icon="mdi:plus" width="16" height="16" />
							Add Custom Field
						</button>
					</Fieldset>

					<div class="card-body"></div>

					<div class="card bg-base-100 border-base-300 border shadow-lg lg:hidden">
						<div class="card-body">
							<div class="flex flex-col gap-3 sm:flex-row">
								<button
									type="submit"
									class="btn btn-primary flex-1 {saving ? 'loading' : ''}"
									disabled={saving || !isFormValid}
								>
									{#if !saving}
										<Icon icon="mdi:content-save-outline" width="20" height="20" class="mr-2" />
									{/if}
									{saving ? 'Saving...' : 'Save Profile'}
								</button>
							</div>
						</div>
					</div>
				</form>
			</div>

			<div class="lg:col-span-5 xl:col-span-4">
				<div class="space-y-4 lg:sticky lg:top-6">
					<div class="card bg-base-100 border-base-300 overflow-hidden border shadow-xl">
						<div
							class="from-primary/20 via-secondary/20 to-accent/10 relative h-40 bg-gradient-to-br"
						>
							{#if hasBanner}
								<img
									src={form.banner}
									alt="Profile banner"
									class="h-full w-full object-cover transition-opacity duration-300"
								/>
							{:else}
								<div class="flex h-full w-full items-center justify-center">
									<Icon
										icon="mdi:image-outline"
										width="48"
										height="48"
										class="text-base-content/30"
									/>
								</div>
							{/if}
							<div
								class="from-base-100/60 absolute inset-0 bg-gradient-to-t via-transparent to-transparent"
							></div>
						</div>

						<div class="-mt-16 px-6">
							{#if hasAvatar}
								<UserAvatarDisplay url={form.picture} pubkey={nostr.activeUser!} size={100} />
							{:else}
								<div class="text-base-content/40 grid h-full w-full place-content-center">
									<Icon icon="mdi:account" width="48" height="48" />
								</div>
							{/if}
						</div>

						<div class="card-body pt-4">
							<div class="space-y-2">
								<h3 class="text-2xl font-bold">{previewName}</h3>

								{#if form.nip05s.length > 0}
									{#each form.nip05s as nip05}
										{#key nip05}
											<RenderNip05Check {nip05} pubkey={nostr.activeUser!} />
										{/key}
									{/each}
								{/if}
							</div>

							{#if form.about}
								<p class="text-base-content/80 mt-4 leading-relaxed whitespace-pre-line">
									{previewAbout}
								</p>
							{/if}

							{#if validLightningAddresses.length > 0}
								<div class="mt-4 space-y-2">
									<div class="text-base-content/70 text-sm font-medium">Lightning Addresses</div>
									<div class="flex flex-wrap gap-2">
										{#each validLightningAddresses as address}
											<div class="badge badge-warning badge-outline gap-1">
												<Icon icon="mdi:lightning-bolt-outline" width="14" height="14" />
												{address}
											</div>
										{/each}
									</div>
								</div>

								{#if validCustomFields.length > 0}
									<div class="mt-4">
										<div class="mb-2 text-sm font-medium">Custom Fields:</div>
										<div class="flex flex-wrap gap-2">
											{#each validCustomFields as field}
												<div class="badge badge-outline gap-1">
													<Icon icon="mdi:tag-outline" width="14" height="14" />
													{field.key}: {field.value}
												</div>
											{/each}
										</div>
									</div>
								{/if}
							{/if}

							<div class="card-actions border-base-300 mt-6 justify-end border-t pt-4">
								<div class="hidden w-full gap-2 lg:flex">
									<button
										type="button"
										class="btn btn-primary flex-1"
										class:loading={saving}
										disabled={saving || !isFormValid}
										onclick={handleSave}
									>
										{#if !saving}
											<Icon icon="mdi:content-save-outline" width="20" height="20" class="mr-2" />
										{/if}
										{saving ? 'Saving...' : 'Save Profile'}
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</main>
</div>
