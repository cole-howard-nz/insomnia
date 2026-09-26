import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import Sheet from './Sheet.svelte';

const body = createRawSnippet(() => ({ render: () => '<p>sheet body</p>' }));

describe('Sheet', () => {
	it('shows its title and content when open', async () => {
		const screen = await render(Sheet, { open: true, title: 'barre chords', children: body });
		await expect.element(screen.getByRole('dialog', { name: 'barre chords' })).toBeVisible();
		await expect.element(screen.getByText('sheet body')).toBeVisible();
	});

	it('stays closed by default', async () => {
		const screen = await render(Sheet, { title: 'hidden', children: body });
		await expect.element(screen.getByRole('dialog', { name: 'hidden' })).not.toBeInTheDocument();
	});
});
