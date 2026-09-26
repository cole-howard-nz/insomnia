import { drill, stop, yt } from '../author';
import type { RegionSource } from '../schema';

export const foundations: RegionSource = {
	slug: 'foundations',
	name: 'foundations',
	blurb: 'the boring part that makes everything else work. sit, tune, hold, press.',
	stops: [
		stop(
			'posture-and-hold',
			'posture and holding it',
			'how to sit or stand with the guitar so nothing hurts and both hands can move. the thing everyone skips.',
			[
				[
					'sit with the guitar stable without holding it with your hands.',
					'keep shoulders loose while playing for five minutes.'
				],
				['play a full practice session without shoulder, wrist or neck ache.'],
				['switch between sitting and standing without changing how you play.']
			],
			[yt('guitar posture for beginners sitting and standing')]
		),
		stop(
			'tuning',
			'tuning',
			'get all six strings to pitch with a tuner, then with your ears. out of tune practice teaches the wrong thing.',
			[
				[
					'tune all six strings with a tuner in under two minutes.',
					'name the string you are tuning without looking.'
				],
				['tune to a reference note by ear, then check it with a tuner.'],
				['tune by ear alone and land within a few cents on every string.']
			],
			[yt('how to tune a guitar by ear and with a tuner')],
			{ helpedBy: ['posture-and-hold'] }
		),
		stop(
			'holding-a-pick',
			'holding a pick',
			'grip, angle and how much of the pick shows. small things that decide how your picking sounds.',
			[
				['hold the pick between thumb and side of index finger without it spinning.'],
				['play ten slow downstrokes on one string without dropping the pick.'],
				['pick with a relaxed grip through a full song, no re-gripping.']
			],
			[yt('how to hold a guitar pick correctly')],
			{ helpedBy: ['posture-and-hold'] }
		),
		stop(
			'fretting-basics',
			'fretting hand basics',
			'thumb behind the neck, fingertips arched, pressing just behind the fret. clean notes start here.',
			[
				[
					'press a note with the fingertip, just behind the fret, and hear it ring.',
					'name which finger is 1, 2, 3 and 4.'
				],
				['fret notes with each of the four fingers cleanly on every string.'],
				['keep a relaxed light grip and still get clean notes at speed.']
			],
			[yt('fretting hand technique for beginners')],
			{ helpedBy: ['posture-and-hold'] }
		),
		stop(
			'reading-chord-diagrams',
			'reading chord diagrams',
			'the little grids. dots are fingers, o is open, x is muted. you will read hundreds of them.',
			[
				['read a diagram and say which strings, frets and fingers it shows.'],
				['play three unfamiliar shapes straight from diagrams without help.'],
				['read a chord chart for a full song and play it without prep.']
			],
			[yt('how to read guitar chord diagrams')],
			{ helpedBy: ['fretting-basics'] }
		),
		stop(
			'reading-tab',
			'reading tab',
			'six lines, numbers for frets. rhythm is missing, so listen to the recording as well.',
			[
				['play a one-string tab of a simple melody.'],
				['play a multi-string tab, matching the rhythm from the recording.'],
				['learn a new riff from tab in one sitting and play it cold the next day.']
			],
			[yt('how to read guitar tabs for beginners')],
			{ helpedBy: ['fretting-basics'] }
		),
		stop(
			'clean-single-notes',
			'clean single notes',
			'one note at a time, no buzz, no ring from neighbours. the boring exercise that pays back forever.',
			[
				['play the first five frets of one string with no buzz.'],
				['play a one-string chromatic run up and down at 60 bpm, clean.'],
				['play a clean chromatic run on all six strings at 80 bpm, cold.']
			],
			[drill('one string chromatic exercise guitar beginners')],
			{ bpm: 80, helpedBy: ['fretting-basics', 'holding-a-pick'] }
		),
		stop(
			'finger-independence',
			'finger exercises',
			'the 1-2-3-4 spider and friends. gets the fingers moving on their own, and a little bored.',
			[
				['play the 1-2-3-4 pattern on one string slowly and cleanly.'],
				['play the pattern across all strings at 70 bpm, clean.'],
				['play the pattern in several positions at 90 bpm, cold.']
			],
			[drill('1234 spider exercise guitar warm up')],
			{ bpm: 90, helpedBy: ['clean-single-notes'] }
		)
	]
};
