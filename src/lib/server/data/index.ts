// The scoped data layer. Every private-table read and write lives in this folder, and
// every function takes `userId` as its first argument. See docs/plan/03-phase-2-accounts.md.
//
// Rules (enforced for imports by eslint, `no-restricted-imports` in eslint.config.js):
//  - private tables (anything with a user_id) are imported only from this folder
//  - ids that come from a URL or form are loaded with `WHERE id = ? AND user_id = ?`
//  - add new private tables to the list in eslint.config.js
export * from './settings';
export * from './progress';
export * from './practice';
export * from './export';
export * from './evidence';
export * from './files';
