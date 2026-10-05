/**
 * Hive client store — the demo-mode backend.
 *
 * Every method mirrors a Convex function in /convex (same names, same rules):
 *   auth.*, practice.*, review.*, readiness.*, bookings.*, money.*, payouts.*,
 *   cohorts.*, library.*, studio.*, royalties.*, collab.*, threads.*,
 *   referrals.*, tenants.*, hostedExams.*, ops.*, flags.*, notifications.*
 *
 * In demo mode the data lives in the browser (localStorage) so the whole hub is
 * explorable without keys. With PUBLIC_CONVEX_URL set, swap `hive` calls for the
 * Convex functions of the same name (see convex/README.md).
 */
import { browser } from '$app/environment';
import { DEMO_MODE } from '$lib/config';
import { pickNextItem, updateAbility, thetaToPct } from '$engines/irt';
import { newCard, review as sm2Review, qualityFromAnswer, DAY } from '$engines/sm2';
import { waecGrade, jambBand } from '$engines/grading';
import { estimateReadiness } from '$engines/readiness';
import { screen } from '$engines/integrity';
import { split, splitByRules, type TxnKind } from '$engines/hiveShare';
import { rank } from '$engines/matching';
import { SEED_QUESTIONS, bankFor, type Question } from './questions';
import { EXAMS, examById, type ModuleId } from './catalogue';
import * as S from './seed';
import type * as T from './types';

const KEY = 'hive.db.v3';
const uid = (p: string) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const today = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);

export interface DB {
	version: number;
	users: T.User[];
	questions: Question[];
	mastery: Record<string, T.MasteryRow>; // `${userId}|${exam}|${subject}|${topic}`
	attempts: T.Attempt[];
	reviewQueue: T.ReviewItem[];
	offers: T.Offer[];
	bookings: T.Booking[];
	payments: T.Payment[];
	escrows: T.Escrow[];
	ledger: T.LedgerEntry[];
	payouts: T.Payout[];
	cohorts: T.Cohort[];
	packs: T.Pack[];
	purchases: T.Purchase[];
	briefs: T.StudioBrief[];
	submissions: T.StudioSubmission[];
	teams: T.Team[];
	contracts: T.Contract[];
	tasks: T.Task[];
	threads: T.Thread[];
	messages: T.Message[];
	tenants: T.Tenant[];
	hostedExams: T.HostedExam[];
	proctorEvents: T.ProctorEvent[];
	invoices: T.Invoice[];
	notifications: T.Notification[];
	integrityFlags: T.IntegrityFlag[];
	reports: T.SafeguardReport[];
	tickets: T.SupportTicket[];
	referrals: T.Referral[];
	certificates: T.Certificate[];
	consents: T.Consent[];
	flags: T.FeatureFlag[];
	audit: T.AuditEntry[];
	verifications: T.Verification[];
}

export class HiveError extends Error {
	constructor(public code: string, message: string) { super(message); }
}

/* ───────────────────────────── seed + history ───────────────────────────── */
function freshDB(): DB {
	if(!DEMO_MODE)return {version:3,mastery:{},...Object.fromEntries(['users','questions','attempts','reviewQueue','offers','bookings','payments','escrows','ledger','payouts','cohorts','packs','purchases','briefs','submissions','teams','contracts','tasks','threads','messages','tenants','hostedExams','proctorEvents','invoices','notifications','integrityFlags','reports','tickets','referrals','certificates','consents','flags','audit','verifications'].map(key=>[key,[]]))} as DB;
	const now = Date.now();
	const db: DB = {
		version: 3,
		users: S.seedUsers(now),
		questions: structuredClone(SEED_QUESTIONS),
		mastery: {},
		attempts: [],
		reviewQueue: [],
		offers: S.seedOffers(now),
		bookings: [],
		payments: [],
		escrows: [],
		ledger: [],
		payouts: [],
		cohorts: S.seedCohorts(now),
		packs: S.seedPacks(now),
		purchases: [],
		briefs: S.seedBriefs(now),
		submissions: S.seedSubmissions(now),
		teams: S.seedTeams(now),
		contracts: S.seedContracts(now),
		tasks: S.seedTasks(now),
		threads: [],
		messages: [],
		tenants: S.seedTenants(now),
		hostedExams: S.seedHostedExams(now, SEED_QUESTIONS.filter((q) => q.subject === 'physics').map((q) => q.id)),
		proctorEvents: [],
		invoices: [],
		notifications: [],
		integrityFlags: [],
		reports: [],
		tickets: [],
		referrals: [],
		certificates: [],
		consents: [],
		flags: structuredClone(S.SEED_FLAGS),
		audit: [],
		verifications: []
	};
	return db;
}

/* ─────────────────────────────── the store ─────────────────────────────── */
class Hive {
	db = $state<DB>(freshDB());
	session = $state<{ userId: string | null; role: T.Role | null }>({ userId: null, role: null });
	ready = $state(false);
	private saveTimer: ReturnType<typeof setTimeout> | undefined;

	constructor() {
		if (!DEMO_MODE) return;
		if (!browser) { this.history(this.db); return; }
		// first visit: seed + persist immediately
		try {
			const raw = localStorage.getItem(KEY);
			if (raw) this.db = JSON.parse(raw);
			else { this.history(this.db); localStorage.setItem(KEY, JSON.stringify(this.db)); }
			const s = localStorage.getItem('hive.session');
			if (s) this.session = JSON.parse(s);
		} catch {
			this.db = freshDB();
			this.history(this.db);
		}
		this.ready = true;
		addEventListener('pagehide', () => this.flush());
		document.addEventListener('visibilitychange', () => { if (document.hidden) this.flush(); });
		this.cron();
		setInterval(() => this.cron(), 30_000);
	}

	private commit() {
		if (!browser || !DEMO_MODE) return;
		try { localStorage.setItem('hive.session', JSON.stringify(this.session)); } catch { /* private mode */ }
		clearTimeout(this.saveTimer);
		this.saveTimer = setTimeout(() => this.flush(), 120);
	}
	/** Persist now — also runs on pagehide so a reload never loses the last mutation. */
	flush() {
		if (!browser || !DEMO_MODE) return;
		clearTimeout(this.saveTimer);
		try { localStorage.setItem(KEY, JSON.stringify(this.db)); localStorage.setItem('hive.session', JSON.stringify(this.session)); } catch { /* quota — demo only */ }
	}

	resetDemo() {
		this.db = freshDB();
		this.history(this.db);
		this.commit();
	}

