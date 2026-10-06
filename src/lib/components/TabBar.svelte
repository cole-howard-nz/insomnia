<script lang="ts">
	import Logo from './Logo.svelte';
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

<nav class="tabbar glass" aria-label="main">
	<a class="mark" href={resolve('/')} aria-label="insomnia home" tabindex="-1" aria-hidden="true"
		><Logo size={36} /><span>insomnia</span></a
	>
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
	/* Mobile: a dock of glass floating over the thumb zone, a small lamp lit over the open tab. */
	.tabbar {
		position: fixed;
		inset: auto 0.75rem calc(0.6rem + var(--safe-bottom)) 0.75rem;
		z-index: 20;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		height: var(--tabbar-h);
		box-sizing: border-box;
		max-width: 26rem;
		margin-inline: auto;
	}
	.mark {
		display: none;
	}
	a:not(.mark) {
		position: relative;
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
		transition: color 0.2s;
	}
	a[aria-current='page'] {
		color: var(--accent);
	}
	a[aria-current='page']::before {
		content: '';
		position: absolute;
		top: -1px;
		left: 50%;
		width: 1.6rem;
		height: 2px;
		translate: -50% 0;
		background: var(--accent);
		box-shadow:
			0 0 12px 2px color-mix(in srgb, var(--accent) 70%, transparent),
			0 6px 18px 4px color-mix(in srgb, var(--accent) 30%, transparent);
	}

	/* Desktop: a rail down the left edge. The name runs vertically, the destinations stack under it. */
	@media (min-width: 64rem) {
		.tabbar {
			inset: 0 auto 0 0;
			width: var(--rail-w);
			max-width: none;
			height: auto;
			margin: 0;
			grid-template-columns: none;
			grid-template-rows: 1fr repeat(4, auto);
			border-width: 0 1px 0 0;
			padding: 1.5rem 0 1.5rem;
			gap: 0.35rem;
		}
		.mark {
			display: flex;
			flex-direction: column;
			gap: 1rem;
			justify-content: flex-start;
			align-items: center;
			text-decoration: none;
		}
		.mark span {
			writing-mode: vertical-rl;
			transform: rotate(180deg);
			font-family: var(--font-display);
			font-size: 2.6rem;
			font-weight: 800;
			font-variation-settings: 'wdth' 75;
			letter-spacing: -0.02em;
			line-height: 1;
			color: transparent;
			-webkit-text-stroke: 1px color-mix(in srgb, var(--text) 55%, transparent);
			transition: color 0.3s;
		}
		.mark:hover span {
			color: var(--accent);
			-webkit-text-stroke-color: var(--accent);
		}
		a:not(.mark) {
			min-height: 4.25rem;
		}
		a[aria-current='page']::before {
			top: 50%;
			left: 0;
			width: 2px;
			height: 1.8rem;
			translate: 0 -50%;
		}
		a:not(.mark):hover {
			color: var(--text);
		}
	}
</style>
