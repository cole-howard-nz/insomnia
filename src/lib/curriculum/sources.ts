import { chords } from './regions/chords';
import { foundations } from './regions/foundations';
import { lead } from './regions/lead';
import { rhythm } from './regions/rhythm';
import { songs } from './regions/songs';
import { theory } from './regions/theory';
import { tone } from './regions/tone';
import type { RegionSource } from './schema';

/** Every region, in map order. To add a stop, edit its region file. */
export const sources: RegionSource[] = [foundations, chords, rhythm, lead, theory, tone, songs];
