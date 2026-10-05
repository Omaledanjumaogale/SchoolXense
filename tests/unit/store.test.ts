import { describe, it, expect, vi } from 'vitest';
vi.mock('$lib/config', () => ({ DEMO_MODE: true }));
import { hive } from '../../src/lib/hive/store.svelte';

describe('Hive store (demo backend)', () => {
	it('seeded history keeps the double-entry ledger balanced to zero', () => {
		const r = hive.reconciliation();
		expect(r.balanced).toBe(true);
		expect(r.mismatch).toBe(false);
	});
	it('tutors earn from released sessions; escrow holds pending work', () => {
		const w = hive.wallet('u_tunde');
		expect(w.available + w.paidOut).toBeGreaterThan(0);
		expect(hive.wallet('u_chidi').inEscrow).toBeGreaterThan(0);
	});
	it('minors cannot take earning actions', () => {
		hive.loginAs('u_ada');
		expect(() => hive.requestPayout(500_000)).toThrow(/18\+/);
	});
	it('integrity screen blocks assessed-work bookings and logs a flag', () => {
		hive.loginAs('u_zainab');
		const before = hive.db.integrityFlags.length;
		expect(() => hive.bookingsCreate({ offerId: 'o_chidi_mth', topic: 'Algebra', slot: 'Fri 16:00', minutes: 45, note: 'please do my assignment for me' })).toThrow();
		expect(hive.db.integrityFlags.length).toBe(before + 1);
	});
	it('full booking flow: pay → escrow → deliver → confirm → release, ledger still balanced', () => {
		hive.loginAs('u_zainab');
		const b = hive.bookingsCreate({ offerId: 'o_kemi_res', topic: 'Research design', slot: 'Mon 10:00', minutes: 45 });
		const p = hive.checkoutBooking(b.id);
		hive.completePayment(p.id, 'card');
		expect(hive.booking(b.id)!.status).toBe('confirmed');
		const before = hive.wallet('u_kemi').available;
		hive.loginAs('u_kemi');
		hive.bookingsDeliver(b.id);
		hive.loginAs('u_zainab');
		hive.bookingsConfirm(b.id, 5, 'Great');
		expect(hive.wallet('u_kemi').available - before).toBe(Math.floor(b.priceKobo * 0.8));
		expect(hive.reconciliation().balanced).toBe(true);
	});
	it('minors only see tutors approved for minors', () => {
		hive.loginAs('u_ada');
		expect(() => hive.bookingsCreate({ offerId: 'o_kemi_res', topic: 'Research design', slot: 'Mon', minutes: 45 })).toThrow(/under-18/);
	});
	it('minor bookings over the guardian spending limit wait for consent', () => {
		hive.user('u_ngozi')!.spendingLimitKobo = 100_000;
		hive.loginAs('u_ada');
		const b = hive.bookingsCreate({ offerId: 'o_tunde_phy', topic: 'Optics', slot: 'Fri 16:00', minutes: 45 });
		expect(b.status).toBe('awaiting_consent');
		hive.loginAs('u_ngozi');
		const c = hive.db.consents.find((x) => x.refId === b.id)!;
		hive.consentDecide(c.id, true);
		expect(hive.booking(b.id)!.status).toBe('pending_payment');
		expect(hive.db.threads.find((t) => t.id === b.threadId)!.participants).toContain('u_ngozi');
	});
	it('adaptive practice serves, grades and updates mastery', () => {
		hive.loginAs('u_zainab');
		const id = hive.practiceStart('campus', 'csc101', 'drill', { target: 3 });
		const q = hive.practiceNext(id)!;
		const r = hive.practiceAnswer(id, q.id, q.answer, 5000);
		expect(r.correct).toBe(true);
		expect(hive.masteryFor('u_zainab', 'campus', 'csc101').some((m) => m.answered > 0)).toBe(true);
	});
});
