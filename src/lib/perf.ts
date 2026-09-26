// A frame-time governor for the sky. The clouds are a fragment shader and the rain a
// canvas, so on a weak phone they can cost more than the app is worth. The governor
// watches real frame times while the sky animates and steps quality down until it holds.
// Pure and small so the rules are tested. WeatherBackground does the wiring.

/** Quality, best first. Each step down does less work. */
export const TIERS = ['full', 'half-res', 'light-rain', 'still'] as const;
export type Tier = (typeof TIERS)[number];
export const LAST_TIER = TIERS.length - 1;

/** Slower than about 33 fps on average counts as struggling. */
export const SLOW_FRAME_MS = 30;
/** Frames ignored at the start of a window: the first few are always compile and layout. */
export const WARMUP_FRAMES = 6;
/** A gap this long is a hidden tab or a stall, not the sky's cost. */
export const OUTLIER_MS = 250;
/** Frames needed in a window before it says anything. */
export const MIN_FRAMES = 40;

/** Average frame time over a window, or null when there are too few usable frames to judge. */
export function averageFrameMs(frameTimes: readonly number[]): number | null {
	const usable = frameTimes.slice(WARMUP_FRAMES).filter((ms) => ms < OUTLIER_MS);
	if (usable.length < MIN_FRAMES) return null;
	return usable.reduce((sum, ms) => sum + ms, 0) / usable.length;
}

/** The tier after a window: one step down if it was slow, otherwise unchanged. */
export function nextTier(tier: number, averageMs: number | null): number {
	if (averageMs === null || averageMs <= SLOW_FRAME_MS) return tier;
	return Math.min(tier + 1, LAST_TIER);
}

/** What each tier turns off, for the components to read. */
export function tierSettings(tier: number) {
	return {
		halfRes: tier >= 1,
		/** Share of rain drops kept. */
		rainShare: tier >= 2 ? 0.5 : 1,
		animate: tier < LAST_TIER
	};
}