	/** Build a realistic, ledger-consistent history by replaying real flows with back-dated clocks. */
	private history(db: DB) {
		this.db = db;
		const now = Date.now();
		const at = (d: number, h = 0) => now - d * DAY + h * 3_600_000;
		// Ada's practice history (Forge)
		const physics = bankFor(db.questions, 'jamb', 'physics');
		const chem = bankFor(db.questions, 'jamb', 'chemistry');
		const pattern = [1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1];
		[physics, chem].forEach((bank, bi) => {
			bank.forEach((q, i) => {
				const correct = q.topic === 'Optics' ? i % 3 === 0 : pattern[(i + bi) % pattern.length] === 1;
				this._applyAnswer('u_ada', 'jamb', q.subject, q, correct ? q.answer : (q.answer + 1) % 4, 30_000, at(12 - (i % 10), bi));
			});
		});
		[52, 58, 61].forEach((pct, i) => db.attempts.push({ id: uid('at'), userId: 'u_ada', exam: 'jamb', subject: 'physics', mode: 'mock', target: 20, answers: [], startedAt: at(21 - i * 7), endedAt: at(21 - i * 7, 1), pct, grade: waecGrade(pct).grade }));
		db.attempts.push({ id: uid('at'), userId: 'u_emeka', exam: 'waec', subject: 'physics', mode: 'mock', target: 20, answers: [], startedAt: at(20), endedAt: at(20, 1), pct: 47, grade: 'D7' });
		// Zainab campus practice
		bankFor(db.questions, 'campus', 'mth101').forEach((q, i) => this._applyAnswer('u_zainab', 'campus', 'mth101', q, i % 2 ? q.answer : 0, 25_000, at(5, i)));
		db.certificates.push({ id: uid('ce'), userId: 'u_zainab', title: 'MTH 101 · General Mathematics I — Mock', pct: 74, grade: 'B2', issuedAt: at(4), code: 'SH-C-7Q2KX9', module: 'campus' });
		db.certificates.push({ id: uid('ce'), userId: 'u_ada', title: 'JAMB Physics — Waves Mastery', pct: 80, grade: 'A1', issuedAt: at(9), code: 'SH-C-3MF8RA', module: 'secondary' });

		// Subscriptions (Ada via guardian, Chidi annual, Zainab referred by Chidi)
		const pay = (userId: string, purpose: T.PaymentPurpose, amountKobo: number, refId: string | undefined, when: number, kind: TxnKind) => {
			const p = this._createPayment(userId, purpose, amountKobo, refId, when);
			this._settle(p, kind, when);
			return p;
		};
		pay('u_ngozi', 'subscription', 200_000, 'plus_month:u_ada', at(11), 'subscription');
		pay('u_chidi', 'subscription', 1_500_000, 'plus_year:u_chidi', at(160), 'subscription');
		pay('u_zainab', 'subscription', 200_000, 'plus_month:u_zainab', at(6), 'subscription');
		db.referrals.push({ id: uid('rf'), ambassadorId: 'u_chidi', userId: 'u_zainab', at: at(7), firstPaymentAt: at(6), commissionKobo: 20_000, channel: 'TikTok study clip' });
		db.referrals.push({ id: uid('rf'), ambassadorId: 'u_chidi', userId: 'u_emeka', at: at(15), commissionKobo: 0, channel: 'School assembly demo' });
		for (let i = 0; i < 9; i++) db.referrals.push({ id: uid('rf'), ambassadorId: 'u_chidi', userId: `anon${i}`, at: at(40 - i * 4), firstPaymentAt: i % 3 ? at(38 - i * 4) : undefined, commissionKobo: i % 3 ? 20_000 : 0, channel: ['WhatsApp class group', 'Campus QR poster', 'TikTok study clip'][i % 3] });

		// Released past sessions for tutors (each a full booking → escrow → release)
		const past: [string, string, string, number][] = [
			['o_tunde_phy', 'u_ada', 'Waves', 18], ['o_tunde_phy', 'u_emeka', 'Mechanics', 15], ['o_tunde_phy', 'u_ada', 'Electricity', 3],
			['o_chidi_mth', 'u_zainab', 'Set theory', 9], ['o_chidi_mth', 'u_zainab', 'Quadratic equations', 2], ['o_chidi_mth', 'u_ada', 'Algebra', 13],
			['o_bisi_chem', 'u_ada', 'Mole concept', 10], ['o_kemi_res', 'u_zainab', 'Research design', 12], ['o_sule_farm', 'u_emeka', 'Soil science', 16]
		];
		for (const [offerId, learnerId, topic, d] of past) {
			const o = db.offers.find((x) => x.id === offerId)!;
			const b = this.ins(db.bookings, { id: uid('bk'), offerId, learnerId, tutorId: o.tutorId, kind: o.kind, topic, slot: new Date(at(d)).toDateString(), minutes: 45, priceKobo: o.priceKobo, status: 'confirmed', createdAt: at(d + 1), rating: 5, review: 'Clear and patient — finally understand it.' } as T.Booking);
			const p = this._createPayment(learnerId === 'u_ada' || learnerId === 'u_emeka' ? 'u_ngozi' : learnerId, 'booking', b.priceKobo, b.id, at(d + 1));
			this._settle(p, 'session', at(d + 1));
			b.status = 'delivered'; b.deliveredAt = at(d);
			this._releaseEscrow(db.escrows.find((e) => e.refId === b.id)!, at(d - 2));
			b.status = 'released';
		}
		// A hand-off: Tunde was full, passed to Adaeze → Tunde earns the 2% collab slice
		{
			const o = db.offers.find((x) => x.id === 'o_adaeze_phy')!;
			const b = this.ins(db.bookings, { id: uid('bk'), offerId: o.id, learnerId: 'u_emeka', tutorId: 'u_adaeze', kind: 'tutoring', topic: 'Heat', slot: new Date(at(5)).toDateString(), minutes: 45, priceKobo: o.priceKobo, status: 'confirmed', createdAt: at(6), handoffFrom: 'u_tunde' } as T.Booking);
			const p = this._createPayment('u_ngozi', 'booking', b.priceKobo, b.id, at(6));
			this._settle(p, 'session', at(6));
			b.status = 'delivered'; b.deliveredAt = at(5);
			this._releaseEscrow(db.escrows.find((e) => e.refId === b.id)!, at(3));
			b.status = 'released';
		}
		// Live pipeline: one delivered (in escrow), one upcoming confirmed, one request pending payment
		const mk = (offerId: string, learnerId: string, topic: string, slot: string, status: T.BookingStatus, ageH: number) => {
			const o = db.offers.find((x) => x.id === offerId)!;
			const b = this.ins(db.bookings, { id: uid('bk'), offerId, learnerId, tutorId: o.tutorId, kind: o.kind, topic, slot, minutes: 45, priceKobo: o.priceKobo, status: 'pending_payment', createdAt: now - ageH * 3_600_000 } as T.Booking);
			b.threadId = this._bookingThread(b);
			if (status !== 'pending_payment') {
				const learner = db.users.find((u) => u.id === learnerId)!;
				const p = this._createPayment(learner.guardianId ?? learnerId, 'booking', b.priceKobo, b.id, b.createdAt);
				this._settle(p, 'session', b.createdAt);
				b.status = 'confirmed';
				if (status === 'delivered') { b.status = 'delivered'; b.deliveredAt = now - 20 * 3_600_000; const e = db.escrows.find((x) => x.refId === b.id)!; e.releaseAfter = b.deliveredAt + 2 * DAY; }
			}
			return b;
		};
		mk('o_tunde_phy', 'u_ada', 'Optics', 'Thu 18:00', 'confirmed', 30);
		mk('o_chidi_mth', 'u_zainab', 'Indices & logarithms', 'Fri 16:00', 'delivered', 50);
		mk('o_chidi_mth', 'u_emeka', 'Algebra', 'Sat 09:00', 'confirmed', 10);
		mk('o_bisi_chem', 'u_ada', 'Organic chemistry', 'Sat 11:00', 'delivered', 70);

		// Cohort seat sales (escrow held until weeks complete)
		for (const c of db.cohorts) {
			c.members.filter((m) => m.startsWith('u_')).forEach((m) => {
				const learner = db.users.find((u) => u.id === m)!;
				const p = this._createPayment(learner.guardianId ?? m, 'cohort', c.priceKobo, c.id, at(3));
				this._settle(p, 'session', at(3));
			});
		}
		// Pack sales
		[['p_optics', 'u_ada'], ['p_mth101', 'u_zainab'], ['p_organic', 'u_ada'], ['p_farm', 'u_emeka']].forEach(([packId, userId], i) => {
			const pk = db.packs.find((x) => x.id === packId)!;
			const learner = db.users.find((u) => u.id === userId)!;
			const p = this._createPayment(learner.guardianId ?? userId, 'pack', pk.priceKobo, pk.id, at(8 - i));
			this._settle(p, 'pack', at(8 - i));
			db.purchases.push({ id: uid('pu'), userId, packId, at: at(8 - i) });
		});
		// Greenfield contract milestone 1 released to the team via split rules
		{
			const k = db.contracts.find((x) => x.id === 'k_greenfield')!;
			const p = this._createPayment('u_adeyemi', 'contract', k.budgetKobo, k.id, at(28));
			p.tenantId = 'greenfield';
			this._settle(p, 'collab', at(28));
			const e = db.escrows.find((x) => x.refId === k.id)!;
			this._releaseMilestone(k, k.milestones[0], e, at(14));
			k.threadId = this._thread({ title: k.title, participants: ['u_adaeze', 'u_tunde', 'u_bisi', 'u_musa', 'u_adeyemi'], kind: 'contract', refId: k.id });
			this._sys(k.threadId, 'Milestone “Wk 1–2 diagnostic” released — ₦300,000 split by team rules.', at(14));
			this._msg(k.threadId, 'u_adeyemi', 'Diagnostic report received — SS3C is weakest on Optics. Can week 3 lean into that?', at(13));
			this._msg(k.threadId, 'u_adaeze', 'Yes. Tunde will run two extra Optics clinics for SS3C on Saturday.', at(13, 2));
		}
		// Studio royalties paid last month
		this.royaltiesComputeMonthly(at(1), true);
		// Payouts history
		db.users.filter((u) => u.payout?.matched).forEach((u, i) => {
			const bal = this._balance(u.id);
			if (bal >= 200_000) this._payout(u.id, Math.floor(bal * 0.6), at(2 + i), 'paid');
		});
		// Institutions
		db.invoices.push(
			{ id: uid('in'), tenantId: 'greenfield', title: 'School licence 2026/27', amountKobo: 250_000_000, status: 'paid', due: at(60), createdAt: at(75) },
			{ id: uid('in'), tenantId: 'greenfield', title: 'Hosted CBT — Mock 1 (405 candidates × ₦500)', amountKobo: 20_250_000, status: 'paid', due: at(10), createdAt: at(20) },
			{ id: uid('in'), tenantId: 'greenfield', title: 'Hosted CBT — Mock 2 (412 seats × ₦500)', amountKobo: 20_600_000, status: 'sent', due: now + 30 * DAY, createdAt: at(1), virtualAccount: { bank: 'Wema Bank (Flutterwave)', number: '7830 214 559' } },
			{ id: uid('in'), tenantId: 'lasg-sponsor', title: 'Sponsored seats · 3,010 learners × ₦4,000', amountKobo: 1_204_000_000, status: 'paid', due: at(40), createdAt: at(55) }
		);
		const types: T.ProctorEvent['type'][] = ['tab_switch', 'paste', 'fullscreen_exit', 'multiple_faces', 'tab_switch', 'idle'];
		types.forEach((type, i) => db.proctorEvents.push({ id: uid('pe'), examId: i < 4 ? 'he_mock1' : 'he_live', userId: i % 2 ? 'u_emeka' : 'u_ada', type, at: at(i < 4 ? 20 : 0, -i * 0.1) }));
		// Trust & ops queues
		db.integrityFlags.push(
			{ id: uid('if'), userId: 'u_zainab', text: 'Can you just do my ECO 101 assignment and I pay extra?', reasons: ['Writing graded work for a learner'], source: 'booking', at: at(1), status: 'open' },
			{ id: uid('if'), userId: 'u_new', text: 'Pack upload "Genetics Made Simple" — 27% similarity to a published guide', reasons: ['Originality above threshold'], source: 'pack', at: at(1, 3), status: 'open' }
		);
		db.reports.push({ id: uid('rp'), reporterId: 'u_ngozi', subjectId: 'u_new', body: 'Tutor asked for my daughter’s WhatsApp number in the booking chat.', at: now - 5 * 3_600_000, dueAt: now + 19 * 3_600_000, status: 'open', involvesMinor: true });
		db.tickets.push(
			{ id: uid('tk'), userId: 'u_zainab', subject: 'Paid by bank transfer, plan not active', body: 'Ref SH-SUB-… paid 10 mins ago.', status: 'open', at: now - 2 * 3_600_000, priority: 'high' },
			{ id: uid('tk'), userId: 'u_musa', subject: 'How do split rules work for new members?', body: '', status: 'pending', at: at(1), priority: 'normal' }
		);
		db.verifications.push(
			{ id: uid('vf'), userId: 'u_new', kind: 'nin', status: 'pending', at: at(2), note: 'Smile ID match 94% — selfie check passed' },
			{ id: uid('vf'), userId: 'u_new', kind: 'results', status: 'pending', at: at(2), note: 'WAEC Biology A1 uploaded (scratch-card verified)' },
			{ id: uid('vf'), userId: 'u_musa', kind: 'safeguarding', status: 'pending', at: at(3), note: 'Requested approved-for-minors badge' }
		);
		db.consents.push({ id: uid('cs'), guardianId: 'u_ngozi', childId: 'u_ada', scope: 'Join cohort: JAMB Physics Sprint', status: 'approved', at: at(3) });
		db.audit.push(
			{ id: uid('au'), actorId: 'u_fatima', action: 'role.grant', target: 'u_tunde · minorsApproved', at: at(40) },
			{ id: uid('au'), actorId: 'system', action: 'payouts.run', target: 'batch 18:00 WAT', at: at(2), meta: 'Flutterwave bulk transfer' },
			{ id: uid('au'), actorId: 'u_fatima', action: 'flags.update', target: 'live.video → 50%', at: at(6) }
		);
		// Notifications
		const n = (userId: string, title: string, body: string, href?: string, tone: T.Notification['tone'] = 'info', d = 0) => db.notifications.push({ id: uid('nt'), userId, title, body, at: at(d, -1), read: d > 1, href, tone });
		n('u_ada', 'Review due', '14 cards are due in your review queue.', '/review', 'info');
		n('u_ada', 'You improved 12% in Chemistry this week', 'Mole concept is now a strength. Next: Organic chemistry.', '/home', 'good', 1);
		n('u_chidi', 'New request: Algebra · SS3', 'Emeka booked Sat 09:00 — paid and held in escrow.', '/requests', 'good');
		n('u_chidi', 'Royalties paid', 'Your approved Studio questions were served 1,240 times last month.', '/studio', 'good', 3);
		n('u_tunde', 'Booking: Optics with Ada (guardian-linked)', 'Thu 18:00 · session will be audio-recorded for 30 days.', '/requests', 'info');
		n('u_ngozi', 'Ada finished a mock: C4 → B3 trend', 'Physics readiness up 9 points this month.', '/family/u_ada', 'good');
		n('u_adeyemi', 'Mock 2 invoice sent', 'Pay by transfer to your Flutterwave virtual account.', '/inst/greenfield/invoices', 'warn');
		n('u_fatima', 'Safeguarding report (minor)', '24-hour clock running — 19h left.', '/ops/trust', 'bad');
		n('u_sule', 'Farm club booked', 'Emeka’s club, Sat 08:00 — 12 students.', '/requests', 'good');
	}

