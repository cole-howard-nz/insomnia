import type { EvidenceKind } from './config';

/** One recording or note on a stop, as the client sees it. Never carries the storage key. */
export interface EvidenceItem {
	id: string;
	stopId: number;
	kind: EvidenceKind;
	/** The stop's level when this was attached. */
	levelAt: number;
	note: string;
	mime: string | null;
	bytes: number;
	durationSeconds: number | null;
	createdAt: string;
}

export interface LevelEventItem {
	fromLevel: number;
	toLevel: number;
	createdAt: string;
}

export interface StopEvidence {
	items: EvidenceItem[];
	levels: LevelEventItem[];
	usedBytes: number;
	limitBytes: number;
}
