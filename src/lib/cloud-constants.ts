/** Shared by the cloud shader and the contrast test, so they cannot drift apart. */

/** Linear-ish 0..1 colour of the cloud at brightness 1 (before scaling). */
export const CLOUD_COLOR: [number, number, number] = [0.34, 0.33, 0.3];
/** Colour scale at brightness 0 and 1. */
export const CLOUD_SCALE_MIN = 0.7;
export const CLOUD_SCALE_MAX = 1.3;
/** Hard cap on how opaque clouds ever get, even where lanes overlap. */
export const CLOUD_ALPHA_CAP = 0.3;
