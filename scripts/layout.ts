// Regenerates src/lib/curriculum/layout.json. Run with: npm run curriculum:layout
import { writeFileSync } from 'node:fs';
import { computeLayout } from '../src/lib/curriculum/layout.ts';
import { validateCurriculum } from '../src/lib/curriculum/schema.ts';
import { sources } from '../src/lib/curriculum/sources.ts';

const layout = computeLayout(validateCurriculum(sources));
writeFileSync(
	new URL('../src/lib/curriculum/layout.json', import.meta.url),
	JSON.stringify(layout, null, '\t') + '\n'
);
console.log(
	`laid out ${Object.keys(layout.regions).length} regions, ${Object.keys(layout.stops).length} stops.`
);
