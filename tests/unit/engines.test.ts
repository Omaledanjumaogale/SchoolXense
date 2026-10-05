import { describe, it, expect } from 'vitest';
import { pCorrect, updateAbility, pickNextItem } from '../../src/lib/engines/irt';
import { review, newCard, DAY } from '../../src/lib/engines/sm2';
import { waecGrade, jambBand, batchScore } from '../../src/lib/engines/grading';
import { split, splitByRules, HIVE_SHARE } from '../../src/lib/engines/hiveShare';
import { screen } from '../../src/lib/engines/integrity';
import { estimateReadiness } from '../../src/lib/engines/readiness';
import { verifyWebhookHash, matchesPending } from '../../src/lib/payments/flutterwave';

describe('Forge IRT', () => {
	it('p = 0.5 when theta equals difficulty', () => expect(pCorrect(0.3, 1.2, 0.3)).toBeCloseTo(0.5));
	it('correct answers raise ability, wrong lower it', () => {
		expect(updateAbility(0, 1, 0, true, 0)).toBeGreaterThan(0);
		expect(updateAbility(0, 1, 0, false, 0)).toBeLessThan(0);
	});
	it('steps shrink with evidence', () => {
		const early = updateAbility(0, 1, 0, true, 0), late = updateAbility(0, 1, 0, true, 100);
		expect(early).toBeGreaterThan(late);
	});
	it('identifies a weak topic within 20 simulated answers', () => {
		const items = Array.from({ length: 40 }, (_, i) => ({ id: 'i' + i, topic: i % 2 ? 'Optics' : 'Waves', a: 1.2, b: ((i % 7) - 3) / 2 }));
		const truth: Record<string, number> = { Optics: -1.5, Waves: 1.0 };
		const m: Record<string, { theta: number; answered: number }> = {};
		const seen = new Set<string>();
		for (let n = 0; n < 20; n++) {
			const it = pickNextItem(items, m, seen, n % 2 ? { topic: 'Waves' } : {})!;
			seen.add(it.id);
			const row = (m[it.topic] ??= { theta: 0, answered: 0 });
			const correct = pCorrect(truth[it.topic], it.a, it.b) > 0.5;
			row.theta = updateAbility(row.theta, it.a, it.b, correct, row.answered++);
		}
		expect(m.Optics.theta).toBeLessThan(m.Waves.theta);
	});
});

describe('SM-2', () => {
	it('schedules 1, 6, then EF-scaled days', () => {
		let c = newCard(0);
		c = review(c, 5, 0); expect(c.interval).toBe(1);
		c = review(c, 5, 0); expect(c.interval).toBe(6);
		c = review(c, 5, 0); expect(c.interval).toBeGreaterThan(12);
	});
	it('lapses reset to 1 day and EF never drops below 1.3', () => {
		let c = { easiness: 1.31, interval: 30, repetitions: 5, dueAt: 0 };
		c = review(c, 0, 0);
		expect(c.interval).toBe(1);
		expect(c.dueAt).toBe(DAY);
		expect(c.easiness).toBeGreaterThanOrEqual(1.3);
	});
});

describe('Grading', () => {
	it('maps WAEC boundaries exactly', () => {
		expect(waecGrade(75).grade).toBe('A1');
		expect(waecGrade(74).grade).toBe('B2');
		expect(waecGrade(50).grade).toBe('C6');
		expect(waecGrade(49).grade).toBe('D7');
		expect(waecGrade(0).grade).toBe('F9');
	});
	it('JAMB bands', () => expect(jambBand(255).band).toBe('250–299'));
	it('batch scoring', () => expect(batchScore([0, 1, null, 2], [0, 2, 1, 2])).toEqual({ right: 2, wrong: 1, skipped: 1, pct: 50 }));
});