	/* ───────────────────────────── helpers ───────────────────────────── */
	/** Insert and return the reactive (proxied) element — never mutate the raw object after inserting it. */
	private ins<X>(arr: X[], item: X): X { arr.push(item); return arr[arr.length - 1]; }
	user = (id?: string | null) => this.db.users.find((u) => u.id === id);
	get me() { return this.user(this.session.userId) ?? null; }
	get role() { return this.session.role; }
	has(role: T.Role, u = this.me) { return !!u?.roles.includes(role); }
	private need(role?: T.Role, opts: { adultOnly?: boolean } = {}) {
		const me = this.me;
		if (!me) throw new HiveError('UNAUTHENTICATED', 'Please sign in first.');
		if (me.status === 'suspended') throw new HiveError('SUSPENDED', 'This account is suspended.');
		if (opts.adultOnly && me.isMinor) throw new HiveError('ADULTS_ONLY', 'Earning roles are for adults (18+). Under-18s earn Hive Credits instead.');
		if (role && !me.roles.includes(role)) throw new HiveError('FORBIDDEN', `This needs the ${role} role.`);
		return me;
	}
	flag(key: string) { return this.db.flags.find((f) => f.key === key)?.enabled ?? false; }
	private log(action: string, target: string, meta?: string) { this.db.audit.unshift({ id: uid('au'), actorId: this.session.userId ?? 'system', action, target, at: Date.now(), meta }); }
	notify(userId: string, title: string, body: string, href?: string, tone: T.Notification['tone'] = 'info') {
		this.db.notifications.unshift({ id: uid('nt'), userId, title, body, at: Date.now(), read: false, href, tone });
	}

	/* ───────────────────────────── auth.* ───────────────────────────── */
	loginAs(userId: string, role?: T.Role) {
		const u = this.user(userId);
		if (!u) throw new HiveError('NOT_FOUND', 'No such user');
		this.session = { userId, role: role && u.roles.includes(role) ? role : u.roles[0] };
		this.touchStreak(u);
		this.commit();
		return u;
	}
	logout() { this.session = { userId: null, role: null }; this.commit(); }
	switchRole(role: T.Role) { if (this.me?.roles.includes(role)) { this.session.role = role; this.commit(); } }
	signup(input: { name: string; email: string; isMinor: boolean; guardianEmail?: string; intent: 'learn' | 'earn' | 'institution'; ref?: string; examTarget?: string; state?: string }) {
		if (this.db.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) throw new HiveError('EXISTS', 'An account with this email already exists — sign in instead.');
		const roles: T.Role[] = input.intent === 'earn' && !input.isMinor ? ['learner', 'tutor'] : input.intent === 'institution' && !input.isMinor ? ['instadmin'] : ['learner'];
		const id = uid('u');
		const referrer = input.ref ? this.db.users.find((u) => u.referralCode === input.ref!.toUpperCase()) : undefined;
		const u: T.User = { id, name: input.name.trim(), email: input.email.trim(), hue: Math.floor(Math.random() * 360), isMinor: input.isMinor, roles, tenantIds: [], dailyMinutes: 20, referralCode: input.name.replace(/\W/g, '').toUpperCase().slice(0, 5) + Math.floor(Math.random() * 90 + 10), creditsDays: 0, plan: { id: 'free', until: 0 }, verified: input.intent === 'earn' ? { pledge: true } : {}, streak: 0, status: 'active', joinedAt: Date.now(), examTarget: input.examTarget, state: input.state, referredBy: referrer?.id };
		if (input.isMinor && input.guardianEmail) {
			let g = this.db.users.find((x) => x.email.toLowerCase() === input.guardianEmail!.toLowerCase());
			if (!g) { g = this.ins(this.db.users, { ...u, id: uid('u'), name: 'Guardian of ' + u.name.split(' ')[0], email: input.guardianEmail, roles: ['guardian'], isMinor: false, children: [], referralCode: 'G' + u.referralCode, verified: {}, referredBy: undefined, examTarget: undefined } as T.User); }
			g.children = [...(g.children ?? []), id];
			u.guardianId = g.id;
			this.db.consents.push({ id: uid('cs'), guardianId: g.id, childId: id, scope: 'Link account & allow learning features', status: 'pending', at: Date.now() });
			this.notify(g.id, 'Consent requested', `${u.name} wants to link their SchoolXense account to you.`, '/family', 'warn');
		}
		this.db.users.push(u);
		if (referrer) {
			this.db.referrals.push({ id: uid('rf'), ambassadorId: referrer.id, userId: id, at: Date.now(), commissionKobo: 0, channel: 'Referral link' });
			this.notify(referrer.id, 'New sign-up from your link', `${u.name} joined with your code.`, '/referrals', 'good');
			if (referrer.isMinor) referrer.creditsDays += 7; // minors earn credits, never cash
		}
		if (input.intent === 'earn' && !input.isMinor) this.db.verifications.push({ id: uid('vf'), userId: id, kind: 'nin', status: 'pending', at: Date.now(), note: 'Awaiting Smile ID NIN check' });
		this.log('auth.signup', id, input.intent);
		this.loginAs(id);
		return u;
	}
	private touchStreak(u: T.User) {
		const t = today();
		if (u.lastActiveDay === t) return;
		const y = today(Date.now() - DAY);
		u.streak = u.lastActiveDay === y ? u.streak + 1 : u.lastActiveDay ? 1 : Math.max(1, u.streak);
		u.lastActiveDay = t;
	}
	updateProfile(patch: Partial<Pick<T.User, 'name' | 'phone' | 'state' | 'institution' | 'level' | 'examTarget' | 'dailyMinutes' | 'bio' | 'headline' | 'languages'>>) {
		const me = this.need();
		Object.assign(me, patch);
		this.commit();
	}
	requestRole(role: T.Role) {
		const me = this.need(undefined, { adultOnly: role !== 'learner' });
		if (!me.roles.includes(role)) me.roles.push(role);
		if (role === 'tutor' || role === 'creator') this.db.verifications.push({ id: uid('vf'), userId: me.id, kind: 'nin', status: 'pending', at: Date.now(), note: `Role request: ${role}` });
		this.log('roles.grant', `${me.id} · ${role}`, 'self-serve, verification pending');
		this.commit();
	}
	privacyExport() {
		const me = this.need();
		const mine = (rows: { userId?: string }[]) => rows.filter((r) => r.userId === me.id);
		this.log('privacy.exportMine', me.id);
		return { profile: me, attempts: mine(this.db.attempts), bookings: this.db.bookings.filter((b) => b.learnerId === me.id || b.tutorId === me.id), payments: mine(this.db.payments), certificates: mine(this.db.certificates), exportedAt: new Date().toISOString() };
	}

	/* ─────────────────────── practice.* / forge.* / review.* ─────────────────────── */
	private mkey = (u: string, e: string, s: string, t: string) => `${u}|${e}|${s}|${t}`;
	masteryFor(userId: string, exam: string, subject: string) {
		const ex = examById(exam);
		const topics = ex?.subjects.find((s) => s.id === subject)?.topics ?? [...new Set(bankFor(this.db.questions, exam, subject).map((q) => q.topic))];
		return topics.map((topic) => {
			const m = this.db.mastery[this.mkey(userId, exam, subject, topic)] ?? { theta: 0, answered: 0, correct: 0 };
			return { topic, ...m, pct: m.answered ? thetaToPct(m.theta) : null };
		});
	}
	private _applyAnswer(userId: string, exam: string, subject: string, q: Question, chosen: number | null, ms: number, at = Date.now()) {
		const correct = chosen === q.answer;
		const k = this.mkey(userId, exam, subject, q.topic);
		const m = (this.db.mastery[k] ??= { theta: 0, answered: 0, correct: 0 });
		m.theta = +updateAbility(m.theta, q.a, q.b, correct, m.answered).toFixed(4);
		m.answered++;
		if (correct) m.correct++;
		q.servedCount++;
		// SM-2 review queue
		const existing = this.db.reviewQueue.find((r) => r.userId === userId && r.qid === q.id);
		const quality = qualityFromAnswer(correct, ms);
		if (existing) existing.card = sm2Review(existing.card, quality, at);
		else if (!correct) this.db.reviewQueue.push({ userId, qid: q.id, card: sm2Review(newCard(at), quality, at - DAY) });
		return correct;
	}
	practiceStart(exam: string, subject: string, mode: T.Attempt['mode'] = 'drill', opts: { target?: number; topic?: string; tenantExamId?: string } = {}) {
		const me = this.need();
		const bank = bankFor(this.db.questions, exam, subject);
		if (!bank.length) throw new HiveError('EMPTY_BANK', 'No reviewed questions for this course yet.');
		const isPaid = me.plan.until > Date.now() || me.tenantIds.length > 0 || me.creditsDays > 0;
		const doneToday = this.db.attempts.filter((a) => a.userId === me.id && today(a.startedAt) === today()).reduce((s, a) => s + a.answers.length, 0);
		if (!isPaid && doneToday >= 20 && mode !== 'review') throw new HiveError('QUOTA', 'Free plan: 20 questions a day. Go Plus for unlimited practice.');
		let queue: string[] | undefined;
		let target = opts.target ?? (mode === 'mock' ? Math.min(20, bank.length) : 10);
		if (mode === 'mock' || opts.tenantExamId) {
			const he = opts.tenantExamId ? this.db.hostedExams.find((h) => h.id === opts.tenantExamId) : undefined;
			const shuffled = [...bank];
			for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
			queue = he ? he.questionIds : shuffled.slice(0, target).map((q) => q.id);
			target = queue.length;
		}
		const a: T.Attempt = { id: uid('at'), userId: me.id, exam, subject, mode, topic: opts.topic, target, queue, answers: [], startedAt: Date.now(), timeLimitSec: mode === 'mock' ? target * 60 : undefined, tenantExamId: opts.tenantExamId };
		this.db.attempts.push(a);
		this.commit();
		return a.id;
	}
	attempt = (id: string) => this.db.attempts.find((a) => a.id === id);
	practiceNext(attemptId: string): Question | undefined {
		const a = this.attempt(attemptId);
		if (!a || a.answers.length >= a.target || a.endedAt) return undefined;
		const seen = new Set(a.answers.map((x) => x.qid));
		if (a.queue) return this.db.questions.find((q) => q.id === a.queue![a.answers.length]);
		const bank = bankFor(this.db.questions, a.exam, a.subject);
		const mastery = Object.fromEntries(this.masteryFor(a.userId, a.exam, a.subject).map((m) => [m.topic, { theta: m.theta, answered: m.answered }]));
		if (!this.flag('forge.adaptive')) return bank.find((q) => !seen.has(q.id));
		return pickNextItem(bank, mastery, seen, { topic: a.topic }) ?? bank.find((q) => !seen.has(q.id));
	}
	practiceAnswer(attemptId: string, qid: string, chosen: number | null, ms: number) {
		const a = this.attempt(attemptId);
		const q = this.db.questions.find((x) => x.id === qid);
		if (!a || !q) throw new HiveError('NOT_FOUND', 'Attempt or question missing');
		if (a.answers.some((x) => x.qid === qid)) return { correct: a.answers.find((x) => x.qid === qid)!.correct, q };
		const correct = this._applyAnswer(a.userId, a.exam, a.subject, q, chosen, ms);
		a.answers.push({ qid, chosen, correct, ms, at: Date.now() });
		this.touchStreak(this.user(a.userId)!);
		this.commit();
		return { correct, q };
	}
	practiceFinish(attemptId: string) {
		const a = this.attempt(attemptId)!;
		if (!a.endedAt) {
			a.endedAt = Date.now();
			const right = a.answers.filter((x) => x.correct).length;
			a.pct = Math.round((right / Math.max(1, a.target)) * 100);
			a.grade = waecGrade(a.pct).grade;
			const u = this.user(a.userId)!;
			if (a.mode === 'mock' && a.pct >= 70) {
				const ex = examById(a.exam);
				const sub = ex?.subjects.find((s) => s.id === a.subject);
				this.db.certificates.push({ id: uid('ce'), userId: u.id, title: `${ex?.name ?? a.exam} ${sub?.name ?? a.subject} — Mock`, pct: a.pct, grade: a.grade, issuedAt: Date.now(), code: 'SH-C-' + Math.random().toString(36).slice(2, 8).toUpperCase(), module: (ex?.module ?? 'secondary') as ModuleId });
				this.notify(u.id, 'Certificate issued', `You scored ${a.pct}% (${a.grade}). Your certificate is ready.`, '/certificates', 'good');
			}
			if (u.guardianId && a.mode === 'mock') this.notify(u.guardianId, `${u.name.split(' ')[0]} finished a mock`, `${a.pct}% · ${a.grade}`, `/family/${u.id}`, 'info');
			this.commit();
		}
		return a;
	}
	reviewDue(userId = this.session.userId!) {
		const now = Date.now();
		return this.db.reviewQueue.filter((r) => r.userId === userId && r.card.dueAt <= now).sort((a, b) => a.card.dueAt - b.card.dueAt);
	}
	reviewGrade(qid: string, quality: number) {
		const me = this.need();
		const r = this.db.reviewQueue.find((x) => x.userId === me.id && x.qid === qid);
		if (r) r.card = sm2Review(r.card, quality);
		this.commit();
		return r?.card;
	}
	readiness(userId: string, exam = 'jamb') {
		const ex = examById(exam);
		const subjects = ex?.subjects.map((s) => s.id) ?? [];
		const rows = subjects.flatMap((s) => this.masteryFor(userId, exam, s));
		const practiced = rows.filter((r) => r.answered > 0);
		const mastery = practiced.length ? practiced.reduce((s, r) => s + (r.pct ?? 0), 0) / practiced.length / 100 : 0;
		const coverage = rows.length ? rows.filter((r) => r.answered >= 3).length / rows.length : 0;
		const mocks = this.db.attempts.filter((a) => a.userId === userId && a.mode === 'mock' && a.pct != null && (a.exam === exam || (exam === 'jamb' && a.exam === 'waec'))).map((a) => a.pct!);
		const answered = practiced.reduce((s, r) => s + r.answered, 0);
		return { ...estimateReadiness({ mastery, coverage, mocks, answered }), answered, coverage, mocks, weakest: practiced.sort((a, b) => a.theta - b.theta)[0]?.topic };
	}
	dailyDrill(userId: string) {
		const u = this.user(userId)!;
		const exam = u.examTarget ?? 'jamb';
		const ex = examById(exam);
		const all = (ex?.subjects ?? []).flatMap((s) => this.masteryFor(userId, exam, s.id).map((m) => ({ ...m, subject: s.id, subjectName: s.name })));
		const weak = all.sort((a, b) => (a.answered ? a.theta : -0.2) - (b.answered ? b.theta : -0.2)).slice(0, 3);
		return { exam, minutes: u.dailyMinutes, focus: weak, due: this.reviewDue(userId).length };
	}

