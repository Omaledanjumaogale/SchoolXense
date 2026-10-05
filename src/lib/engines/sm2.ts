/**
 * Spaced repetition — SM-2 schedule for the review queue.
 * quality: 0–5 (5 perfect recall, <3 = lapse).
 */
export interface ReviewCard {
	easiness: number; // EF ≥ 1.3
	interval: number; // days
	repetitions: number;
	dueAt: number; // epoch ms
}

export const DAY = 86_400_000;

export const newCard = (now = Date.now()): ReviewCard => ({ easiness: 2.5, interval: 0, repetitions: 0, dueAt: now });

export function review(card: ReviewCard, quality: number, now = Date.now()): ReviewCard {
	const q = Math.max(0, Math.min(5, Math.round(quality)));
	let { easiness, interval, repetitions } = card;
	if (q < 3) {
		repetitions = 0;
		interval = 1;
	} else {
		repetitions += 1;
		interval = repetitions === 1 ? 1 : repetitions === 2 ? 6 : Math.round(interval * easiness);
	}
	easiness = Math.max(1.3, easiness + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
	return { easiness: +easiness.toFixed(3), interval, repetitions, dueAt: now + interval * DAY };
}

/** Quality from a practice answer: wrong → 2, correct slow → 4, correct fast → 5. */
export const qualityFromAnswer = (correct: boolean, ms: number) => (!correct ? 2 : ms > 45_000 ? 4 : 5);

/** Daily load cap: ~1 card per minute of the learner's chosen study time. */
export const dailyCap = (minutes: number) => Math.max(5, Math.round(minutes));
