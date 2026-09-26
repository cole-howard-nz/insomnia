import { drill, stop, yt } from '../author';
import type { RegionSource } from '../schema';

export const chords: RegionSource = {
	slug: 'chords',
	name: 'chords',
	blurb: 'shapes, changes, and the twinkly voicings that make the room go quiet.',
	stops: [
		stop(
			'open-chords-em-am',
			'open chords: em, am, e, a',
			'the easiest four. one or two or three fingers and a whole songs worth of mood.',
			[
				['form Em, Am, E and A and strum each with all strings ringing.'],
				['play each of the four cleanly on the first try, three times in a row.'],
				['form each chord cold, without looking, and hear no dead strings.']
			],
			[yt('easy open guitar chords Em Am E A')],
			{ helpedBy: ['reading-chord-diagrams', 'fretting-basics'] }
		),
		stop(
			'open-chords-cgd',
			'open chords: c, g, d',
			'the stretchier open chords. more fingers, more strings, more ways to mute one by accident.',
			[
				['form C, G and D so all the right strings ring.'],
				['play each chord cleanly on the first try, three times in a row.'],
				['form each cold with no fixing, in any order.']
			],
			[yt('open guitar chords C G D beginner')],
			{ helpedBy: ['open-chords-em-am'] }
		),
		stop(
			'chord-changes',
			'chord changes',
			'moving between shapes on time. the most common wall, and the one that just takes reps.',
			[
				['change between two chords with a pause, without looking.'],
				['change between G, C, D and Em in time at 70 bpm, four bars each.'],
				['play a four-chord progression at 100 bpm with no stops, cold.']
			],
			[yt('guitar chord changes faster exercise'), drill('one minute chord changes')],
			{
				bpm: 100,
				helpedBy: ['open-chords-em-am', 'open-chords-cgd'],
				unlockedBy: ['metronome-timing']
			}
		),
		stop(
			'power-chords',
			'power chords',
			'two notes, one shape, slide it anywhere. punk in one finger position.',
			[
				['form a power chord on the low E and A strings and mute the rest.'],
				['move a power chord between three frets in time at 80 bpm.'],
				['play a punk riff of power chords at 140 bpm without stopping.']
			],
			[yt('power chords guitar lesson beginners')],
			{ bpm: 140, helpedBy: ['fretting-basics', 'clean-single-notes'] }
		),
		stop(
			'barre-f-shape',
			'barre chords (f shape)',
			'the wall. index finger flat across all six strings, and a bit of pain that eventually goes.',
			[
				['form the F barre shape and get all six strings to ring for one strum, 5 of 10 attempts.'],
				['switch between Am and F and back at 60 bpm, clean, 4 bars in a row.'],
				['play a full song that uses the F barre, twice, cold, without stopping.']
			],
			[yt('barre chords F shape beginners fix buzzing')],
			{ bpm: 60, helpedBy: ['open-chords-em-am', 'chord-changes'] }
		),
		stop(
			'barre-a-shape',
			'barre chords (a shape)',
			'the second barre shape, rooted on the A string. it makes every major and minor chord available.',
			[
				['form the A-shape barre at the 2nd fret and ring all five strings.'],
				['move the shape between three frets in time at 60 bpm, clean.'],
				['play a song that switches between E-shape and A-shape barres, cold.']
			],
			[yt('a shape barre chords guitar lesson')],
			{ bpm: 60, helpedBy: ['barre-f-shape'] }
		),
		stop(
			'sus-and-add',
			'sus and add chords',
			'sus2, sus4, add9. one note swapped, and the chord stops being happy or sad and just hangs there.',
			[
				['play Asus2, Dsus2 and Cadd9 with the strings ringing.'],
				['switch between a plain chord and its sus version in time at 70 bpm.'],
				['write a short progression using at least two sus or add chords and play it cold.']
			],
			[yt('sus2 sus4 add9 chords guitar')],
			{ helpedBy: ['open-chords-em-am', 'open-chords-cgd'] }
		),
		stop(
			'ringing-open-shapes',
			'ringing open shapes',
			'shapes that let open strings hang over the top of a fretted note. the midwest emo shimmer.',
			[
				['play a two-finger shape with open strings ringing and no dead notes.'],
				['play three linked ringing shapes in time at 80 bpm.'],
				['improvise a small progression with ringing shapes and repeat it from memory.']
			],
			[yt('midwest emo open chord shapes guitar')],
			{ helpedBy: ['sus-and-add'], unlockedBy: ['chord-changes'] }
		),
		stop(
			'seventh-chords',
			'seventh chords',
			'maj7, min7, dominant 7. jazzier, and softer than they look on paper.',
			[
				['play Cmaj7, Am7, Dm7 and G7 in open position.'],
				['change between the four in time at 70 bpm, clean.'],
				['play a maj7 or min7 voicing in two positions cold.']
			],
			[yt('seventh chords guitar beginners')],
			{ helpedBy: ['open-chords-cgd'], unlockedBy: ['chord-construction'] }
		),
		stop(
			'capo-basics',
			'capo basics',
			'clamp it on, change the key, keep the shapes. makes hard keys easy and open voicings brighter.',
			[
				['place the capo close behind the fret and check nothing buzzes.'],
				['play a known progression in three different capo positions.'],
				['work out the capo position for a song and play it in the recorded key, cold.']
			],
			[yt('how to use a capo on guitar')],
			{ helpedBy: ['open-chords-cgd'], unlockedBy: ['tuning'] }
		),
		stop(
			'open-tunings',
			'open tunings',
			'retune so the open strings make a chord. one finger barre, new voicings, whole genres of mood.',
			[
				['tune to open D or DADGAD and strum the open chord in tune.'],
				['play two or three shapes in the tuning and switch between them in time.'],
				['play a full song or riff in an open tuning, starting from standard, in one go.']
			],
			[yt('alternate open tunings guitar beginners')],
			{ helpedBy: ['tuning', 'chord-changes'] }
		)
	]
};
