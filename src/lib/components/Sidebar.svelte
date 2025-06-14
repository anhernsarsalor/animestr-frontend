<script lang="ts">
	const { events = [] } = $props();

	let eventId = $state('');
	let userId = $state('');

	function navigateToEvent() {
		if (eventId.trim()) {
			window.location.href = `/anime/${encodeURIComponent(eventId.trim())}`;
		}
	}

	function navigateToUser() {
		if (userId.trim()) {
			window.location.href = `/user/${encodeURIComponent(userId.trim())}`;
		}
	}
</script>

<div class="menu bg-base-200 text-base-content min-h-full w-80 p-4">
	<!-- Event lookup -->
	<div class="card bg-base-100 mb-6 shadow">
		<div class="card-body">
			<h2 class="card-title text-lg">Lookup anime</h2>
			<p class="text-sm opacity-70">
				Enter an anime id in the form of <code>anilist:1234</code> or <code>mal:1234</code>
			</p>

			<form on:submit|preventDefault={navigateToEvent} class="mt-4">
				<div class="form-control">
					<input
						type="text"
						bind:value={eventId}
						placeholder="Enter anime id (anilist:1234 or mal:1234)"
						class="input input-bordered w-full"
					/>
				</div>
				<button type="submit" class="btn btn-primary mt-4 w-full">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="mr-1 h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
					Lookup
				</button>
			</form>
		</div>
	</div>

	<!-- User lookup -->
	<div class="card bg-base-100 mb-6 shadow">
		<div class="card-body">
			<h2 class="card-title text-lg">Lookup user</h2>
			<p class="text-sm opacity-70">Enter a user's npub or hex public key</p>

			<form on:submit|preventDefault={navigateToUser} class="mt-4">
				<div class="form-control">
					<input
						type="text"
						bind:value={userId}
						placeholder="Enter npub or hex public key"
						class="input input-bordered w-full"
					/>
				</div>
				<button type="submit" class="btn btn-primary mt-4 w-full">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="mr-1 h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
						/>
					</svg>
					Find User
				</button>
			</form>
		</div>
	</div>
</div>
