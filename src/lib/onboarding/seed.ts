// Onboarding: turns three answers into a starting map for the user to confirm. Pure, so the
// rules are tested, and nothing here ever proposes above Playable. Mastered is earned.

export type Experience = 'new' | 'some' | 'plays';
export type Chasing = 'songs' | 'rhythm' | 'lead' | 'tone' | 'general';

export const EXPERIENCE_OPTIONS: { value: Experience; label: string; hint: string }[] = [
	{ value: 'new', label: 'never touched one', hint: 'start at the very start.' },
	{ value: 'some', label: 'know some chords', hint: 'the basics are in your hands.' },
	{ value: 'plays', label: 'play a bit', hint: 'you can get through a few songs.' }
];

export const CHASING_OPTIONS: { value: Chasing; label: string }[] = [
	{ value: 'songs', label: 'playing songs I love' },
	{ value: 'rhythm', label: 'better rhythm and strumming' },
	{ value: 'lead', label: 'leads and solos' },
	{ value: 'tone', label: 'a sound I can dial in' },
	{ value: 'general', label: 'just getting better' }
];

/** Only these two are ever proposed. 1 is Learning, 2 is Playable. */
export type SeedLevel = 1 | 2;

export interface SeedProposal {
	slug: string;
	level: SeedLevel;
	/** Why it is proposed, in the app's voice. */
	reason: string;
}

const FIRST_STEPS = ['posture-and-hold', 'tuning', 'holding-a-pick'];
const BASICS = ['fretting-basics', 'reading-chord-diagrams', 'clean-single-notes'];
const OPEN_CHORDS = ['open-chords-em-am', 'open-chords-cgd', 'chord-changes'];
const STRUMMING = ['downstroke-strumming', 'strumming-patterns'];
const NEXT_STEPS = ['power-chords', 'barre-f-shape', 'pentatonic-box-1', 'palm-muting'];

/** One extra Learning stop for what the user is chasing. */
const CHASE: Record<Chasing, string | null> = {
	songs: 'knockin-on-heavens-door',
	rhythm: 'metronome-timing',
	lead: 'pentatonic-box-1',
	tone: 'amp-basics',
	general: null
};

/**
 * The proposals for a set of answers, in map order. `known` is the set of stop slugs that
 * exist, so a renamed stop drops out quietly instead of breaking sign-up.
 */
export function proposeSeeds(
	answers: { experience: Experience; chasing: Chasing[] },
	known: ReadonlySet<string>
): SeedProposal[] {
	const out = new Map<string, SeedProposal>();
	const add = (slugs: string[], level: SeedLevel, reason: string) => {
		for (const slug of slugs) {
			const existing = out.get(slug);
			// A stop asked for twice keeps its higher level.
			if (known.has(slug) && (!existing || existing.level < level))
				out.set(slug, { slug, level, reason });
		}
	};

	switch (answers.experience) {
		case 'new':
			add(FIRST_STEPS, 1, 'the very start. nothing else needs to come first.');
			break;
		case 'some':
			add(FIRST_STEPS, 2, 'you said you know the basics. tick it back if not.');
			add(BASICS, 1, 'the next things to firm up.');
			add(OPEN_CHORDS, 1, 'you know a few chords. this is where they get smooth.');
			break;
		case 'plays':
			add([...FIRST_STEPS, ...BASICS], 2, 'you said you play a bit. tick it back if not.');
			add([...OPEN_CHORDS, ...STRUMMING], 2, 'you said you play a bit. tick it back if not.');
			add(NEXT_STEPS, 1, 'a good next reach.');
			break;
	}
	for (const chase of answers.chasing) {
		const slug = CHASE[chase];
		if (slug) add([slug], 1, 'you said you were chasing this.');
	}
	return [...out.values()];
}

/** What "skip for now" starts a person with: the very start, as Learning. */
export const skippedSeeds = (known: ReadonlySet<string>) =>
	proposeSeeds({ experience: 'new', chasing: [] }, known);
