import type { Level } from '$lib/curriculum/model';
import type { Milestone } from '$lib/progress/model';
import { pushToast } from './toast.svelte';

// Small, quiet moments. Set only from the client after something the user did.

const LEVEL_LINES: Partial<Record<Level, string>> = {
	2: 'playable. it holds when you go slow.',
	3: 'solid. keep it that way.',
	4: 'mastered. cold, on demand.'
};

class Celebrate {
	/** The stop that just levelled up. `key` restarts the animation on repeat. */
	ignited = $state<{ slug: string; key: number } | null>(null);
	/**
	 * A milestone, as a few seconds of light. The kind picks where the light comes from: a
	 * cleared region opens the cloud above, a first mastered stop lights a cold ring, hours
	 * logged is amber low on the horizon.
	 */
	moment = $state<{ key: number; kind: Milestone['kind'] } | null>(null);
	#key = 0;

	levelUp(slug: string, level: Level) {
		this.ignited = { slug, key: ++this.#key };
		const line = LEVEL_LINES[level];
		if (line) pushToast(line);
	}

	milestones(list: Milestone[], regionName: (slug: string) => string) {
		for (const m of list) {
			this.moment = { key: ++this.#key, kind: m.kind };
			pushToast(
				m.kind === 'first-mastered'
					? 'your first mastered stop. the sky noticed.'
					: m.kind === 'hours'
						? `${m.hours} hours logged. that's real time.`
						: `${regionName(m.region)} is clear. a break in the cloud.`,
				'info',
				6000
			);
		}
	}
}

export const celebrate = new Celebrate();
