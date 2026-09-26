import { HOURS_MILESTONES } from './config';

/** The hour milestones passed when total logged minutes went from `before` to `after`, in order. */
export function hoursCrossed(beforeMinutes: number, afterMinutes: number): number[] {
	return HOURS_MILESTONES.filter(
		(hours) => beforeMinutes < hours * 60 && afterMinutes >= hours * 60
	);
}
