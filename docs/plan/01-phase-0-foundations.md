# Phase 0: Foundations

Goal: an empty app that already feels right, running smoothly on a real phone.

Prerequisites: none.
Read first: [../04-design.md](../04-design.md), [../05-architecture.md](../05-architecture.md).
Reference code (read only): `D:\-- cole\Personal\Development\Game Hacking\Projects\munkeware\munkeware`

## Checklist

### Scaffold
- [ ] `git init`, add `.gitignore`, first commit.
- [ ] Create SvelteKit (Svelte 5, TypeScript) app in the repo root, adapter-vercel.
- [ ] Add Tailwind v4, Prettier (with svelte and tailwind plugins), ESLint, Vitest, Playwright, matching munkeware's config where sensible.
- [ ] Add `.env.example` with every variable the project will need, `.env` gitignored.
- [ ] npm scripts: dev, build, check, lint, format, test, db:generate, db:migrate, db:push, db:studio, db:seed.
- [ ] Add Drizzle and Neon config, no tables yet, confirm a connection from a script.
- [ ] Write a short README: what it is, how to run it, link to docs.

### Design system
- [ ] Define CSS tokens from the palette in [../04-design.md](../04-design.md) (bg, text, accent, rust, clear, line).
- [ ] Choose and self-host fonts (display plus body), with `font-display: swap`.
- [ ] Base styles: typography scale, focus ring, tap target minimums, safe-area insets.
- [ ] Photocopy grain overlay, stamped label, taped-card, and hairline-border primitives.
- [ ] Base components: Button, Input, PasswordInput, Sheet (bottom sheet, drag to dismiss), Toast stack, LoadingOverlay, Tag/Stamp.

### Weather background
- [ ] Port `RainBackground` from munkeware, parameterise drop count and opacity.
- [ ] Port `CloudBackground`, expose `density` and `brightness` props, render at reduced resolution on mobile, pause when tab hidden.
- [ ] Static fallback (CSS or SVG clouds) when WebGL is unavailable, on low-power, or with reduced motion.
- [ ] A single `weather` store with global value 0..1 (plus placeholder per-region values), tweened smoothly.
- [ ] Debug page `/dev/weather` with a slider for `weather` to preview the range.

### App shell
- [ ] Layout with bottom tab bar (Map, Practice, Log, Me), routes stubbed as empty pages.
- [ ] Viewport meta, theme-color, manifest stub, favicon.
- [ ] Error page in the app voice.

## Exit criteria

- [ ] `npm run check`, `lint`, `test` all pass.
- [ ] Runs on the author's actual phone (over LAN or a preview deploy) at a smooth frame rate, with the cloud and rain visible.
- [ ] With reduced motion enabled, everything is static and readable.
- [ ] Body text passes AA contrast over the brightest weather state.
- [ ] Deployed to a Vercel preview URL.

## Handoff notes

(fill in at end of session: file locations of the design tokens, weather store, and Sheet component, and the measured phone performance)
