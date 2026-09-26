import { defineConfig } from 'drizzle-kit';

// drizzle-kit does not read .env.local itself.
try {
	process.loadEnvFile('.env.local');
} catch {
	// no local env file, rely on the real environment
}

// Migrations use the direct (unpooled) connection. Falls back to the pooled one.
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL_UNPOOLED or DATABASE_URL is not set');

export default defineConfig({
	schema: './src/lib/server/db/schema/*.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: { url },
	verbose: true,
	strict: true
});