	/* ───────────────────── marketplace: offers / bookings ───────────────────── */
	matchOffers(need: { subject?: string; topic?: string; level?: string; language?: string; budgetKobo?: number; kind?: T.OfferKind }) {
		const me = this.me;
		const pool = this.db.offers.filter((o) => o.active && (!need.kind || o.kind === need.kind) && (!me?.isMinor || o.minorsApproved) && this.user(o.tutorId)?.status === 'active');
		return rank(pool.map((o) => ({ ...o, id: o.id })), need) as T.Offer[];
	}
	upsertOffer(input: Omit<T.Offer, 'id' | 'tutorId' | 'rating' | 'reviews' | 'completion' | 'sessions' | 'verifiedAt' | 'minorsApproved'> & { id?: string }) {
		const me = this.need('tutor', { adultOnly: true });
		const v = screen(input.title + ' ' + input.topics.join(' '));
		if (!v.allowed) throw new HiveError('INTEGRITY', 'This offer looks like doing graded work for learners: ' + v.reasons.join(', '));
		if (input.id) {
			const o = this.db.offers.find((x) => x.id === input.id && x.tutorId === me.id);
			if (o) Object.assign(o, input);
		} else {
			this.db.offers.push({ ...input, id: uid('o'), tutorId: me.id, rating: 0, reviews: 0, completion: 0, sessions: 0, verifiedAt: Date.now(), minorsApproved: !!me.verified.minorsApproved, active: !!me.verified.nin && input.active });
		}
		this.commit();
	}
	bookingsCreate(input: { offerId: string; topic: string; slot: string; minutes: number; note?: string; handoffFrom?: string }) {
		const me = this.need();
		const o = this.db.offers.find((x) => x.id === input.offerId);
		if (!o) throw new HiveError('NOT_FOUND', 'Offer not found');
		if (o.tutorId === me.id) throw new HiveError('SELF', 'You cannot book yourself.');
		const v = screen(`${input.topic} ${input.note ?? ''}`);
		if (!v.allowed) {
			this.db.integrityFlags.unshift({ id: uid('if'), userId: me.id, text: input.note ?? input.topic, reasons: v.reasons, source: 'booking', at: Date.now(), status: 'open' });
			this.commit();
			throw new HiveError('INTEGRITY', `We can help you learn this, but tutors can't do graded work for you (${v.reasons.join(', ')}). Try “explain”, “check my working” or “give feedback on my draft”.`);
		}
		if (me.isMinor && !o.minorsApproved) throw new HiveError('MINOR_SAFETY', 'This tutor is not yet approved to teach under-18 learners.');
		const priceKobo = Math.round((o.priceKobo * input.minutes) / 45);
		const b: T.Booking = { id: uid('bk'), offerId: o.id, learnerId: me.id, tutorId: o.tutorId, kind: o.kind, topic: input.topic, slot: input.slot, minutes: input.minutes, priceKobo, status: 'pending_payment', note: input.note, createdAt: Date.now(), handoffFrom: input.handoffFrom };
		if (me.isMinor) {
			const g = this.user(me.guardianId);
			if (!g) throw new HiveError('NO_GUARDIAN', 'Link a guardian before booking (Settings → Guardian).');
			const approvedLink = this.db.consents.some((c) => c.childId === me.id && c.status === 'approved');
			if (!approvedLink || (g.spendingLimitKobo ?? 0) < priceKobo) {
				b.status = 'awaiting_consent';
				this.db.consents.push({ id: uid('cs'), guardianId: g.id, childId: me.id, scope: `Book ${o.title} · ${input.topic} · ${input.slot}`, status: 'pending', at: Date.now(), refId: b.id });
				this.notify(g.id, 'Consent needed for a booking', `${me.name} wants a session on ${input.topic}.`, '/family', 'warn');
			}
		}
		const rb = this.ins(this.db.bookings, b);
		rb.threadId = this._bookingThread(rb);
		this.commit();
		return rb;
	}
	private _bookingThread(b: T.Booking) {
		const learner = this.user(b.learnerId)!;
		const participants = [b.learnerId, b.tutorId, ...(learner.guardianId ? [learner.guardianId] : [])];
		const id = this._thread({ title: `${b.topic} · ${this.user(b.tutorId)?.name}`, participants, kind: 'booking', refId: b.id, guardianIncluded: !!learner.guardianId });
		this._sys(id, learner.isMinor ? 'This thread includes the learner’s guardian and is retained. Sessions are audio-recorded and kept 30 days. Do not share contact details.' : 'Keep communication on SchoolXense — your payment is protected by escrow.');
		return id;
	}
	booking = (id: string) => this.db.bookings.find((b) => b.id === id);
	/** Creates the Flutterwave payment for a booking; the checkout page completes it. */
	checkoutBooking(bookingId: string) {
		const me = this.need();
		const b = this.booking(bookingId)!;
		if (b.status !== 'pending_payment') throw new HiveError('STATE', 'This booking is not awaiting payment.');
		const payer = me.isMinor ? me.guardianId! : me.id;
		const p = this._createPayment(payer, 'booking', b.priceKobo, b.id);
		b.paymentId = p.id;
		this.commit();
		return p;
	}
	bookingsAccept(id: string) { const b = this.booking(id)!; this.need('tutor'); this.notify(b.learnerId, 'Session confirmed', `${this.me!.name} confirmed ${b.slot}.`, `/sessions/${b.id}`, 'good'); this.commit(); }
	bookingsStart(id: string) { const b = this.booking(id)!; if (b.status === 'confirmed') b.status = 'live'; this.commit(); }
	bookingsDeliver(id: string) {
		const b = this.booking(id)!;
		if (!['confirmed', 'live'].includes(b.status)) throw new HiveError('STATE', 'Only confirmed sessions can be completed.');
		b.status = 'delivered';
		b.deliveredAt = Date.now();
		const e = this.db.escrows.find((x) => x.refId === b.id && x.status === 'held');
		if (e) e.releaseAfter = Date.now() + 2 * DAY;
		this.notify(b.learnerId, 'How was your session?', 'Confirm to release payment, or open a dispute within 48 hours.', `/sessions/${b.id}`, 'info');
		this.commit();
	}
	bookingsConfirm(id: string, rating: number, review: string) {
		const b = this.booking(id)!;
		if (b.status !== 'delivered') throw new HiveError('STATE', 'Session not delivered yet.');
		b.rating = rating; b.review = review;
		const o = this.db.offers.find((x) => x.id === b.offerId)!;
		o.rating = +((o.rating * o.reviews + rating) / (o.reviews + 1)).toFixed(2); o.reviews++; o.sessions++;
		const e = this.db.escrows.find((x) => x.refId === b.id && x.status === 'held');
		if (e) this._releaseEscrow(e);
		b.status = 'released';
		this.commit();
	}
	bookingsDispute(id: string, reason: string) {
		const b = this.booking(id)!;
		b.status = 'disputed';
		const e = this.db.escrows.find((x) => x.refId === b.id);
		if (e) e.status = 'disputed';
		this.db.tickets.unshift({ id: uid('tk'), userId: b.learnerId, subject: `Dispute: ${b.topic}`, body: reason, status: 'open', at: Date.now(), priority: 'high' });
		this.notify(b.tutorId, 'Session disputed', 'Escrow is paused while the trust team reviews.', `/sessions/${b.id}`, 'bad');
		this.log('disputes.open', b.id, reason);
		this.commit();
	}
	bookingsHandoff(id: string, toOfferId: string) {
		const b = this.booking(id)!;
		const me = this.need('tutor');
		const to = this.db.offers.find((o) => o.id === toOfferId)!;
		if (b.status !== 'pending_payment' && b.status !== 'confirmed') throw new HiveError('STATE', 'Only open requests can be passed on.');
		const learner = this.user(b.learnerId)!;
		if (learner.isMinor && !to.minorsApproved) throw new HiveError('MINOR_SAFETY', 'That tutor is not approved for under-18 learners.');
		b.handoffFrom = me.id;
		b.tutorId = to.tutorId;
		b.offerId = to.id;
		const e = this.db.escrows.find((x) => x.refId === b.id && x.status === 'held');
		if (e) { e.recipients.earner = to.tutorId; e.recipients.collab = me.id; e.split = split({ kind: 'session', grossKobo: e.amountKobo, hasReferrer: !!e.recipients.referrer, hasCollabPartner: true }); }
		const th = this.db.threads.find((t) => t.id === b.threadId);
		if (th) { th.participants = [...new Set([...th.participants, to.tutorId])]; this._sys(th.id, `${me.name} handed this session to ${this.user(to.tutorId)?.name}. They earn the 2% collaboration share.`); }
		this.notify(to.tutorId, 'Hand-off received', `${me.name} passed you a ${b.topic} session.`, '/requests', 'good');
		this.log('handoffs.create', b.id, `${me.id} → ${to.tutorId}`);
		this.commit();
	}

