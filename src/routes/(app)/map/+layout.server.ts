import { loadCurriculum } from '$lib/server/curriculum';

export async function load() {
	return { curriculum: await loadCurriculum() };
}
