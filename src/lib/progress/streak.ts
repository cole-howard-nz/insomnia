// Dates here are local calendar days as YYYY-MM-DD strings, so a session at 1am counts
// for the day the player was in. Compared and sorted as plain strings.

const DAY_MS = 86_400_000;

/** Today's date in a timezone. Falls back to UTC for an unknown one. */
export function todayIn(timeZone: string, now = Date.now()): string {
	try {
		return new Intl.DateTimeFormat('en-CA', {
			timeZone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		}).format(now);
	} catch {
		return new Date(now).toISOString().slice(0, 10);
	}
}

const toUtc = (date: string) => Date.parse(`${date}T00:00:00Z`);
const fromUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export const addDays = (date: string, n: number) => fromUtc(toUtc(date) + n * DAY_MS);

/** The Monday of the week a date is in. */
export function weekStart(date: string): string {
	const day = new Date(toUtc(date)).getUTCDay(); // 0 is Sunday
	return addDays(date, -((day + 6) % 7));
}

export interface StreakSummary {
	/** Days practised so far this week (Monday to Sunday). */
	daysThisWeek: number;
	target: number;
	/** Consecutive days practised, still alive if the last one was yesterday. */
	dayStreak: number;
	/** Consecutive weeks that met the target. This week counts once it meets it, never breaks the run before. */
	weekStreak: number;
	/** Minutes logged this week. */
	minutesThisWeek: number;
}

export function summariseStreak(
	sessions: readonly { practicedOn: string; minutes: number }[],
	today: string,
	target: number
): StreakSummary {
	const days = new Set(sessions.map((s) => s.practicedOn));
	const thisWeek = weekStart(today);

	const daysIn = (start: string) => {
		let n = 0;
		for (let i = 0; i < 7; i++) if (days.has(addDays(start, i))) n++;
		return n;
	};

	// Day streak: gentle about today, so it is still alive until the day is over.
	let dayStreak = 0;
	let cursor = days.has(today) ? today : addDays(today, -1);
	while (days.has(cursor)) {
		dayStreak++;
		cursor = addDays(cursor, -1);
	}

	// Week streak: an unfinished current week neither counts nor breaks the run.
	const daysThisWeek = daysIn(thisWeek);
	let weekStreak = daysThisWeek >= target ? 1 : 0;
	const earliest = [...days].sort()[0];
	let week = addDays(thisWeek, -7);
	while (earliest !== undefined && week >= weekStart(earliest) && daysIn(week) >= target) {
		weekStreak++;
		week = addDays(week, -7);
	}

	const minutesThisWeek = sessions
		.filter((s) => s.practicedOn >= thisWeek && s.practicedOn <= addDays(thisWeek, 6))
		.reduce((sum, s) => sum + s.minutes, 0);

	return { daysThisWeek, target, dayStreak, weekStreak, minutesThisWeek };
}
