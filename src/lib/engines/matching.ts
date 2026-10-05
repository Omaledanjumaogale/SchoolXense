/**
 * Matching — ranks offers for a need. Rotates newly verified tutors into
 * results so newcomers can earn.
 */
export interface Matchable { id: string; subjects: string[]; topics: string[]; level: string[]; languages: string[]; priceKobo: number; rating: number; completion: number; sessions: number; verifiedAt: number }
export interface Need { subject?: string; topic?: string; level?: string; language?: string; budgetKobo?: number }

export function score(o: Matchable, n: Need, now = Date.now()) {
	let s = 0;
	if (n.subject && o.subjects.some((x) => x.toLowerCase() === n.subject!.toLowerCase())) s += 40;
	if (n.topic && o.topics.some((x) => x.toLowerCase().includes(n.topic!.toLowerCase()))) s += 20;
	if (n.level && o.level.includes(n.level)) s += 10;
	if (n.language && o.languages.includes(n.language)) s += 6;
	if (n.budgetKobo) s += o.priceKobo <= n.budgetKobo ? 8 : -Math.min(20, ((o.priceKobo - n.budgetKobo) / n.budgetKobo) * 20);
	s += (o.rating - 4) * 12 + o.completion * 10;
	const newcomer = o.sessions < 10 && now - o.verifiedAt < 45 * 86_400_000;
	if (newcomer) s += 9; // fairness boost
	return Math.round(s * 10) / 10;
}

export const rank = <T extends Matchable>(offers: T[], need: Need) =>
	offers.map((o) => ({ o, s: score(o, need) })).sort((a, b) => b.s - a.s).map((x) => x.o);
