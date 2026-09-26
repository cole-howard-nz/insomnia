# Design

Direction: **midwest emo / punk / edgy**. Dark, rainy, overcast, small-room DIY show energy. Quiet and a bit sad, but with hard edges. The tone is a photocopied gig flyer left out in the rain.

## Late night (from the name, Insomnia)

The app is called Insomnia, so the mood is 2am, not just rain. The dark is the point: keep the UI genuinely dim (it is used late, on a phone, in a dark room), with amber as the only warm light. Copy can lean into it ("still up?", "2am. good time to play."). Consider a small clock or "hours logged after midnight" stat in the log as a wink, and a dim-further "night" setting for very low light. Never bright flashes, so level-up moments glow rather than flash.

## Reference: munkeware

Path: `D:\-- cole\Personal\Development\Game Hacking\Projects\munkeware\munkeware` (SvelteKit + Tailwind v4).

Worth reusing or porting:

| Asset | File | Notes |
|---|---|---|
| Rain | `src/lib/components/RainBackground.svelte` | Canvas 2D, three parallax depth layers (70/50/32 drops), respects `prefers-reduced-motion`, DPR capped at 2. Cheap. |
| Clouds | `src/lib/components/CloudBackground.svelte` | WebGL fragment shader, fbm plus billow noise, domain-warped, composites over a dark base. Heavier. |
| Toasts, loading overlay, password input | `ToastStack.svelte`, `LoadingOverlay.svelte`, `PasswordInput.svelte` | Likely reusable with a restyle. |

Deliberately **not** reusing: the "cs" window chrome (grey Counter-Strike 1.6 style panels, bevelled borders, titlebar gradients). It suits that project and would fight this one. Keep the weather, drop the window.

To check before porting: mobile GPU cost of the cloud shader. It needs a cheaper fallback (see performance below).

## Palette (starting point, tune on device)

Cold, desaturated, one warm accent, like a streetlight through rain.

| Token | Value | Use |
|---|---|---|
| `--bg-deep` | `#0c0d10` | Page background |
| `--bg-cloud` | `#171a20` | Cards, sheets |
| `--bg-cloud-hi` | `#222730` | Raised elements |
| `--line` | `#2f3540` | Hairlines, map links |
| `--text` | `#d8d6cf` | Body, off-white with warmth |
| `--text-dim` | `#8b8f98` | Secondary |
| `--accent` | `#e2932c` | Streetlight amber: primary actions, lit stops. (matches munkeware's accent) |
| `--rust` | `#8f3a30` | Clouded/neglected stops, destructive actions |
| `--clear` | `#9fc4d6` | Cold clear-sky blue, mastery and "sky opening" moments |

Rules: no pure black, no pure white, no gradients-for-decoration. Amber is scarce, so it means "this is alive".

## Type

- **Display**: a rough, condensed or typewriter-ish face for headings and stop names. Candidates: *Special Elite* (typewriter), *Bebas Neue* / *Anton* (flyer caps), *Rubik Glitch* is too gimmicky, skip.
- **Body**: a clean mono or grotesk for readability. Candidates: *IBM Plex Mono*, *Space Grotesk*.
- Lowercase-heavy UI copy. Short, deadpan, slightly sad. See voice below.
- Body never below 16px on mobile.

## The weather is the progress bar

This is the signature idea. The background is driven by progress state.

| State | Sky |
|---|---|
| New user, nothing mastered | Heavy rain, dense low cloud, dim |
| Regions being explored | Rain thins, cloud density drops |
| A region cleared | That region's part of the map gets a break in the cloud, cold light on its stops |
| Overall high progress | Rain stops, high thin cloud, amber light low on the horizon |
| A stop rusting | A small local cloud gathers over that stop on the map |

Implementation sketch: a single `weather` value in [0..1] (derived from overall progress) plus per-region values, fed as uniforms to the cloud shader (density, brightness) and as parameters to the rain (drop count, opacity). Smoothly tween on change. Never hard cut.

## Stops on the map

- **Unseen**: unlit hollow circle, hairline stroke.
- **Learning**: half-filled, flickers faintly.
- **Playable**: filled, dim amber.
- **Solid**: bright amber with a soft halo.
- **Mastered**: `--clear` blue-white core with a crisp ring, still.
- **Rusting**: a `--rust` smudge overlays it, dims the halo.
- Links: thin lines, drawn as slightly wobbly hand-cut strokes rather than perfect vectors.
- Level is never conveyed by color alone (shape and fill also differ), for accessibility.

## Edge, texture, and punk details

- Photocopy grain overlay at very low opacity, static.
- Hard rectangles with 1px borders, slight rotation (0.5 to 1 degree) on a few cards and tags, like taped-up flyers.
- Stamped labels ("PLAYABLE", "RUSTING") in the display face, offset misprint shadow.
- Cut-out or ransom-note style only on rare marketing headings, not in working UI. Legibility first.
- Micro-animations: rain streaks on load, a stop "ignites" when levelled up, a cloud lifts off a region when cleared. Short and quiet.
- Sound: none by default. Optional rain ambience toggle in settings, off by default.

## Voice (copy)

Lowercase, deadpan, a little sad, never mean, never cringe.

- Empty state: "nothing here yet. that's okay."
- Rusting: "it's been 24 days. it misses you."
- Level up: "solid. keep it that way."
- Error: "something broke. not you. try again."
- Delete account: plain and serious, no jokes.

## Mobile-first rules

- Design at 390px wide first, scale up. Desktop gets the same layout with more map visible, no separate design.
- Thumb zone: primary actions and the bottom sheet sit in the lower half. Bottom tab bar: Map, Practice, Log, Me.
- Tap targets 44px minimum. Map stops have a larger invisible hit area than their drawn size.
- Gestures on the map: drag to pan, pinch to zoom, tap to open. Always provide +/- and a "reset view" button.
- Bottom sheets over modals. Sheets can be dragged to dismiss.
- Safe-area insets respected (notch, home indicator).
- Works in portrait first, landscape acceptable (guitar on lap, phone on a stand is a real use case, so the practice log screen must work one-handed and glanceable).

## Performance and accessibility

- `prefers-reduced-motion`: rain and cloud animation freeze to a static frame, level-up animations become instant state changes.
- Cloud shader: render at reduced resolution on mobile (e.g. half-res, upscaled), pause when the tab is hidden, and provide a CSS/static-image fallback when WebGL is unavailable or the device is low-power.
- Rain pauses on the practice-timer screen if battery is low (`navigator.getBattery` where available).
- Contrast: body text meets WCAG AA against every sky state. Verify with the brightest cloud frame.
- Full keyboard and screen reader access to the map through the list view, stops have real labels ("Barre chords, level 2 of 4, rusting").