	/* ───────────────────────────── money.* ───────────────────────────── */
	private _createPayment(userId: string, purpose: T.PaymentPurpose, amountKobo: number, refId?: string, at = Date.now()): T.Payment {
		const p: T.Payment = { id: uid('pay'), userId, txRef: `SH-${purpose.slice(0, 3).toUpperCase()}-${at.toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`, amountKobo, currency: 'NGN', purpose, refId, status: 'pending', createdAt: at };
		return this.ins(this.db.payments, p);
	}
	payment = (id: string) => this.db.payments.find((p) => p.id === id);
	private _post(txnId: string, rows: [walletId: string, amountKobo: number, kind: T.LedgerKind, memo: string][], at: number, sourcePaymentId?: string) {
		const sum = rows.reduce((s, r) => s + r[1], 0);
		if (sum !== 0) throw new Error(`Ledger imbalance ${sum} in ${txnId}`);
		for (const [walletId, amountKobo, kind, memo] of rows) if (amountKobo !== 0) this.db.ledger.push({ id: uid('le'), txnId, walletId, amountKobo, kind, memo, createdAt: at, sourcePaymentId });
	}
	private _recipientsFor(p: T.Payment) {
		const payer = this.user(p.userId);
		if (p.purpose === 'booking') {
			const b = this.booking(p.refId!)!;
			const tutor = this.user(b.tutorId)!;
			const learner = this.user(b.learnerId)!;
			return { earner: b.tutorId, referrer: tutor.referredBy ?? learner.referredBy, collab: b.handoffFrom };
		}
		if (p.purpose === 'pack') { const pk = this.db.packs.find((x) => x.id === p.refId)!; return { earner: pk.authorId, referrer: this.user(pk.authorId)?.referredBy }; }
		if (p.purpose === 'cohort') { const c = this.db.cohorts.find((x) => x.id === p.refId)!; return { earner: c.hostId, referrer: this.user(c.hostId)?.referredBy }; }
		return { referrer: payer?.referredBy };
	}
	/** money.settlePayment — idempotent on flwTxId. Opens escrow or credits wallets immediately. */
	private _settle(p: T.Payment, kind: TxnKind, at = Date.now(), flwTxId = 'FLW' + Math.floor(Math.random() * 1e9)) {
		if (p.status === 'successful') return;
		p.status = 'successful';
		p.flwTxId = flwTxId;
		const r = this._recipientsFor(p) as Record<string, string | undefined>;
		const s = split({ kind, grossKobo: p.amountKobo, hasReferrer: !!r.referrer, hasCollabPartner: !!r.collab });
		const txn = uid('tx');
		const escrowed = p.purpose === 'booking' || p.purpose === 'cohort' || p.purpose === 'contract';
		if (escrowed) {
			this._post(txn, [['clearing', -p.amountKobo, 'clearing', `Flutterwave ${p.txRef}`], ['escrow', p.amountKobo, 'escrow', `Held: ${p.purpose}`]], at, p.id);
			const recipients = Object.fromEntries(Object.entries(r).filter(([, v]) => v)) as Record<string, string>;
			this.db.escrows.push({ id: uid('es'), paymentId: p.id, refKind: p.purpose === 'contract' ? 'milestone' : (p.purpose as 'booking' | 'cohort'), refId: p.refId!, amountKobo: p.amountKobo, status: 'held', releaseAfter: at + (p.purpose === 'cohort' ? 42 * DAY : 30 * DAY), split: s, recipients });
			if (p.purpose === 'booking') { const b = this.booking(p.refId!); if (b && b.status === 'pending_payment') b.status = 'confirmed'; }
		} else {
			this._post(txn, [['clearing', -p.amountKobo, 'clearing', `Flutterwave ${p.txRef}`], ...this._sliceRows(s, r as Record<string, string>, p.purpose)], at, p.id);
			if (r.referrer && s.referrer) {
				const ref = this.db.referrals.find((x) => x.ambassadorId === r.referrer && x.userId === p.userId);
				if (ref) { ref.commissionKobo += s.referrer; ref.firstPaymentAt ??= at; }
			}
		}
		this._afterPayment(p, at);
	}
	private _sliceRows(s: Record<string, number>, r: Record<string, string>, memo: string): [string, number, T.LedgerKind, string][] {
		return [
			[r.earner ?? 'platform', s.earner, 'earner', memo],
			['platform', s.platform, 'platform', memo],
			[r.referrer ?? 'platform', s.referrer, 'referrer', memo],
			[r.collab ?? 'platform', s.collab, 'collab', memo],
			['impact', s.impact, 'impact', memo],
			['royalty_pool', s.royalty, 'royalty', memo],
			['processing', s.processing, 'processing', memo]
		];
	}
	private _releaseEscrow(e: T.Escrow, at = Date.now()) {
		if (e.status !== 'held') return;
		const txn = uid('tx');
		const p = this.payment(e.paymentId)!;
		const memo = `${p.purpose} released`;
		if (e.refKind === 'cohort') {
			const c = this.db.cohorts.find((x) => x.id === e.refId)!;
			const parts = splitByRules(e.split.earner, c.coHosts.map((h) => ({ memberId: h.userId, bp: h.bp })));
			const rows = this._sliceRows({ ...e.split, earner: 0 }, e.recipients, memo).filter((r) => r[2] !== 'earner');
			this._post(txn, [['escrow', -e.amountKobo, 'escrow', memo], ...parts.map((x) => [x.memberId, x.kobo, 'earner', `Cohort co-host share · ${c.title}`] as [string, number, T.LedgerKind, string]), ...rows], at, p.id);
		} else {
			this._post(txn, [['escrow', -e.amountKobo, 'escrow', memo], ...this._sliceRows(e.split, e.recipients, memo)], at, p.id);
		}
		e.status = 'released';
		if (e.recipients.earner) this.notify(e.recipients.earner, 'Payment released', `₦${(e.split.earner / 100).toLocaleString()} is now available in your wallet.`, '/wallet', 'good');
	}
	private _releaseMilestone(k: T.Contract, m: T.Milestone, e: T.Escrow, at = Date.now()) {
		const team = this.db.teams.find((t) => t.id === k.awardedTeamId)!;
		const s = split({ kind: 'collab', grossKobo: m.amountKobo, hasReferrer: false });
		const parts = splitByRules(s.earner, team.members.filter((x) => x.accepted).map((x) => ({ memberId: x.userId, bp: x.bp })));
		const txn = uid('tx');
		this._post(txn, [['escrow', -m.amountKobo, 'escrow', `Milestone · ${m.title}`], ...parts.map((x) => [x.memberId, x.kobo, 'earner', `${team.name} · ${m.title}`] as [string, number, T.LedgerKind, string]), ['platform', s.platform, 'platform', 'Collab fee'], ['impact', s.impact, 'impact', 'Collab'], ['processing', s.processing, 'processing', 'Collab']], at, e.paymentId);
		m.status = 'released';
		e.amountKobo -= m.amountKobo;
		if (e.amountKobo <= 0) e.status = 'released';
		parts.forEach((x) => this.notify(x.memberId, 'Milestone paid', `${m.title}: your share is ₦${(x.kobo / 100).toLocaleString()}.`, '/wallet', 'good'));
	}
	private _afterPayment(p: T.Payment, at: number) {
		const payer = this.user(p.userId)!;
		if (p.purpose === 'subscription' || p.purpose === 'exam_pass') {
			const [planId, forUser] = (p.refId ?? '').split(':');
			const target = this.user(forUser) ?? payer;
			const days = planId === 'plus_year' ? 365 : planId === 'plus_month' ? 30 : 90;
			target.plan = { id: planId, until: Math.max(target.plan.until, at) + days * DAY };
		}
		if (p.purpose === 'cohort') {
			const c = this.db.cohorts.find((x) => x.id === p.refId)!;
			const learner = payer.children?.find((ch) => !c.members.includes(ch)) ?? payer.id;
			if (!c.members.includes(learner)) c.members.push(learner);
		}
		if (p.purpose === 'pack') {
			const pk = this.db.packs.find((x) => x.id === p.refId)!;
			pk.sales++;
		}
		if (p.purpose === 'invoice') {
			const inv = this.db.invoices.find((x) => x.id === p.refId);
			if (inv) inv.status = 'paid';
		}
	}
	/** Simulates Flutterwave checkout → webhook (verif-hash) → Queue → verify → money.settlePayment. */
	completePayment(paymentId: string, method: string) {
		const p = this.payment(paymentId);
		if (!p) throw new HiveError('NOT_FOUND', 'Payment not found');
		if (p.status === 'successful') return p; // idempotent
		p.method = method;
		const kind: TxnKind = p.purpose === 'booking' || p.purpose === 'cohort' ? 'session' : p.purpose === 'pack' ? 'pack' : p.purpose === 'contract' ? 'collab' : p.purpose === 'invoice' ? 'licence' : 'subscription';
		this._settle(p, kind);
		if (p.purpose === 'pack') { const me = this.me!; const forUser = me.id; if (!this.db.purchases.some((x) => x.userId === forUser && x.packId === p.refId)) this.db.purchases.push({ id: uid('pu'), userId: forUser, packId: p.refId!, at: Date.now() }); }
		if (p.purpose === 'booking') { const b = this.booking(p.refId!)!; this.notify(b.tutorId, 'New paid booking', `${this.user(b.learnerId)?.name} · ${b.topic} · ${b.slot}`, '/requests', 'good'); }
		if (p.purpose === 'contract') { const k = this.db.contracts.find((x) => x.id === p.refId); if (k) k.milestones.forEach((m, i) => { if (i === 0 && m.status === 'pending') m.status = 'active'; }); }
		this.log('money.settlePayment', p.txRef, `${method} · ₦${p.amountKobo / 100}`);
		this.commit();
		return p;
	}
	failPayment(paymentId: string) { const p = this.payment(paymentId); if (p && p.status === 'pending') p.status = 'failed'; this.commit(); }
	buyPlan(planId: string, amountKobo: number, forUserId?: string) {
		const me = this.need();
		const payer = me.isMinor ? this.user(me.guardianId) ?? me : me;
		return this._createPayment(payer.id, planId === 'exam_pass' ? 'exam_pass' : 'subscription', amountKobo, `${planId}:${forUserId ?? me.id}`);
	}
	buyPack(packId: string) {
		const me = this.need();
		const pk = this.db.packs.find((x) => x.id === packId)!;
		if (this.db.purchases.some((x) => x.userId === me.id && x.packId === packId)) throw new HiveError('OWNED', 'You already own this pack.');
		return this._createPayment(me.isMinor ? me.guardianId ?? me.id : me.id, 'pack', pk.priceKobo, pk.id);
	}
	joinCohort(cohortId: string) {
		const me = this.need();
		const c = this.db.cohorts.find((x) => x.id === cohortId)!;
		if (c.members.includes(me.id)) throw new HiveError('JOINED', 'You are already in this cohort.');
		if (c.members.length >= c.seats) throw new HiveError('FULL', 'This cohort is full.');
		if (me.isMinor && !c.minorsAllowed) throw new HiveError('MINOR_SAFETY', 'This cohort is for adult learners only.');
		return this._createPayment(me.isMinor ? me.guardianId ?? me.id : me.id, 'cohort', c.priceKobo, c.id);
	}

