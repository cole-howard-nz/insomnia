/* eslint-disable svelte/prefer-svelte-reactivity -- the Sets and Dates here are values built and replaced, never mutated in place */
import { getContext, setContext } from 'svelte';
import type { CurriculumData, StopModel } from '$lib/curriculum/model';
import { calcLevel } from './logic';
import type { ProgressSnapshot, StopProgress } from './model';
import { derive } from './snapshot';
import { summarise } from './summary';
import { suggest } from './suggest';
import { indexCurriculum } from '$lib/curriculum/model';

/**
 * The user's progress on the client. One per app layout (a context, not a module
 * singleton, so the server never shares it between requests). Ticks apply here at once
 * and the request follows, so the level changes the moment the box does.
 */
export class ProgressStore {
	data = $state.raw<CurriculumData>({ regions: [], stops: [], links: [] });
	snapshot = $state.raw<ProgressSnapshot>({ stops: [], criteriaDone: [] });
	now = $state(0);

	index = $derived(indexCurriculum(this.data));
	derived = $derived(derive(this.data, this.snapshot, this.now));
	states = $derived(this.derived.states);
	summary = $derived(summarise(this.data, this.states));
	suggestions = $derived(
		suggest({
			index: this.index,
			states: this.states,
			touched: this.derived.touched,
			practiced: this.derived.practiced,
			now: this.now
		})
	);
	done = $derived(new Set(this.snapshot.criteriaDone));

	load(data: CurriculumData, snapshot: ProgressSnapshot, now: number) {
		this.data = data;
		this.snapshot = snapshot;
		this.now = now;
	}

	row(stopId: number): StopProgress | undefined {
		return this.snapshot.stops.find((r) => r.stopId === stopId);
	}

	#put(row: StopProgress, criteriaDone = this.snapshot.criteriaDone) {
		this.snapshot = {
			stops: [...this.snapshot.stops.filter((r) => r.stopId !== row.stopId), row],
			criteriaDone
		};
	}

	/** Ticks or unticks a criterion locally. Returns the level before and after. */
	tick(stop: StopModel, criterionId: number, done: boolean) {
		const at = Date.now();
		const iso = new Date(at).toISOString();
		const doneSet = new Set(this.snapshot.criteriaDone);
		if (done) doneSet.add(criterionId);
		else doneSet.delete(criterionId);
		const row = this.row(stop.id);
		const level = calcLevel(stop.criteria, doneSet, true);
		this.#put(
			{
				stopId: stop.id,
				bestBpm: row?.bestBpm ?? null,
				notes: row?.notes ?? '',
				level,
				updatedAt: iso,
				lastPracticedAt: done ? iso : (row?.lastPracticedAt ?? null)
			},
			[...doneSet]
		);
		this.now = at;
		return { from: row?.level ?? 0, to: level };
	}

	/** Unseen becomes Learning. */
	start(stopId: number) {
		if (this.row(stopId)) return;
		const iso = new Date().toISOString();
		this.#put({
			stopId,
			level: 1,
			lastPracticedAt: null,
			updatedAt: iso,
			bestBpm: null,
			notes: ''
		});
	}

	saveDetails(stopId: number, patch: { notes?: string; bestBpm?: number | null }) {
		this.start(stopId);
		const row = this.row(stopId)!;
		this.#put({ ...row, ...patch, updatedAt: new Date().toISOString() });
	}
}

const KEY = Symbol('progress');
export const setProgressContext = (store: ProgressStore) => setContext(KEY, store);
export const getProgressContext = () => getContext<ProgressStore>(KEY);
