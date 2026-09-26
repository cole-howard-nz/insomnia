import { stop, yt } from '../author';
import type { RegionSource } from '../schema';

export const tone: RegionSource = {
	slug: 'tone',
	name: 'tone and gear',
	blurb: 'the box, the pedals, the strings. how it sounds matters, so does keeping it working.',
	stops: [
		stop(
			'amp-basics',
			'amp basics',
			'volume, gain, and the three tone knobs. the first step to sounding like you meant to.',
			[
				['set an amp to a clean sound with the tone knobs at noon.'],
				['adjust bass, mid and treble to fix a muddy or thin sound.'],
				['dial a good sound for a new guitar and amp in a few minutes, cold.']
			],
			[yt('guitar amp settings for beginners')],
			{ helpedBy: ['posture-and-hold'] }
		),
		stop(
			'gain-staging',
			'gain and volume',
			'how much crunch, how loud. the balance that decides clean, crunch or fuzz.',
			[
				['switch between clean and crunch on an amp using gain and volume.'],
				['set a gain level that keeps chords clear and notes singing.'],
				['set gain by ear for each song, and hear why, cold.']
			],
			[yt('guitar amp gain and volume explained')],
			{ helpedBy: ['amp-basics'] }
		),
		stop(
			'overdrive-pedal',
			'overdrive and distortion',
			'push the signal until it breaks up. how to use a pedal instead of just turning it on.',
			[
				['connect a pedal and turn it on without noise or hum.'],
				['set drive, tone and level so the pedal gets louder without getting harsh.'],
				['match the overdrive sound from a favourite song, cold.']
			],
			[yt('overdrive distortion pedal settings guide')],
			{ helpedBy: ['gain-staging'] }
		),
		stop(
			'delay-and-reverb',
			'delay and reverb',
			'echo and space. the two effects that make twinkly guitar sound like a room after everyone left.',
			[
				['set a reverb that adds space without washing out the notes.'],
				['set a delay time to match the tempo of a song.'],
				['pick reverb and delay by ear for a section, cold.']
			],
			[yt('delay and reverb pedals settings guitar')],
			{ helpedBy: ['amp-basics'], unlockedBy: ['twinkly-picking'] }
		),
		stop(
			'changing-strings',
			'changing strings',
			'old strings sound dead and will not stay in tune. changing them is quick once you have done it twice.',
			[
				['restring a guitar with help from a video.'],
				['restring a guitar without help and get it in tune within half an hour.'],
				['change a full set in ten minutes and stretch them so they stay in tune.']
			],
			[yt('how to change guitar strings')],
			{ helpedBy: ['tuning'] }
		),
		stop(
			'guitar-setup',
			'basic guitar setup',
			'action, neck relief and intonation. the small changes that make a guitar much easier to play.',
			[
				['check the string height at the 12th fret and see if it feels too high.'],
				['adjust the truss rod a small amount and check neck relief.'],
				['do a basic setup on your own guitar and feel the difference, cold.']
			],
			[yt('basic guitar setup at home action relief intonation')],
			{ helpedBy: ['changing-strings'] }
		)
	]
};