	_balance = (walletId: string) => this.db.ledger.reduce((s, l) => (l.walletId === walletId ? s + l.amountKobo : s), 0);
	wallet(userId: string) {
		const available = this._balance(userId);
		const inEscrow = this.db.escrows.filter((e) => e.status === 'held' || e.status === 'disputed').reduce((s, e) => {
			if (e.refKind === 'cohort') { const c = this.db.cohorts.find((x) => x.id === e.refId); const h = c?.coHosts.find((x) => x.userId === userId); return s + (h ? Math.floor((e.split.earner * h.bp) / 10_000) : 0); }
			if (e.refKind === 'milestone') { const k = this.db.contracts.find((x) => x.id === e.refId); const t = this.db.teams.find((x) => x.id === k?.awardedTeamId); const m = t?.members.find((x) => x.userId === userId && x.accepted); const active = k?.milestones.filter((x) => x.status !== 'released').reduce((a, x) => a + x.amountKobo, 0) ?? 0; return s + (m ? Math.floor((active * 0.88 * m.bp) / 10_000) : 0); }
			return s + (e.recipients.earner === userId ? e.split.earner : 0) + (e.recipients.collab === userId ? e.split.collab : 0) + (e.recipients.referrer === userId ? e.split.referrer : 0);
		}, 0);
		const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
		const entries = this.db.ledger.filter((l) => l.walletId === userId);
		const earnedMonth = entries.filter((l) => l.amountKobo > 0 && l.createdAt >= monthStart.getTime()).reduce((s, l) => s + l.amountKobo, 0);
		const paidOut = this.db.payouts.filter((p) => p.userId === userId && p.status === 'paid').reduce((s, p) => s + p.amountKobo, 0);
		const bySource: Record<string, number> = {};
		for (const l of entries) if (l.amountKobo > 0) {
			const k = l.kind === 'earner' ? (l.memo.includes('Cohort') ? 'Cohorts' : l.memo.includes('pack') ? 'Library' : l.memo.includes('·') && !l.memo.includes('released') ? 'Collab' : 'Sessions') : l.kind === 'royalty' ? 'Studio' : l.kind === 'referrer' ? 'Referrals' : l.kind === 'collab' ? 'Hand-offs' : 'Other';
			bySource[k] = (bySource[k] ?? 0) + l.amountKobo;
		}
		return { available, inEscrow, earnedMonth, paidOut, bySource, entries: entries.sort((a, b) => b.createdAt - a.createdAt) };
	}
	private _payout(userId: string, amountKobo: number, at = Date.now(), status: T.Payout['status'] = 'queued') {
		const u = this.user(userId)!;
		const po: T.Payout = { id: uid('po'), userId, amountKobo, status, reference: 'SH-PO-' + at.toString(36).toUpperCase(), createdAt: at, approvals: [], bank: u.payout ? `${u.payout.bank} ${u.payout.account}` : '—' };
		const rpo = this.ins(this.db.payouts, po);
		this._post(uid('tx'), [[userId, -amountKobo, 'payout', `Withdrawal ${po.reference}`], ['payouts_out', amountKobo, 'payout', `To ${po.bank}`]], at);
		return rpo;
	}
	requestPayout(amountKobo: number) {
		const me = this.need(undefined, { adultOnly: true });
		if (!me.payout?.matched) throw new HiveError('NO_ACCOUNT', 'Add a name-matched bank or mobile-money account first.');
		if (amountKobo < 200_000) throw new HiveError('MIN', 'Minimum withdrawal is ₦2,000.');
		if (amountKobo > this._balance(me.id)) throw new HiveError('FUNDS', 'Amount is above your available balance.');
		const po = this._payout(me.id, amountKobo, Date.now(), amountKobo > 50_000_000 ? 'awaiting_approval' : 'queued');
		this.log('payouts.request', po.reference, `₦${amountKobo / 100}`);
		this.commit();
		return po;
	}
	setPayoutAccount(bank: string, account: string) {
		const me = this.need(undefined, { adultOnly: true });
		if (!/^\d{10}$/.test(account)) throw new HiveError('ACCOUNT', 'Enter a 10-digit NUBAN account number.');
		me.payout = { bank, account: '••••' + account.slice(-4), name: me.name.toUpperCase(), matched: true };
		this.log('payouts.accountResolve', me.id, bank);
		this.commit();
	}

	/* ───────────────────────────── cron (scheduled functions) ───────────────────────────── */
	cron() {
		const now = Date.now();
		let changed = false;
		for (const e of this.db.escrows) {
			if (e.status !== 'held' || e.refKind !== 'booking' || e.releaseAfter > now) continue;
			const b = this.booking(e.refId);
			if (b?.status === 'delivered') { this._releaseEscrow(e); b.status = 'released'; changed = true; }
		}
		if (changed) this.commit();
	}
	runPayouts() {
		this.need('staff');
		let n = 0;
		for (const po of this.db.payouts) if (po.status === 'queued') { po.status = 'paid'; n++; this.notify(po.userId, 'Payout sent', `₦${(po.amountKobo / 100).toLocaleString()} to ${po.bank}.`, '/payouts', 'good'); }
		this.log('payouts.run', `${n} transfers`, 'Flutterwave bulk transfer');
		this.commit();
		return n;
	}
	approvePayout(id: string) {
		const me = this.need('staff');
		const po = this.db.payouts.find((x) => x.id === id)!;
		if (!po.approvals.includes(me.id)) po.approvals.push(me.id);
		if (po.approvals.length >= 1) po.status = 'queued'; // demo: one approver stands in for two-person rule
		this.log('payouts.approve', po.reference);
		this.commit();
	}
	reconciliation() {
		const byWallet = (w: string) => this._balance(w);
		const settled = this.db.payments.filter((p) => p.status === 'successful').reduce((s, p) => s + p.amountKobo, 0);
		const ledgerSum = this.db.ledger.reduce((s, l) => s + l.amountKobo, 0);
		return { ledgerSum, settled, clearing: -byWallet('clearing'), escrow: byWallet('escrow'), platform: byWallet('platform'), impact: byWallet('impact'), royaltyPool: byWallet('royalty_pool'), processing: byWallet('processing'), paidOut: byWallet('payouts_out'), mismatch: settled !== -byWallet('clearing'), balanced: ledgerSum === 0 };
	}

