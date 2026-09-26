import prettier from 'eslint-config-prettier';
import path from 'node:path';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';

const PRIVATE_TABLES = [
	'users',
	'sessions',
	'emailTokens',
	'userSettings',
	'userStopProgress',
	'userCriteriaDone',
	'practiceSessions',
	'practiceSessionStops',
	'levelEvents',
	'evidence'
];

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	ts.configs.recommended,
	svelte.configs.recommended,
	prettier,
	svelte.configs.prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			// typescript-eslint recommends against no-undef on TypeScript projects.
			'no-undef': 'off'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser
			}
		}
	},
	// Private tables are only touched through the scoped data layer (userId first), and the
	// account tables only through the auth module. Add every new user-owned table here.
	{
		files: ['src/**/*.{ts,svelte}'],
		ignores: [
			'src/lib/server/data/**',
			'src/lib/server/auth/**',
			'src/lib/server/db/**',
			'**/*.test.ts'
		],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					paths: [
						{
							name: '$lib/server/db/schema',
							importNames: PRIVATE_TABLES,
							message:
								'Private tables are queried only from src/lib/server/data (or auth for account tables). See docs/plan/03-phase-2-accounts.md.'
						}
					]
				}
			]
		}
	}
);
