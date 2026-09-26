// Tuning knobs for progress, rust and the sky. Change them here, nowhere else.

/** Whole days without practice before a stop of that level starts to rust. */
export const RUST_DAYS = { 2: 21, 3: 45, 4: 90 } as const;

/** A region counts as cleared once every stop in it is at this level or above. */
export const CLEARED_LEVEL = 3;

/** How much a rusting stop still counts towards progress (and so the sky). */
export const RUST_WEIGHT = 0.6;

/** Progress at which the sky is fully clear. 0.5 means half the map at Mastered. */
export const SKY_CLEAR_AT = 0.5;

/** Weeks on the log's summary strip, and days a session may be logged into the past. */
export const LOG_PAGE_SIZE = 50;

/** Total hours of logged practice that get a quiet moment. */
export const HOURS_MILESTONES = [10, 30, 100] as const;
