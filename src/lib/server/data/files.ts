/**
 * Deletes every stored file (evidence recordings) that belongs to a user. Called by
 * account deletion before the rows go. There are no files until phase 4, which fills
 * this in. Account deletion already calls it, so nothing else needs to change then.
 */
export async function deleteUserFiles(userId: string): Promise<void> {
	void userId;
}
