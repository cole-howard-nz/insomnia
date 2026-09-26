import { getStorage } from '$lib/server/storage';
import { listEvidenceKeys } from './evidence';

/**
 * Deletes every stored file (evidence recordings) that belongs to a user. Account deletion
 * calls it before the rows go, so a failure here stops the deletion rather than orphaning files.
 */
export async function deleteUserFiles(userId: string): Promise<void> {
	const keys = (await listEvidenceKeys(userId))
		.map((row) => row.storageKey)
		.filter((key): key is string => key !== null);
	await getStorage().delete(keys);
}
