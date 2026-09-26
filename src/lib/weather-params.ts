export interface WeatherParams {
	/** 0..1 share of the rain drops that are drawn. */
	dropScale: number;
	/** 0..1 multiplier on rain streak opacity. */
	rainOpacity: number;
	/** 0..1 how much cloud there is. */
	cloudDensity: number;
	/** 0..1 how much light gets through the cloud. */
	cloudBrightness: number;
}

export const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Maps the progress value to sky parameters.
 * 0 is a new user: heavy rain, dense low cloud, dim.
 * 1 is high progress: rain stopped, thin high cloud, a little light.
 */
export function weatherParams(weather: number): WeatherParams {
	const w = clamp01(weather);
	// Rain thins across the range and is gone by the top of it.
	const rain = clamp01(1 - w / 0.9);
	return {
		dropScale: rain,
		rainOpacity: lerp(0.15, 1, rain),
		cloudDensity: lerp(1, 0.3, w),
		cloudBrightness: lerp(0.5, 1, w)
	};
}

/** Exponential smoothing toward a target, frame-rate independent. */
export function stepToward(current: number, target: number, dtSeconds: number, halfLife = 0.6) {
	const k = 1 - Math.pow(2, -dtSeconds / halfLife);
	const next = current + (target - current) * k;
	return Math.abs(target - next) < 0.001 ? target : next;
}
