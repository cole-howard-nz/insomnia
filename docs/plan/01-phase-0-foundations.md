# Phase 0: Foundations

Goal: an empty app that already feels right, running smoothly on a real phone.

Prerequisites: none.
Read first: [../04-design.md](../04-design.md), [../05-architecture.md](../05-architecture.md).
Reference code (read only): `D:\-- cole\Personal\Development\Game Hacking\Projects\munkeware\munkeware`

## Checklist

### Scaffold
- [x] `git init`, add `.gitignore`, first commit.
- [x] Create SvelteKit (Svelte 5, TypeScript) app in the repo root, adapter-vercel.
- [x] Add Tailwind v4, Prettier (with svelte and tailwind plugins), ESLint, Vitest, Playwright, matching munkeware's config where sensible.
- [x] Add `.env.example` with every variable the project will need, `.env` gitignored.
- [x] npm scripts: dev, build, check, lint, format, test, db:generate, db:migrate, db:push, db:studio, db:seed.
- [x] Vercel project (SvelteKit preset) and Neon database (via the Vercel Storage integration) already exist, and `.env.local` was pulled with `vercel env pull`. Do not recreate them. Confirm `.env.local` is gitignored and never print its values.
- [x] Add Drizzle and Neon config using `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (migrations), no tables yet, confirm a connection from a script.
- [x] Write a short README: what it is, how to run it, link to docs.

### Design system
- [x] Define CSS tokens from the palette in [../04-design.md](../04-design.md) (bg, text, accent, rust, clear, line).
- [x] Choose and self-host fonts (display plus body), with `font-display: swap`.
- [x] Base styles: typography scale, focus ring, tap target minimums, safe-area insets.
- [x] Photocopy grain overlay, stamped label, taped-card, and hairline-border primitives.
- [x] Base components: Button, Input, PasswordInput, Sheet (bottom sheet, drag to dismiss), Toast stack, LoadingOverlay, Tag/Stamp.

### Weather background
- [x] Port `RainBackground` from munkeware, parameterise drop count and opacity.
- [x] Port `CloudBackground`, expose `density` and `brightness` props, render at reduced resolution on mobile, pause when tab hidden.
- [x] Static fallback (CSS or SVG clouds) when WebGL is unavailable, on low-power, or with reduced motion.
- [x] A single `weather` store with global value 0..1 (plus placeholder per-region values), tweened smoothly.
- [x] Debug page `/dev/weather` with a slider for `weather` to preview the range.

### App shell
- [x] Layout with bottom tab bar (Map, Practice, Log, Me), routes stubbed as empty pages.
- [x] Viewport meta, theme-color, manifest stub, favicon.
- [x] Error page in the app voice.

## Exit criteria

- [x] `npm run check`, `lint`, `test` all pass.
- [ ] Runs on the author's actual phone (over LAN or a preview deploy) at a smooth frame rate, with the cloud and rain visible. (Deferred by owner: checked on desktop only, phone check to follow.)
- [x] With reduced motion enabled, everything is static and readable.
- [x] Body text passes AA contrast over the brightest weather state.
- [ ] Deployed to a Vercel preview URL. (Deferred by owner: Vercel CLI not installed here, deploy via CLI or git push later.)

## Handoff notes

- **Design tokens**: `:root` and `@theme inline` in [src/routes/layout.css](../../src/routes/layout.css). Design-doc names (`--bg-deep`, `--text`, `--accent`...) plus Tailwind aliases (`bg-deep`, `text-ink`, `text-dim`, `text-amber`...). `--text-dim` was lightened to `#9296a0` to pass AA. Primitives there too: `.grain`, `.stamp`, `.taped`, `.hairline`, `.input`.
- **Fonts**: Special Elite (display) and IBM Plex Mono (body) via `@fontsource`, self-hosted by Vite, `font-display: swap`.
- **Weather**: store in [src/lib/weather.svelte.ts](../../src/lib/weather.svelte.ts) (`weather.set(0..1)`, `weather.setRegion(slug, v)`, eased `current`, snaps under reduced motion). Value-to-sky mapping and smoothing in `weather-params.ts`. Components: `WeatherBackground` (chooses mode), `RainBackground`, `CloudBackground` (shader constants shared with the contrast test via `cloud-constants.ts`). Preview at `/dev/weather`.
- **Fallbacks**: reduced motion or low power (<=2 cores, <=2 GB, battery <15% unplugged) draws one still frame and redraws on weather change. No WebGL or context lost falls back to blurred CSS clouds. Clouds render half-res on coarse pointers or narrow screens, 30fps, paused when hidden.
- **Sheet**: [src/lib/components/Sheet.svelte](../../src/lib/components/Sheet.svelte), native `<dialog>`, drag handle to dismiss, Escape, backdrop tap. Toasts use a popover so they sit above an open sheet.
- **Contrast**: cloud alpha is capped at 0.3 and brightness scale at 1.3, and `weather.test.ts` checks body and secondary text against that worst case (AA).
- **Shell**: `(app)` route group holds the tab bar and the stub pages. `/` redirects to `/map` until the phase 4 landing page.
- **Env**: drizzle-kit and `db:ping` load `.env.local` themselves. Migrations use `DATABASE_URL_UNPOOLED`. `db:ping` confirmed the connection.

Not done, needs the owner:
- Phone performance is **not measured**. Run `npm run dev -- --host` and open the LAN URL on the phone, or deploy a preview, and check cloud and rain frame rate. If clouds are heavy, lower `lowRes` scale or the 30fps cap in `CloudBackground.svelte`.
- No preview deploy yet: `vercel` is not installed here and running it through npx was blocked. Either install the CLI and run `vercel deploy`, or push and let the git integration build.
- Local `npm run build` fails on Windows (adapter-vercel symlink EPERM, needs Developer Mode). Playwright therefore runs against the dev server, with Pixel 5 emulation (chromium).
- `/dev/weather` is public for now. Gate or remove it before launch.
- Consider disabling Neon Auth in the Neon dashboard (see decision log).
