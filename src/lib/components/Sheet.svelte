<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		open = $bindable(false),
		title,
		children
	}: { open?: boolean; title: string; children: Snippet } = $props();

	let dialog: HTMLDialogElement | undefined = $state();
	let dy = $state(0);
	let dragging = $state(false);
	let startY = 0;
	let startTime = 0;

	const DISMISS_DISTANCE = 110;
	const DISMISS_VELOCITY = 0.6; // px per ms

	const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) {
			dy = 0;
			dialog.showModal();
		} else if (!open && dialog.open) {
			dialog.close();
		}
	});

	/** Slides the sheet away, then closes it. */
	function dismiss() {
		if (reduced() || !dialog) {
			open = false;
			return;
		}
		dy = dialog.offsetHeight;
		setTimeout(() => (open = false), 180);
	}

	function onPointerDown(event: PointerEvent) {
		dragging = true;
		startY = event.clientY;
		startTime = event.timeStamp;
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
	}

	function onPointerMove(event: PointerEvent) {
		if (!dragging) return;
		dy = Math.max(0, event.clientY - startY);
	}

	function onPointerUp(event: PointerEvent) {
		if (!dragging) return;
		dragging = false;
		const velocity = dy / Math.max(1, event.timeStamp - startTime);
		if (dy > DISMISS_DISTANCE || velocity > DISMISS_VELOCITY) dismiss();
		else dy = 0;
	}

	function onHandleKey(event: KeyboardEvent) {
		if (event.key === 'Escape') dismiss();
	}
</script>

<dialog
	bind:this={dialog}
	class="sheet"
	aria-label={title}
	style:transform={dy ? `translateY(${dy}px)` : undefined}
	class:dragging
	oncancel={(event) => {
		event.preventDefault();
		dismiss();
	}}
	onclose={() => (open = false)}
	onclick={(event) => {
		if (event.target === dialog) dismiss();
	}}
>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="grab"
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
		onkeydown={onHandleKey}
	>
		<span class="bar"></span>
	</div>
	<div class="head">
		<h2>{title}</h2>
		<button type="button" class="close" onclick={dismiss}>
			<span class="sr-only">close</span>
			<span aria-hidden="true">&#x2715;</span>
		</button>
	</div>
	<div class="body">
		{@render children()}
	</div>
</dialog>

<style>
	.sheet {
		position: fixed;
		inset: auto 0 0 0;
		margin: 0 auto;
		width: 100%;
		max-width: 32rem;
		max-height: 85dvh;
		padding: 0 0 var(--safe-bottom);
		box-sizing: border-box;
		background: var(--bg-cloud);
		color: var(--text);
		border: 1px solid var(--line);
		border-bottom: none;
		overflow: hidden;
		flex-direction: column;
		transition: transform 0.18s ease-out;
	}
	.sheet[open] {
		display: flex;
		animation: rise 0.22s ease-out;
	}
	.sheet.dragging {
		transition: none;
	}
	.sheet::backdrop {
		background: color-mix(in srgb, var(--bg-deep) 75%, transparent);
	}
	@keyframes rise {
		from {
			transform: translateY(100%);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.sheet {
			transition: none;
		}
		.sheet[open] {
			animation: none;
		}
	}

	.grab {
		flex: none;
		display: flex;
		justify-content: center;
		padding: 0.75rem 0 0.25rem;
		cursor: grab;
		touch-action: none;
	}
	.bar {
		width: 2.5rem;
		height: 4px;
		background: var(--line);
	}
	.head {
		flex: none;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 0.5rem 0 1rem;
	}
	.close {
		min-width: var(--tap);
		background: none;
		border: none;
		color: var(--text-dim);
	}
	.body {
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 0.5rem 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.75rem;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
