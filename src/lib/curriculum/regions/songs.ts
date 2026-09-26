import { stop, tabs, yt } from '../author';
import type { RegionSource } from '../schema';

// Songs are stops with kind = song. They link to the skills they need, so the
// map shows what to work on before (or while) learning them.

export const songs: RegionSource = {
	slug: 'songs',
	name: 'songs',
	blurb: 'real songs, roughly easy to hard. the point of all of it.',
	stops: [
		stop(
			'knockin-on-heavens-door',
			"knockin' on heaven's door",
			'bob dylan. four chords, slow, and forgiving. a good first whole song.',
			[
				['play the verse chord pattern with pauses at the changes.'],
				['play the whole song with the recording without stopping.'],
				['play and sing the whole song from memory, cold.']
			],
			[tabs("knockin' on heaven's door bob dylan"), yt("knockin' on heaven's door guitar lesson")],
			{
				kind: 'song',
				bpm: 70,
				helpedBy: ['open-chords-cgd', 'chord-changes'],
				unlockedBy: ['strumming-patterns']
			}
		),
		stop(
			'good-riddance',
			'good riddance',
			'green day. an open-chord fingerpicked song that sounds like more than it is.',
			[
				['play the chords with a slow strum.'],
				['play the picking pattern through the whole song at 70 bpm.'],
				['play the whole song in one take, cold.']
			],
			[tabs('good riddance time of your life green day'), yt('good riddance guitar lesson')],
			{
				kind: 'song',
				bpm: 95,
				helpedBy: ['open-chords-cgd', 'fingerpicking-patterns'],
				unlockedBy: ['chord-changes']
			}
		),
		stop(
			'basket-case',
			'basket case',
			'green day. power chords and speed, done in a couple of hours of stubbornness.',
			[
				['play the verse riff slowly with clean chord changes.'],
				['play the whole song at 90 percent of the recorded tempo.'],
				['play the whole song at full tempo without stopping, cold.']
			],
			[tabs('basket case green day'), yt('basket case guitar lesson')],
			{
				kind: 'song',
				bpm: 170,
				helpedBy: ['power-chords', 'palm-muting'],
				unlockedBy: ['downstroke-strumming']
			}
		),
		stop(
			'come-as-you-are',
			'come as you are',
			'nirvana. a one-string riff with a cool tone. good for clean single notes.',
			[
				['play the main riff slowly on one string.'],
				['play the riff at tempo, clean and in time, with the recording.'],
				['play the riff and the chords for the whole song, cold.']
			],
			[tabs('come as you are nirvana'), yt('come as you are nirvana guitar riff lesson')],
			{
				kind: 'song',
				bpm: 120,
				helpedBy: ['clean-single-notes', 'reading-tab'],
				unlockedBy: ['power-chords']
			}
		),
		stop(
			'the-middle',
			'the middle',
			'jimmy eat world. bright power chords and a very good chorus.',
			[
				['play the intro riff slowly with palm muting.'],
				['play the verse and chorus with the recording.'],
				['play the whole song at tempo without stopping, cold.']
			],
			[tabs('the middle jimmy eat world'), yt('the middle jimmy eat world guitar lesson')],
			{
				kind: 'song',
				bpm: 162,
				helpedBy: ['power-chords', 'palm-muting'],
				unlockedBy: ['strumming-patterns']
			}
		),
		stop(
			'follow-you-into-the-dark',
			'follow you into the dark',
			'death cab for cutie. a quiet, sad open-chord song, capo optional.',
			[
				['play the chords with a slow strum and clean changes.'],
				['play the whole song with the correct strum and pauses.'],
				['play and sing the whole song quietly, cold.']
			],
			[
				tabs('i will follow you into the dark death cab'),
				yt('i will follow you into the dark guitar lesson')
			],
			{
				kind: 'song',
				bpm: 75,
				helpedBy: ['open-chords-cgd', 'capo-basics'],
				unlockedBy: ['strumming-patterns']
			}
		),
		stop(
			'say-it-aint-so',
			"say it ain't so",
			'weezer. barre chords, palm muting and a riff that wanders. a good test of stamina.',
			[
				['play the riff slowly and the verse chords with pauses.'],
				['play the whole song at 90 percent tempo with the recording.'],
				['play the whole song at tempo, cold.']
			],
			[tabs("say it ain't so weezer"), yt("say it ain't so weezer guitar lesson")],
			{
				kind: 'song',
				bpm: 76,
				helpedBy: ['barre-f-shape', 'barre-a-shape'],
				unlockedBy: ['palm-muting']
			}
		),
		stop(
			'wonderwall',
			'wonderwall',
			'oasis. capo on 2, sus chords, and a strumming pattern to get right. everyone learns it anyway.',
			[
				['play the four chord shapes with the capo and switch slowly.'],
				['play the whole song with the right strumming pattern at 80 bpm.'],
				['play and sing it in one take, cold, without pausing.']
			],
			[tabs('wonderwall oasis'), yt('wonderwall oasis guitar lesson')],
			{
				kind: 'song',
				bpm: 87,
				helpedBy: ['sus-and-add', 'capo-basics', 'strumming-patterns'],
				unlockedBy: ['chord-changes']
			}
		),
		stop(
			'blackbird',
			'blackbird',
			'the beatles. fingerpicked in G, with a melody over a bass line. a real step up.',
			[
				['play the first section slowly, one hand at a time.'],
				['play the whole song at 70 bpm with a steady thumb.'],
				['play the whole song at the recorded tempo, cold.']
			],
			[tabs('blackbird beatles'), yt('blackbird beatles guitar lesson')],
			{
				kind: 'song',
				bpm: 94,
				helpedBy: ['fingerpicking-patterns', 'reading-tab'],
				unlockedBy: ['open-chords-cgd']
			}
		),
		stop(
			'never-meant',
			'never meant',
			'american football. the twinkly song, in odd time, all hammer-ons and ringing open strings. a long way off.',
			[
				['play the opening figure slowly, hammering and pulling in time.'],
				['play the main verse with the recording at 80 percent tempo.'],
				['play the whole song at tempo, cold, keeping the odd count.']
			],
			[tabs('never meant american football'), yt('never meant american football guitar lesson')],
			{
				kind: 'song',
				bpm: 130,
				helpedBy: ['twinkly-picking', 'odd-time', 'ringing-open-shapes'],
				unlockedBy: ['tapping']
			}
		)
	]
};
