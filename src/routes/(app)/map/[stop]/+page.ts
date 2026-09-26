import { error } from '@sveltejs/kit';

export async function load({ params, parent }) {
	const { curriculum } = await parent();
	if (!curriculum.stops.some((s) => s.slug === params.stop)) error(404, 'no such stop');
	return { slug: params.stop };
}
