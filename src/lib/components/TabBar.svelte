<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	const tabs = [
		{ href: '/map', label: 'map', icon: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2ZM9 4v14M15 6v14' },
		{ href: '/practice', label: 'practice', icon: 'M8 5v14l11-7L8 5Z' },
		{ href: '/log', label: 'log', icon: 'M5 6h14M5 12h14M5 18h9' },
		{
			href: '/me',
			label: 'me',
			icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21c0-4 3.6-6 8-6s8 2 8 6'
		}
	] as const;

	const active = (href: string) =>
		page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
</script>

<nav class="tabbar" aria-label="main">
	{#each tabs as tab (tab.href)}
		<a href={resolve(tab.href)} aria-current={active(tab.href) ? 'page' : undefined}>
			<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<path
					d={tab.icon}
					stroke="currentColor"
					stroke-width="1.6"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
			<span>{tab.label}</span>
		</a>
	{/each}
</nav>

<style>
	.tabbar {
		position: fixed;
		inset: auto 0 0 0;
		z-index: 20;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		height: calc(var(--tabbar-h) + var(--safe-bottom));
		padding: 0 var(--safe-right) var(--safe-bottom) var(--safe-left);
		box-sizing: border-box;
		background: var(--bg-cloud);
		border-top: 1px solid var(--line);
	}
	a {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.1rem;
		min-height: var(--tap);
		color: var(--text-dim);
		font-size: 0.75rem;
		text-decoration: none;
		letter-spacing: 0.06em;
	}
	a[aria-current='page'] {
		color: var(--accent);
	}
</style>
