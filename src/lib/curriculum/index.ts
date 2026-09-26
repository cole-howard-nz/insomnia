import layoutJson from './layout.json' with { type: 'json' };
import { validateCurriculum, type Curriculum, type Layout } from './schema';
import { sources } from './sources';

export const layout: Layout = layoutJson;

/** The validated base curriculum. Throws at import if the data is broken. */
export const curriculum: Curriculum = validateCurriculum(sources, layout);
