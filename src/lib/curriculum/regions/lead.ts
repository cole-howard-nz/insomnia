import { drill, stop, yt } from '../author';
import type { RegionSource } from '../schema';

export const lead: RegionSource = {
	slug: 'lead',
	name: 'lead',
	blurb: 'melody, bends and small hard-earned solos. also the twinkly picking.',
	stops: [
		stop(
			'pentatonic-box-1',
			'pentatonic box 1',
			'the minor pentatonic shape everyone learns first. five notes, a lot of songs.',
			[
				['play box 1 of A minor pentatonic up and down without a mistake.'],
				['play the box up and down at 80 bpm in eighth notes, clean.'],
				['play the box from memory in three keys, cold.']
			],
			[yt('minor pentatonic box 1 guitar lesson')],
			{ bpm: 80, helpedBy: ['clean-single-notes', 'reading-tab'] }
		),
		stop(
			'pentatonic-boxes',
			'all five pentatonic boxes',
			'the full neck: five linked shapes. the map that stops you being stuck in one place.',
			[
				['play all five boxes of A minor pentatonic slowly.'],
				['link two neighbouring boxes with a slide or shift at 70 bpm.'],
				['move through all five boxes in a solo phrase, cold.']
			],
			[yt('five pentatonic boxes guitar connecting positions')],
			{ bpm: 70, helpedBy: ['pentatonic-box-1'], unlockedBy: ['fretboard-notes'] }
		),
		stop(
			'hammer-ons-pull-offs',
			'hammer-ons and pull-offs',
			'sound a note using only the fretting hand. the start of fast, smooth, legato.',
			[
				['hammer on and pull off on one string with an even volume.'],
				['play a hammer-on and pull-off trill at 80 bpm, even, for a minute.'],
				['use them inside a riff or lick at speed, cold.']
			],
			[yt('hammer ons and pull offs guitar technique')],
			{ bpm: 80, helpedBy: ['finger-independence', 'clean-single-notes'] }
		),
		stop(
			'slides',
			'slides',
			'move a finger up or down the string without lifting. connects notes and boxes.',
			[
				['slide one fret and two frets up and down on one string, landing in tune.'],
				['slide between boxes in a pentatonic run, landing clean.'],
				['slide into and out of notes in a lick without looking, cold.']
			],
			[yt('guitar slides technique lesson')],
			{ helpedBy: ['fretting-basics'], unlockedBy: ['pentatonic-boxes'] }
		),
		stop(
			'bends',
			'bends',
			'push the string sideways to raise the pitch. the note that sounds like a voice.',
			[
				['bend a note up one whole step and sing the pitch it should reach.'],
				['bend a whole step in tune 8 of 10 times, checked against a reference.'],
				['bend and release in a solo phrase, in tune, cold.']
			],
			[yt('guitar string bending in tune lesson')],
			{ helpedBy: ['pentatonic-box-1', 'finger-independence'] }
		),
		stop(
			'vibrato',
			'vibrato',
			'a small controlled wobble on a held note. the difference between playing a note and meaning it.',
			[
				['add a slow vibrato to a held note without changing the pitch too far.'],
				['use even vibrato on held notes in a slow melody.'],
				['pick vibrato width and speed to match a recording, cold.']
			],
			[yt('guitar vibrato technique lesson')],
			{ helpedBy: ['bends'] }
		),
		stop(
			'licks-and-phrasing',
			'simple licks',
			'short phrases that sound like something. steal a few, change them, leave gaps.',
			[
				['play three short licks from the pentatonic shapes.'],
				['play a lick over a backing track at 80 bpm, in time.'],
				['change a lick on the fly and call it your own, cold.']
			],
			[yt('easy guitar licks for beginners pentatonic'), drill('a minor backing track guitar')],
			{ bpm: 80, helpedBy: ['pentatonic-box-1', 'slides'], unlockedBy: ['bends'] }
		),
		stop(
			'twinkly-picking',
			'twinkly emo picking',
			'rolling notes, open strings ringing, hammers and pull-offs looping. the shimmer of the genre.',
			[
				['play a simple looping two-string figure with hammer-ons, slowly.'],
				['play a looping figure over an open string drone at 100 bpm, clean.'],
				['write a short twinkly loop, play it for two minutes without stopping, cold.']
			],
			[yt('twinkly midwest emo guitar tutorial')],
			{
				bpm: 110,
				helpedBy: ['hammer-ons-pull-offs', 'ringing-open-shapes'],
				unlockedBy: ['alternate-picking']
			}
		),
		stop(
			'simple-solo',
			'your first solo',
			'eight bars over a backing track that says something. it does not need to be fast.',
			[
				['play a four-bar solo over a backing track with a lick and a bend.'],
				['play an eight-bar solo at 80 bpm with a clear beginning and end.'],
				['play a solo cold, different each time, and finish on a good note.']
			],
			[drill('backing track for beginners guitar solo')],
			{ bpm: 80, helpedBy: ['licks-and-phrasing', 'vibrato'], unlockedBy: ['pentatonic-boxes'] }
		),
		stop(
			'tapping',
			'two-hand tapping',
			'tap a note with the picking hand to get notes fast and floaty. a big part of emo picking.',
			[
				['tap a single note with the picking hand and pull off cleanly.'],
				['play a three-note tapped figure at 80 bpm, clean.'],
				['play a tapped figure inside a song section, cold.']
			],
			[yt('guitar tapping technique for beginners')],
			{ bpm: 80, helpedBy: ['hammer-ons-pull-offs'], unlockedBy: ['twinkly-picking'] }
		)
	]
};