	/* ───────────────────────────── library.* ───────────────────────────── */
	packsSubmit(input: { title: string; subject: string; exam: string; kind: T.Pack['kind']; priceKobo: number; pages: number; preview: string[]; body: string }) {
		const me = this.need('creator', { adultOnly: true });
		const v = screen(input.title + ' ' + input.body);
		// Originality check (Copyleaks in production): deterministic demo score
		const originality = Math.min(0.6, (input.body.length % 17) / 100 + (/(copied|leak|expo)/i.test(input.body) ? 0.4 : 0));
		const pk: T.Pack = { id: uid('p'), slug: input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48), authorId: me.id, title: input.title, subject: input.subject, exam: input.exam, kind: input.kind, priceKobo: input.priceKobo, pages: input.pages, rating: 0, sales: 0, originality, status: !v.allowed || originality > 0.2 ? 'rejected' : 'live', preview: input.preview, version: 1, createdAt: Date.now() };
		this.db.packs.unshift(pk);
		if (pk.status === 'rejected') this.db.integrityFlags.unshift({ id: uid('if'), userId: me.id, text: `Pack "${pk.title}" — originality ${Math.round(originality * 100)}%`, reasons: v.allowed ? ['Originality above threshold'] : v.reasons, source: 'pack', at: Date.now(), status: 'open' });
		this.commit();
		return pk;
	}

	/* ───────────────────────────── studio.* ───────────────────────────── */
	studioSubmit(input: { briefId: string; stem: string; options: string[]; answer: number; explanation: string }) {
		const me = this.need('creator', { adultOnly: true });
		const br = this.db.briefs.find((b) => b.id === input.briefId)!;
		if (input.options.some((o) => !o.trim()) || !input.stem.trim() || !input.explanation.trim()) throw new HiveError('INVALID', 'Fill the stem, all four options and an explanation.');
		const dup = this.db.questions.some((q) => q.stem.trim().toLowerCase() === input.stem.trim().toLowerCase());
		const s: T.StudioSubmission = { id: uid('ss'), authorId: me.id, ...input, topic: br.topic, exam: br.exam, subject: br.subject, status: dup ? 'rejected' : 'pending', approvals: [], rejections: dup ? ['system'] : [], originality: dup ? 1 : 0.03, createdAt: Date.now() };
		this.db.submissions.unshift(s);
		this.commit();
		if (dup) throw new HiveError('DUPLICATE', 'This question already exists in the bank.');
		return s;
	}
	studioReview(id: string, approve: boolean) {
		const me = this.need('creator', { adultOnly: true });
		const s = this.db.submissions.find((x) => x.id === id)!;
		if (s.authorId === me.id) throw new HiveError('SELF_REVIEW', 'You cannot review your own question.');
		if (s.status !== 'pending') return s;
		if (approve) { if (!s.approvals.includes(me.id)) s.approvals.push(me.id); } else s.rejections.push(me.id);
		if (s.rejections.length >= 1) s.status = 'rejected';
		if (s.approvals.length >= 2) {
			s.status = 'approved';
			const br = this.db.briefs.find((b) => b.id === s.briefId);
			this.db.questions.push({ id: uid('q'), exam: s.exam, subject: s.subject, topic: s.topic, stem: s.stem, options: s.options, answer: s.answer, explanation: s.explanation, a: 1.1, b: 0, bloom: 'apply', status: 'reviewed', authorId: s.authorId, servedCount: 0 });
			if (br) {
				const amt = br.rewardKobo;
				this._post(uid('tx'), [['platform', -amt, 'platform', 'Studio accepted item'], [s.authorId, amt, 'earner', `Studio accepted · ${s.topic}`]], Date.now());
				this.notify(s.authorId, 'Question accepted', `Two reviewers approved your ${s.topic} question. ₦${amt / 100} credited; royalties start now.`, '/studio', 'good');
			}
		}
		// reviewers earn per review
		this._post(uid('tx'), [['platform', -8_000, 'platform', 'Studio review fee'], [me.id, 8_000, 'earner', 'Studio review · paid per review']], Date.now());
		this.commit();
		return s;
	}
	/** royalties.computeMonthly — pool split by how often each author's approved items were served. */
	royaltiesComputeMonthly(at = Date.now(), silent = false) {
		const pool = this._balance('royalty_pool');
		if (pool <= 0) return 0;
		const served: Record<string, number> = {};
		for (const q of this.db.questions) if (q.status === 'reviewed' && this.user(q.authorId)) served[q.authorId] = (served[q.authorId] ?? 0) + q.servedCount;
		const total = Object.values(served).reduce((a, b) => a + b, 0);
		if (!total) return 0;
		const rows: [string, number, T.LedgerKind, string][] = [];
		let paid = 0;
		for (const [author, n] of Object.entries(served)) { const amt = Math.floor((pool * n) / total); paid += amt; rows.push([author, amt, 'royalty', `Studio royalties · ${n.toLocaleString()} serves`]); }
		this._post(uid('tx'), [['royalty_pool', -paid, 'royalty', 'Monthly royalty run'], ...rows], at);
		if (!silent) this.log('royalties.computeMonthly', `₦${paid / 100}`, `${rows.length} authors`);
		this.commit();
		return paid;
	}

	/* ───────────────────────────── collab.* ───────────────────────────── */
	teamsCreate(name: string, subjects: string[], blurb: string) {
		const me = this.need('tutor', { adultOnly: true });
		if (!me.roles.includes('teamlead')) me.roles.push('teamlead');
		const t: T.Team = { id: uid('t'), name, leadId: me.id, members: [{ userId: me.id, bp: 10_000, accepted: true, role: 'Lead' }], subjects, rating: 0, createdAt: Date.now(), blurb };
		const rt = this.ins(this.db.teams, t);
		this.commit();
		return rt;
	}
	splitRulesSet(teamId: string, rules: { userId: string; bp: number }[]) {
		const me = this.need();
		const t = this.db.teams.find((x) => x.id === teamId)!;
		if (t.leadId !== me.id) throw new HiveError('FORBIDDEN', 'Only the team lead can change split rules.');
		if (rules.reduce((a, r) => a + r.bp, 0) !== 10_000) throw new HiveError('SPLIT', 'Split rules must add up to exactly 100%.');
		t.members = rules.map((r) => { const ex = t.members.find((m) => m.userId === r.userId); return { userId: r.userId, bp: r.bp, accepted: r.userId === me.id ? true : ex?.bp === r.bp ? !!ex?.accepted : false, role: ex?.role ?? 'Member' }; });
		t.members.filter((m) => !m.accepted).forEach((m) => this.notify(m.userId, 'Split rules updated', `${t.name}: please review and accept your ${m.bp / 100}% share.`, `/teams/${t.id}`, 'warn'));
		this.log('splitRules.set', t.id);
		this.commit();
	}
	teamsInvite(teamId: string, userId: string) {
		const t = this.db.teams.find((x) => x.id === teamId)!;
		if (t.members.some((m) => m.userId === userId)) return;
		const u = this.user(userId);
		if (!u || u.isMinor) throw new HiveError('ADULTS_ONLY', 'Team members must be verified adults.');
		t.members.push({ userId, bp: 0, accepted: false, role: 'Member' });
		this.notify(userId, 'Team invite', `${this.me?.name} invited you to ${t.name}. Accept the split rules to join.`, `/teams/${t.id}`, 'info');
		this.commit();
	}
	teamsAcceptSplit(teamId: string) {
		const me = this.need();
		const t = this.db.teams.find((x) => x.id === teamId)!;
		const m = t.members.find((x) => x.userId === me.id);
		if (!m) throw new HiveError('NOT_MEMBER', 'You are not invited to this team.');
		if (m.bp === 0) throw new HiveError('NO_SHARE', 'The lead has not set your share yet.');
		m.accepted = true;
		this.commit();
	}
	contractsPost(input: { title: string; description: string; budgetKobo: number; weeks: number; tags: string[]; milestones: { title: string; amountKobo: number }[] }) {
		const me = this.need();
		if (input.milestones.reduce((s, m) => s + m.amountKobo, 0) !== input.budgetKobo) throw new HiveError('BUDGET', 'Milestones must add up to the budget.');
		const tenant = this.db.tenants.find((t) => me.tenantIds.includes(t.id));
		const k: T.Contract = { id: uid('k'), title: input.title, description: input.description, posterName: tenant?.name ?? me.name, posterTenantId: tenant?.id, posterUserId: me.id, budgetKobo: input.budgetKobo, weeks: input.weeks, tags: input.tags, milestones: input.milestones.map((m) => ({ id: uid('m'), ...m, status: 'pending' })), status: 'open', bids: [], createdAt: Date.now() };
		this.db.contracts.unshift(k);
		this.commit();
		return k;
	}
	contractsBid(contractId: string, teamId: string, amountKobo: number, note: string) {
		const me = this.need('teamlead', { adultOnly: true });
		const t = this.db.teams.find((x) => x.id === teamId && x.leadId === me.id);
		if (!t) throw new HiveError('FORBIDDEN', 'Only team leads can bid for their team.');
		if (t.members.some((m) => !m.accepted)) throw new HiveError('SPLIT_PENDING', 'All members must accept split rules before the team can bid.');
		const k = this.db.contracts.find((x) => x.id === contractId)!;
		k.bids = k.bids.filter((b) => b.teamId !== teamId);
		k.bids.push({ teamId, amountKobo, note, at: Date.now() });
		this.commit();
	}
	contractsAward(contractId: string, teamId: string) {
		const me = this.need();
		const k = this.db.contracts.find((x) => x.id === contractId)!;
		if (k.posterUserId !== me.id && !me.tenantIds.includes(k.posterTenantId ?? '') && !me.roles.includes('staff')) throw new HiveError('FORBIDDEN', 'Only the poster can award.');
		k.status = 'awarded';
		k.awardedTeamId = teamId;
		const team = this.db.teams.find((t) => t.id === teamId)!;
		k.threadId = this._thread({ title: k.title, participants: [...team.members.map((m) => m.userId), me.id], kind: 'contract', refId: k.id });
		this._sys(k.threadId, `Awarded to ${team.name}. Fund escrow to start milestone 1.`);
		const p = this._createPayment(me.id, 'contract', k.budgetKobo, k.id);
		if (k.posterTenantId) p.tenantId = k.posterTenantId;
		this.commit();
		return p;
	}
	milestoneSubmit(contractId: string, milestoneId: string) {
		const k = this.db.contracts.find((x) => x.id === contractId)!;
		const m = k.milestones.find((x) => x.id === milestoneId)!;
		m.status = 'submitted';
		if (k.threadId) this._sys(k.threadId, `Deliverables submitted for “${m.title}”. Poster review requested.`);
		this.commit();
	}
	milestoneRelease(contractId: string, milestoneId: string) {
		const k = this.db.contracts.find((x) => x.id === contractId)!;
		const m = k.milestones.find((x) => x.id === milestoneId)!;
		const e = this.db.escrows.find((x) => x.refId === k.id && x.status === 'held');
		if (!e) throw new HiveError('UNFUNDED', 'Escrow is not funded for this contract.');
		this._releaseMilestone(k, m, e);
		const next = k.milestones.find((x) => x.status === 'pending');
		if (next) next.status = 'active'; else k.status = 'complete';
		if (k.threadId) this._sys(k.threadId, `Milestone “${m.title}” released — split by team rules.`);
		this.log('milestones.release', `${k.id}/${m.id}`);
		this.commit();
	}
	tasksClaim(id: string) {
		const me = this.need(undefined, { adultOnly: true });
		const t = this.db.tasks.find((x) => x.id === id)!;
		if (t.status !== 'open') throw new HiveError('TAKEN', 'Someone claimed this task first.');
		if (this.db.tasks.filter((x) => x.claimedBy === me.id && x.status === 'claimed').length >= 2) throw new HiveError('LIMIT', 'Finish your claimed tasks first (max 2 at a time).');
		t.status = 'claimed'; t.claimedBy = me.id;
		this.commit();
	}
	tasksSubmit(id: string, submission: string) {
		const t = this.db.tasks.find((x) => x.id === id)!;
		t.status = 'submitted'; t.submission = submission;
		this.commit();
	}
	tasksApprove(id: string) {
		this.need();
		const t = this.db.tasks.find((x) => x.id === id)!;
		if (t.status !== 'submitted' || !t.claimedBy) return;
		const s = split({ kind: 'collab', grossKobo: t.rewardKobo });
		this._post(uid('tx'), [['platform', -s.earner, 'platform', 'Task budget (Studio)'], [t.claimedBy, s.earner, 'earner', `Task · ${t.title}`]], Date.now());
		t.status = 'approved';
		this.notify(t.claimedBy, 'Task approved', `${t.title} — ₦${(s.earner / 100).toLocaleString()} credited.`, '/wallet', 'good');
		this.commit();
	}

	/* ───────────────────────────── threads.* ───────────────────────────── */
	private _thread(t: Omit<T.Thread, 'id'>) { const id = uid('th'); this.db.threads.push({ id, ...t }); return id; }
	private _sys(threadId: string, body: string, at = Date.now()) { this.db.messages.push({ id: uid('ms'), threadId, userId: 'system', body, at, system: true }); }
	private _msg(threadId: string, userId: string, body: string, at = Date.now()) { this.db.messages.push({ id: uid('ms'), threadId, userId, body, at }); }
	threadsSend(threadId: string, body: string) {
		const me = this.need();
		const th = this.db.threads.find((t) => t.id === threadId)!;
		if (!th.participants.includes(me.id) && !me.roles.includes('staff')) throw new HiveError('FORBIDDEN', 'You are not in this thread.');
		const v = screen(body);
		const minors = th.participants.map((p) => this.user(p)).filter((u) => u?.isMinor);
		if (minors.length && !th.guardianIncluded) throw new HiveError('MINOR_SAFETY', 'Adults cannot message a minor without their guardian in the thread.');
		const flagged = !v.allowed || v.contactShared;
		if (flagged) this.db.integrityFlags.unshift({ id: uid('if'), userId: me.id, text: body, reasons: [...v.reasons, ...(v.contactShared ? ['Contact details shared'] : [])], source: 'message', at: Date.now(), status: 'open' });
		if (v.contactShared && minors.length) throw new HiveError('MINOR_SAFETY', 'Contact details cannot be shared in threads with under-18 learners. This was reported to the safety team.');
		if (!v.allowed) throw new HiveError('INTEGRITY', `Message blocked: ${v.reasons.join(', ')}. Tutors explain; they don't do graded work.`);
		this.db.messages.push({ id: uid('ms'), threadId, userId: me.id, body, at: Date.now(), flagged });
		th.participants.filter((p) => p !== me.id).forEach((p) => this.notify(p, `New message · ${th.title}`, body.slice(0, 80), `/threads/${th.id}`));
		this.commit();
	}
	report(input: { subjectId?: string; body: string; involvesMinor: boolean }) {
		const me = this.need();
		this.db.reports.unshift({ id: uid('rp'), reporterId: me.id, subjectId: input.subjectId, body: input.body, at: Date.now(), dueAt: Date.now() + DAY, status: 'open', involvesMinor: input.involvesMinor });
		this.commit();
	}
	ticket(subject: string, body: string) {
		const me = this.need();
		this.db.tickets.unshift({ id: uid('tk'), userId: me.id, subject, body, status: 'open', at: Date.now(), priority: 'normal' });
		this.commit();
	}

	/* ───────────────────────────── guardians ───────────────────────────── */
	consentDecide(id: string, approve: boolean) {
		const me = this.need('guardian');
		const c = this.db.consents.find((x) => x.id === id && x.guardianId === me.id)!;
		c.status = approve ? 'approved' : 'declined';
		if (c.refId) {
			const b = this.booking(c.refId);
			if (b) b.status = approve ? 'pending_payment' : 'cancelled';
			this.notify(c.childId, approve ? 'Guardian approved your booking' : 'Booking declined by guardian', approve ? 'You can now pay to confirm the session.' : '', '/sessions', approve ? 'good' : 'warn');
		}
		this.log('guardians.consent', c.id, approve ? 'approved' : 'declined');
		this.commit();
	}
	setSpendingLimit(childId: string, kobo: number) {
		const me = this.need('guardian');
		if (!me.children?.includes(childId)) throw new HiveError('FORBIDDEN', 'Not your child.');
		me.spendingLimitKobo = kobo;
		this.commit();
	}

	/* ───────────────────────────── referrals.* ───────────────────────────── */
	referralStats(userId: string) {
		const rows = this.db.referrals.filter((r) => r.ambassadorId === userId);
		const ledger = this.db.ledger.filter((l) => l.walletId === userId && l.kind === 'referrer');
		return { signups: rows.length, paying: rows.filter((r) => r.firstPaymentAt).length, commissionKobo: ledger.reduce((s, l) => s + l.amountKobo, 0), rows };
	}

	/* ───────────────────────────── tenants / institutions ───────────────────────────── */
	tenant = (id: string) => this.db.tenants.find((t) => t.id === id);
	canAccessTenant(tenantId: string) { const me = this.me; return !!me && (me.roles.includes('staff') || (me.roles.includes('instadmin') && me.tenantIds.includes(tenantId))); }
	private needTenant(tenantId: string) { if (!this.canAccessTenant(tenantId)) throw new HiveError('TENANT_FORBIDDEN', 'You do not administer this institution.'); return this.tenant(tenantId)!; }
	tenantLearners(tenantId: string) {
		const t = this.needTenant(tenantId);
		return this.db.users.filter((u) => t.members.includes(u.id) && u.roles.includes('learner')).map((u) => ({ u, r: this.readiness(u.id, u.examTarget ?? 'jamb') }));
	}
	seatsAssign(tenantId: string, email: string, name: string) {
		const t = this.needTenant(tenantId);
		if (t.members.length >= t.seats) throw new HiveError('SEATS', 'All licensed seats are in use.');
		let u = this.db.users.find((x) => x.email.toLowerCase() === email.toLowerCase());
		if (!u) { u = this.ins(this.db.users, { id: uid('u'), name, email, hue: Math.floor(Math.random() * 360), isMinor: true, roles: ['learner'], tenantIds: [], dailyMinutes: 20, referralCode: 'S' + Math.random().toString(36).slice(2, 7).toUpperCase(), creditsDays: 0, plan: { id: 'free', until: 0 }, verified: {}, streak: 0, status: 'active', joinedAt: Date.now(), examTarget: 'jamb', level: 'SS3' } as T.User); }
		if (!u.tenantIds.includes(t.id)) u.tenantIds.push(t.id);
		if (!t.members.includes(u.id)) t.members.push(u.id);
		this.log('seats.assign', `${t.id} · ${u.email}`);
		this.commit();
	}
	hostedExamsSchedule(tenantId: string, input: { title: string; subject: string; date: number; seats: number; durationMin: number }) {
		this.needTenant(tenantId);
		const qids = bankFor(this.db.questions, 'jamb', input.subject).map((q) => q.id).slice(0, 15);
		const he: T.HostedExam = { id: uid('he'), tenantId, exam: 'jamb', status: 'scheduled', questionIds: qids, candidates: [], ...input };
		this.db.hostedExams.unshift(he);
		this.db.invoices.unshift({ id: uid('in'), tenantId, title: `Hosted CBT — ${input.title} (${input.seats} × ₦500)`, amountKobo: input.seats * 50_000, status: 'sent', due: input.date, createdAt: Date.now(), virtualAccount: { bank: 'Wema Bank (Flutterwave)', number: '78' + Math.floor(1e7 + Math.random() * 9e7) } });
		this.commit();
		return he;
	}
	hostedExamSetStatus(id: string, status: T.HostedExam['status']) { const he = this.db.hostedExams.find((x) => x.id === id)!; this.needTenant(he.tenantId); he.status = status; this.commit(); }
	proctorLog(examId: string, type: T.ProctorEvent['type']) {
		const me = this.me;
		if (!me) return;
		this.db.proctorEvents.push({ id: uid('pe'), examId, userId: me.id, type, at: Date.now() });
		this.commit();
	}
	payInvoice(id: string) { const inv = this.db.invoices.find((x) => x.id === id)!; this.needTenant(inv.tenantId); const p = this._createPayment(this.me!.id, 'invoice', inv.amountKobo, inv.id); p.tenantId = inv.tenantId; return p; }
	brandingUpdate(tenantId: string, theme: T.Tenant['theme']) { const t = this.needTenant(tenantId); t.theme = theme; this.log('tenants.branding', tenantId); this.commit(); }

	/* ───────────────────────────── ops.* ───────────────────────────── */
	flagsToggle(key: string, patch: Partial<T.FeatureFlag>) { this.need('staff'); const f = this.db.flags.find((x) => x.key === key)!; Object.assign(f, patch); this.log('flags.update', key, JSON.stringify(patch)); this.commit(); }
	integrityResolve(id: string, uphold: boolean) {
		this.need('staff');
		const f = this.db.integrityFlags.find((x) => x.id === id)!;
		f.status = uphold ? 'upheld' : 'dismissed';
		if (uphold) { const u = this.user(f.userId); if (u && u.roles.includes('tutor')) { u.status = 'paused'; this.db.offers.filter((o) => o.tutorId === u.id).forEach((o) => (o.active = false)); } }
		this.log('integrity.resolve', f.id, uphold ? 'upheld' : 'dismissed');
		this.commit();
	}
	reportResolve(id: string, action: 'warn' | 'suspend' | 'dismiss') {
		this.need('staff');
		const r = this.db.reports.find((x) => x.id === id)!;
		r.status = 'resolved';
		if (action === 'suspend' && r.subjectId) { const u = this.user(r.subjectId); if (u) { u.status = 'suspended'; this.db.offers.filter((o) => o.tutorId === u.id).forEach((o) => (o.active = false)); } }
		this.log('safeguarding.resolve', r.id, action);
		this.commit();
	}
	verificationDecide(id: string, approve: boolean) {
		this.need('staff');
		const v = this.db.verifications.find((x) => x.id === id)!;
		v.status = approve ? 'approved' : 'rejected';
		const u = this.user(v.userId)!;
		if (approve) {
			if (v.kind === 'nin') u.verified.nin = true;
			if (v.kind === 'results') u.verified.results = true;
			if (v.kind === 'safeguarding') { u.verified.safeguarding = true; u.verified.minorsApproved = true; this.db.offers.filter((o) => o.tutorId === u.id).forEach((o) => (o.minorsApproved = true)); }
			if (u.verified.nin && u.verified.results) this.db.offers.filter((o) => o.tutorId === u.id).forEach((o) => (o.active = true));
			this.notify(u.id, 'Verification approved', `${v.kind.toUpperCase()} check passed.`, '/earn', 'good');
		}
		this.log('verifications.decide', `${u.id} · ${v.kind}`, approve ? 'approved' : 'rejected');
		this.commit();
	}
	userSetStatus(userId: string, status: T.User['status']) { this.need('staff'); const u = this.user(userId)!; u.status = status; this.log('users.setStatus', userId, status); this.commit(); }
	ticketSet(id: string, status: T.SupportTicket['status']) { this.need('staff'); const t = this.db.tickets.find((x) => x.id === id)!; t.status = status; this.commit(); }
	resolveDispute(bookingId: string, refund: boolean) {
		this.need('staff');
		const b = this.booking(bookingId)!;
		const e = this.db.escrows.find((x) => x.refId === b.id)!;
		if (refund) {
			this._post(uid('tx'), [['escrow', -e.amountKobo, 'escrow', 'Refund'], ['refunds_out', e.amountKobo, 'refund', `Refund ${b.id}`]], Date.now(), e.paymentId);
			e.status = 'refunded'; b.status = 'refunded';
			const p = this.payment(e.paymentId); if (p) p.status = 'refunded';
		} else { e.status = 'held'; this._releaseEscrow(e); b.status = 'released'; }
		this.log('disputes.resolve', b.id, refund ? 'refund' : 'release');
		this.commit();
	}

	/* ───────────────────────────── notifications.* ───────────────────────────── */
	myNotifications() { return this.db.notifications.filter((n) => n.userId === this.session.userId).sort((a, b) => b.at - a.at); }
	markAllRead() { this.db.notifications.forEach((n) => { if (n.userId === this.session.userId) n.read = true; }); this.commit(); }
	markRead(id: string) { const n = this.db.notifications.find((x) => x.id === id); if (n) n.read = true; this.commit(); }

	/* ───────────────────────────── search (command palette) ───────────────────────────── */
	search(q: string) {
		const s = q.trim().toLowerCase();
		if (!s) return [];
		const out: { kind: string; label: string; sub: string; href: string }[] = [];
		this.db.users.filter((u) => u.slug && (u.name.toLowerCase().includes(s) || u.headline?.toLowerCase().includes(s))).slice(0, 4).forEach((u) => out.push({ kind: 'Tutor', label: u.name, sub: u.headline ?? '', href: `/tutors/${u.slug}` }));
		EXAMS.forEach((e) => e.subjects.forEach((sub) => { if (`${e.name} ${sub.name}`.toLowerCase().includes(s)) out.push({ kind: 'Practice', label: `${e.name} · ${sub.name}`, sub: e.format, href: `/practice/${e.id}/${sub.id}` }); }));
		this.db.teams.filter((t) => t.name.toLowerCase().includes(s)).forEach((t) => out.push({ kind: 'Team', label: t.name, sub: t.subjects.join(', '), href: `/teams/${t.id}` }));
		this.db.packs.filter((p) => p.status === 'live' && p.title.toLowerCase().includes(s)).forEach((p) => out.push({ kind: 'Library', label: p.title, sub: p.subject, href: `/library/${p.slug}` }));
		this.db.cohorts.filter((c) => c.title.toLowerCase().includes(s)).forEach((c) => out.push({ kind: 'Cohort', label: c.title, sub: c.schedule, href: `/cohorts#${c.id}` }));
		this.db.contracts.filter((c) => c.title.toLowerCase().includes(s)).forEach((c) => out.push({ kind: 'Contract', label: c.title, sub: c.posterName, href: `/contracts/${c.id}` }));
		return out.slice(0, 12);
	}

	/* ───────────────────────────── platform metrics (ops overview) ───────────────────────────── */
	metrics() {
		const r = this.reconciliation();
		const gmv = this.db.payments.filter((p) => p.status === 'successful').reduce((s, p) => s + p.amountKobo, 0);
		const earnersPaid = this.db.ledger.filter((l) => ['earner', 'referrer', 'collab', 'royalty'].includes(l.kind) && l.amountKobo > 0 && !['platform', 'royalty_pool', 'impact', 'processing', 'escrow', 'payouts_out'].includes(l.walletId)).reduce((s, l) => s + l.amountKobo, 0);
		const byPurpose: Record<string, number> = {};
		this.db.payments.filter((p) => p.status === 'successful').forEach((p) => (byPurpose[p.purpose] = (byPurpose[p.purpose] ?? 0) + p.amountKobo));
		return { gmv, earnersPaid, platform: r.platform, impact: r.impact, escrow: r.escrow, users: this.db.users.length, earners: this.db.users.filter((u) => u.roles.some((x) => ['tutor', 'creator', 'ambassador', 'teamlead'].includes(x))).length, sessions: this.db.bookings.length, questions: this.db.questions.length, answers: this.db.attempts.reduce((s, a) => s + a.answers.length, 0) + Object.values(this.db.mastery).reduce((s, m) => s + m.answered, 0), byPurpose };
	}
}

export const hive = new Hive();
export type { Question };
export { jambBand, waecGrade };
