<script>
	import Icon from '@iconify/svelte';
</script>

<div class="navbar-start">
	<div class="dropdown">
		<div tabindex="0" role="button" class="btn btn-ghost btn-circle">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 6h16M4 12h16M4 18h7"
				/>
			</svg>
		</div>
		<ul class="menu bg-base-300 rounded-box dropdown-content z-1 mt-3 w-56 p-2 shadow">
			<li>
				<a href="/">
					<Icon icon="line-md:home-simple-twotone" />
					Home
				</a>
				<a href="/emoji-packs">
					<Icon icon="ph:package-duotone" />
					Emoji Packs
				</a>
			</li>
		</ul>
	</div>
</div>
