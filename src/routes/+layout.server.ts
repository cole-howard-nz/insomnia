export function load({ locals }) {
	// What the client is allowed to know about the signed-in user.
	return { user: locals.user };
}
