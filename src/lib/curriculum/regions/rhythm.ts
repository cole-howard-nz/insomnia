import { drill, stop, yt } from '../author';
import type { RegionSource } from '../schema';

export const rhythm: RegionSource = {
	slug: 'rhythm',
	name: 'rhythm',
	blurb: 'the right hand, and the clock. most of what sounds good is just being on time.',
	stops: [
		stop(
			'metronome-timing',
			'timing with a metronome',
			'play against a click until the click stops feeling like an enemy. everything else leans on this.',
			[
				['play quarter notes on one chord with the click at 60 bpm, staying with it for a minute.'],
				['play eighth notes on a chord with the click at 80 bpm and stay on it for three minutes.'],
				['play along with the click set to only beat 1 or 3 of each bar, and stay locked in.']
			],
			[drill('metronome practice guitar beginners 60 bpm')],
			{ bpm: 80, helpedBy: ['holding-a-pick'] }
		),
		stop(
			'downstroke-strumming',
			'steady downstrokes',
			'one downstroke per beat, relaxed wrist, even volume. the base of every strumming pattern.',
			[
				['strum a chord four times per bar, evenly, at 60 bpm.'],
				['play steady downstrokes for two minutes at 90 bpm, staying even.'],
				['play steady downstrokes at 120 bpm through a chord change, cold.']
			],
			[yt('guitar strumming for beginners downstrokes')],
			{
				bpm: 120,
				helpedBy: ['holding-a-pick', 'open-chords-em-am'],
				unlockedBy: ['metronome-timing']
			}
		),
		stop(
			'strumming-patterns',
			'strumming patterns',
			'down-down-up-up-down-up and its relatives. the hand keeps moving, and you choose which strums to hit.',
			[
				['play D DU UDU on one chord at 70 bpm.'],
				['play three different patterns across a chord change at 80 bpm, clean.'],
				['pick a pattern for a new song by ear and play it through cold.']
			],
			[yt('guitar strumming patterns for beginners')],
			{ bpm: 100, helpedBy: ['downstroke-strumming'], unlockedBy: ['chord-changes'] }
		),
		stop(
			'muted-strums',
			'muted strums and chucks',
			'lay the fretting hand across the strings for a percussive click. the rhythm guitar gets a snare.',
			[
				['play a percussive chuck on beats 2 and 4 of a strum.'],
				['keep a strumming pattern with chucks going for a minute at 80 bpm.'],
				['add chucks to a whole song without breaking the strumming.']
			],
			[yt('guitar chucks muted strumming technique')],
			{ bpm: 90, helpedBy: ['strumming-patterns'] }
		),
		stop(
			'palm-muting',
			'palm muting',
			'rest the edge of the picking hand on the bridge. tight, chugging, and very punk.',
			[
				['find the spot on the bridge that gives a tight chug on the low strings.'],
				['play palm muted eighth notes at 100 bpm, clean for a minute.'],
				['switch between muted and open notes in a riff at 120 bpm, cold.']
			],
			[yt('palm muting guitar for beginners')],
			{ bpm: 120, helpedBy: ['power-chords', 'downstroke-strumming'] }
		),
		stop(
			'alternate-picking',
			'alternate picking',
			'down, up, down, up. the picking hand as a pendulum that never stops moving.',
			[
				['play one string in alternating down and up strokes at 60 bpm.'],
				['play a pattern across two strings at 100 bpm, clean.'],
				['play sixteenth notes on a riff at 100 bpm for a minute, cold.']
			],
			[drill('alternate picking exercise guitar beginners')],
			{ bpm: 100, helpedBy: ['holding-a-pick', 'metronome-timing'] }
		),
		stop(
			'syncopation',
			'syncopation',
			'stressing the off-beats, leaving gaps where the beat should land. it is what makes strumming groove.',
			[
				['clap a syncopated rhythm along with a metronome.'],
				['strum a syncopated pattern with a missing downbeat at 80 bpm.'],
				['play a syncopated pattern while changing chords, cold.']
			],
			[yt('syncopation guitar strumming beginners')],
			{ bpm: 90, helpedBy: ['strumming-patterns'], unlockedBy: ['metronome-timing'] }
		),
		stop(
			'fingerpicking-patterns',
			'fingerpicking patterns',
			'thumb on the bass, fingers on the top. arpeggios that turn any chord into a small song.',
			[
				['pick a four-string pattern on one open chord slowly and evenly.'],
				['play the pattern through a chord change at 70 bpm, clean.'],
				['play a different fingerpicking pattern over a full progression, cold.']
			],
			[yt('fingerpicking patterns for beginners guitar')],
			{ bpm: 80, helpedBy: ['open-chords-em-am', 'metronome-timing'] }
		),
		stop(
			'odd-time',
			'odd time signatures',
			'6/8, 5/4, 7/8. counting differently until the lopsided feeling stops feeling lopsided.',
			[
				['count 6/8 and 5/4 out loud along with a click.'],
				['play a chord riff in 6/8 and another in 5/4 at 70 bpm, clean.'],
				['play a riff in 7/8 without losing the count, cold.']
			],
			[yt('odd time signatures guitar 5/4 7/8 6/8')],
			{ bpm: 100, helpedBy: ['syncopation', 'strumming-patterns'] }
		)
	]
};
