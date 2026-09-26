import { clamp01, stepToward } from './weather-params';

/**
 * The sky. One global value in 0..1 (derived from overall progress later) plus
 * placeholder per-region values. Setting a value never hard cuts: `current`
 * and `regions` ease toward their targets. With reduced motion they snap.
 */
class Weather {
	/** Where the global value is heading. */
	target = $state(0);
	/** Eased global value the background actually renders. */
	current = $state(0);
	/** Eased per-region values, keyed by region slug. Placeholder for phase 1+. */
	regions = $state<Record<string, number>>({});

	#regionTargets: Record<string, number> = {};
	#raf = 0;
	#last = 0;

	set(value: number) {
		this.target = clamp01(value);
		this.#run();
	}

	setRegion(slug: string, value: number) {
		this.#regionTargets[slug] = clamp01(value);
		this.regions[slug] ??= this.current;
		this.#run();
	}

	/** Eased value for a region, falling back to the global sky. */
	region(slug: string) {
		return this.regions[slug] ?? this.current;
	}

	#reduced() {
		return typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	#run() {
		if (typeof window === 'undefined') {
			this.#snap();
			return;
		}
		if (this.#reduced()) {
			this.#snap();
			return;
		}
		if (this.#raf) return;
		this.#last = performance.now();
		const frame = (now: number) => {
			const dt = Math.min((now - this.#last) / 1000, 0.1);
			this.#last = now;
			this.current = stepToward(this.current, this.target, dt);
			let settled = this.current === this.target;
			for (const [slug, target] of Object.entries(this.#regionTargets)) {
				const next = stepToward(this.regions[slug] ?? this.current, target, dt);
				this.regions[slug] = next;
				if (next !== target) settled = false;
			}
			this.#raf = settled ? 0 : requestAnimationFrame(frame);
		};
		this.#raf = requestAnimationFrame(frame);
	}

	#snap() {
		this.current = this.target;
		for (const [slug, target] of Object.entries(this.#regionTargets)) this.regions[slug] = target;
	}
}

export const weather = new Weather();
