# insomnia

A mobile-first web app that maps a guitar learning pathway. The sky is the progress bar: heavy rain when you're new, breaks in the cloud as you get better, and a small cloud gathering over anything you've let go quiet.

Product docs live in [docs/](docs/00-overview.md). The execution plan is in [docs/plan/](docs/plan/00-master.md).

## Run it

```sh
npm install
vercel env pull .env.local   # DATABASE_URL and friends, never committed
npm run dev                  # http://localhost:5173, use --host to open it on a phone
```

The curriculum lives in [src/lib/curriculum/](src/lib/curriculum/). After `npm run db:migrate`, run `npm run db:seed` to load it.

Open `/dev/weather` to drag the sky through its range and preview the UI kit.

## Scripts

| Script                                | What it does                            |
| ------------------------------------- | --------------------------------------- |
| `npm run dev`                         | Dev server                              |
| `npm run build`                       | Production build (adapter-vercel)       |
| `npm run check`                       | svelte-check                            |
| `npm run lint` / `npm run format`     | Prettier and ESLint                     |
| `npm test`                            | Vitest (unit and component tests)       |
| `npm run test:e2e`                    | Playwright against the dev server       |
| `npm run db:ping`                     | Confirm the database is reachable       |
| `npm run db:generate` / `db:migrate`  | Drizzle migrations (unpooled connection) |
| `npm run db:push` / `db:studio`       | Push schema, browse data                |
| `npm run db:seed`                     | Load the curriculum (idempotent)        |
| `npm run curriculum:layout`           | Regenerate the map layout after editing stops |

## Stack

SvelteKit (Svelte 5), TypeScript, Tailwind v4, Drizzle, Neon Postgres, Vercel.

`npm run build` uses adapter-vercel, which creates symlinks. On Windows that needs Developer Mode or an elevated shell. Vercel's own builds are unaffected.