describe('Hive Share', () => {
	it('every table sums to 100%', () => {
		for (const t of Object.values(HIVE_SHARE)) expect(Object.values(t).reduce((a, b) => a + (b ?? 0), 0)).toBe(10_000);
	});
	it('session split sums to the kobo and pays 80% to the earner', () => {
		const s = split({ kind: 'session', grossKobo: 187_501, hasReferrer: true, hasCollabPartner: true });
		expect(Object.values(s).reduce((a, b) => a + b, 0)).toBe(187_501);
		expect(s.earner).toBe(150_000);
		expect(s.collab).toBe(3_750);
	});
	it('unattributed slices return to platform', () => {
		const s = split({ kind: 'session', grossKobo: 100_000 });
		expect(s.referrer + s.collab).toBe(0);
		expect(s.platform).toBe(17_000);
	});
	it('subscription funds the 10% royalty pool', () => expect(split({ kind: 'subscription', grossKobo: 200_000 }).royalty).toBe(20_000));
	it('licence renewals pay 5% to ambassadors', () => expect(split({ kind: 'licence', grossKobo: 1_000_000, hasReferrer: true, renewal: true }).referrer).toBe(50_000));
	it('split rules pay co-hosts exactly to the kobo', () => {
		const parts = splitByRules(1_000_001, [{ memberId: 'a', bp: 3000 }, { memberId: 'b', bp: 2500 }, { memberId: 'c', bp: 2500 }, { memberId: 'd', bp: 2000 }]);
		expect(parts.reduce((s, p) => s + p.kobo, 0)).toBe(1_000_001);
	});
	it('rejects split rules that do not sum to 100%', () => expect(() => splitByRules(100, [{ memberId: 'a', bp: 9000 }])).toThrow());
});

describe('Integrity classifier', () => {
	const blocked = ['Please write my assignment on supply chains', 'can you do my homework for tomorrow', 'I need someone to complete my project report', 'pay someone to write my thesis', 'help me paraphrase this to beat turnitin', 'do you have jamb expo answers', 'write my term paper for me', 'finish our seminar report'];
	const allowed = ['Explain optics ray diagrams', 'Check my working on question 4', 'Give feedback on my own essay draft', 'How do I structure my literature review?'];
	it('blocks ≥ 95% of the red-team set', () => {
		const rate = blocked.filter((t) => !screen(t).allowed).length / blocked.length;
		expect(rate).toBeGreaterThanOrEqual(0.95);
	});
	it('allows genuine learning requests', () => allowed.forEach((t) => expect(screen(t).allowed).toBe(true)));
	it('detects shared phone numbers', () => expect(screen('call me on 08031234567').contactShared).toBe(true));
});

describe('Readiness', () => {
	it('narrows with evidence and stays in range', () => {
		const a = estimateReadiness({ mastery: 0.6, coverage: 0.5, mocks: [], answered: 5 });
		const b = estimateReadiness({ mastery: 0.6, coverage: 0.5, mocks: [60, 62], answered: 400 });
		expect(b.highPct - b.lowPct).toBeLessThan(a.highPct - a.lowPct);
		expect(b.confidence).toBeGreaterThan(a.confidence);
	});
});

describe('Flutterwave', () => {
	it('verifies the webhook hash in constant time', () => {
		expect(verifyWebhookHash('abc123', 'abc123')).toBe(true);
		expect(verifyWebhookHash('abc124', 'abc123')).toBe(false);
		expect(verifyWebhookHash(null, 'abc123')).toBe(false);
	});
	it('only settles when amount, currency and tx_ref match', () => {
		const tx = { id: '1', txRef: 'SH-1', status: 'successful' as const, amountKobo: 100_00, currency: 'NGN' };
		expect(matchesPending(tx, { txRef: 'SH-1', amountKobo: 100_00, currency: 'NGN' })).toBe(true);
		expect(matchesPending({ ...tx, amountKobo: 50_00 }, { txRef: 'SH-1', amountKobo: 100_00, currency: 'NGN' })).toBe(false);
	});
});
