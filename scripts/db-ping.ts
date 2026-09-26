// Confirms the database is reachable. Run with: npm run db:ping
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const db = drizzle(neon(url));
const result = await db.execute(sql`select 1 as ok`);
console.log('db reachable:', result.rows[0]);
