import { drill, stop, wiki, yt } from '../author';
import type { RegionSource } from '../schema';

export const theory: RegionSource = {
	slug: 'theory',
	name: 'theory',
	blurb: 'why things sound the way they do. optional, and it quietly makes everything else faster.',
	stops: [
		stop(
			'fretboard-notes',
			'notes on the low strings',
			'the names of the notes along the low E and A strings. the seed of every chord shape.',
			[
				['name the notes on the 6th and 5th strings up to fret 12.'],
				['find any named note on the 6th and 5th strings in under three seconds.'],
				['play any named note on the two strings without thinking, cold.']
			],
			[yt('learn the notes on the guitar fretboard low E and A strings')],
			{ helpedBy: ['reading-tab'] }
		),
		stop(
			'fretboard-all',
			'notes across the neck',
			'all six strings, all the way up. tedious, and a bit like learning a map of a town you live in.',
			[
				['name the notes on all six strings up to fret 12, slowly.'],
				['find any named note on any string in under three seconds.'],
				['name a random fretted note instantly, cold.']
			],
			[drill('fretboard memorization exercise guitar')],
			{ helpedBy: ['fretboard-notes'] }
		),
		stop(
			'major-scale',
			'major scale',
			'whole, whole, half, whole, whole, whole, half. the pattern the rest of music is measured against.',
			[
				['play the C major scale in open position, saying each note name.'],
				['play a major scale in two positions, ascending and descending, at 70 bpm.'],
				['play major scales from any root note without thinking, cold.']
			],
			[yt('major scale guitar lesson beginners')],
			{ bpm: 70, helpedBy: ['fretboard-notes'], unlockedBy: ['clean-single-notes'] }
		),
		stop(
			'intervals',
			'intervals',
			'the distance between two notes. how a third, a fifth and an octave sound and feel on the neck.',
			[
				['name the interval between two notes on the neck.'],
				['play a named interval from any root note.'],
				['hear an interval and name it, in a song, cold.']
			],
			[wiki('interval music')],
			{ helpedBy: ['major-scale'] }
		),
		stop(
			'chord-construction',
			'chord construction',
			'chords are stacked thirds. a major chord is the 1st, 3rd and 5th of the scale.',
			[
				['build a major and minor triad from a major scale.'],
				['name the notes in any major, minor or seventh chord.'],
				['spell any chord from memory, then play it in two ways, cold.']
			],
			[yt('how chords are constructed music theory guitar')],
			{ helpedBy: ['major-scale', 'intervals'] }
		),
		stop(
			'keys-and-progressions',
			'keys and progressions',
			'which chords live together. the I, IV, V, vi and why four chords cover so many songs.',
			[
				['name the chords in a major key using roman numerals.'],
				['transpose a four-chord progression into two other keys.'],
				['work out the key and progression of a song by ear, cold.']
			],
			[yt('chord progressions and keys explained guitar')],
			{ helpedBy: ['chord-construction'], unlockedBy: ['chord-changes'] }
		),
		stop(
			'caged',
			'caged system',
			'five open chord shapes, moved up the neck, joining the whole fretboard together.',
			[
				['play a C major chord in all five CAGED shapes.'],
				['link the five shapes in order up the neck for two chords.'],
				['play a full progression using different CAGED positions, cold.']
			],
			[yt('CAGED system guitar explained')],
			{ helpedBy: ['fretboard-all', 'barre-f-shape'], unlockedBy: ['chord-construction'] }
		),
		stop(
			'modes',
			'modes',
			'the same seven notes with a different home. later, and only if it is interesting.',
			[
				['play dorian and mixolydian over a drone note.'],
				['name the parent major scale for each mode.'],
				['write a short melody in a chosen mode and play it, cold.']
			],
			[wiki('musical mode')],
			{ helpedBy: ['major-scale', 'keys-and-progressions'], unlockedBy: ['caged'] }
		)
	]
};
