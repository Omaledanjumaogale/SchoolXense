/**
 * Forge adaptive engine — 2-parameter IRT with an Elo-style online update.
 * Deterministic and explainable: no model call per question.
 */
export const pCorrect = (theta: number, a: number, b: number) => 1 / (1 + Math.exp(-a * (theta - b)));

/** Big steps early, small steps later. */
export function stepSize(answered: number) {
	return Math.max(0.15, 0.6 / Math.sqrt(1 + answered));
}

export function updateAbility(theta: number, a: number, b: number, correct: boolean, answered: number) {
	const k = stepSize(answered);
	const next = theta + k * a * ((correct ? 1 : 0) - pCorrect(theta, a, b));
	return Math.max(-4, Math.min(4, next));
}

/** Fisher information of an item at ability theta (2PL). */
export const information = (theta: number, a: number, b: number) => {
	const p = pCorrect(theta, a, b);
	return a * a * p * (1 - p);
};

export interface ItemLike { id: string; topic: string; a: number; b: number }

/**
 * Next item: on the weakest topic, the unseen item whose difficulty b is closest
 * to theta (ties broken by information).
 */
export function pickNextItem<T extends ItemLike>(
	items: T[],
	mastery: Record<string, { theta: number; answered: number }>,
	seen: Set<string>,
	opts: { topic?: string } = {}
): T | undefined {
	const pool = items.filter((i) => !seen.has(i.id));
	if (!pool.length) return undefined;
	const topics = [...new Set(pool.map((i) => i.topic))];
	const weakest =
		opts.topic && topics.includes(opts.topic)
			? opts.topic
			: topics.sort((x, y) => (mastery[x]?.theta ?? 0) - (mastery[y]?.theta ?? 0) || (mastery[x]?.answered ?? 0) - (mastery[y]?.answered ?? 0))[0];
	const theta = mastery[weakest]?.theta ?? 0;
	return pool
		.filter((i) => i.topic === weakest)
		.sort((x, y) => Math.abs(x.b - theta) - Math.abs(y.b - theta) || information(theta, y.a, y.b) - information(theta, x.a, x.b))[0];
}

/** Map theta (≈ -3..3) to a 0–100 mastery percentage for display. */
export const thetaToPct = (theta: number) => Math.round(100 * pCorrect(theta, 1.2, 0));
