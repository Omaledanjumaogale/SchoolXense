/**
 * SchoolXense unified schema — one Convex deployment, ten domains.
 * References use Convex ids; money is integer kobo (v.int64) with a currency code.
 * Mirrors src/lib/hive/types.ts (the demo store) field-for-field where possible.
 */
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

const kobo = v.int64();
const currency = v.union(v.literal('NGN'), v.literal('GHS'), v.literal('KES'), v.literal('XOF'));
const role = v.union(v.literal('learner'), v.literal('guardian'), v.literal('tutor'), v.literal('creator'), v.literal('teamlead'), v.literal('ambassador'), v.literal('instadmin'), v.literal('staff'));
const moduleId = v.string();

export default defineSchema({
	privateIdentities: defineTable({authId:v.string(),state:v.string(),lga:v.string(),whatsapp:v.string(),ciphertext:v.string(),iv:v.string(),last4:v.string(),updatedAt:v.number()}).index('by_authId',['authId']),
	enquiries: defineTable({ name: v.string(), email: v.string(), organisation: v.optional(v.string()), topic: v.string(), message: v.string(), status: v.union(v.literal('new'), v.literal('in_progress'), v.literal('closed')), createdAt: v.number() }).index('by_status', ['status']),
	testimonials: defineTable({ name: v.string(), role: v.string(), quote: v.string(), approved: v.boolean(), example: v.boolean() }).index('by_approved', ['approved']),
	mediaFiles: defineTable({ key: v.string(), ownerId: v.id('users'), kind: v.union(v.literal('image'), v.literal('document')), contentType: v.string(), size: v.number(), createdAt: v.number() }).index('by_key', ['key']).index('by_owner', ['ownerId']),
	ecosystemEvents: defineTable({ eventId: v.string(), app: v.literal('schoolxense'), type: v.string(), subject: v.string(), payload: v.any(), createdAt: v.number(), deliveredAt: v.optional(v.number()) }).index('by_eventId', ['eventId']).index('by_delivery', ['deliveredAt']),

	/* ── 1. Identity ─────────────────────────────────────────────── */
	users: defineTable({
		authId: v.optional(v.string()), ecosystemId: v.optional(v.string()),
		name: v.string(), email: v.optional(v.string()), phone: v.optional(v.string()), image: v.optional(v.string()),
		isMinor: v.boolean(), state: v.optional(v.string()), lga:v.optional(v.string()), whatsapp:v.optional(v.string()),ninLast4:v.optional(v.string()), institution: v.optional(v.string()), level: v.optional(v.string()),
		examTarget: v.optional(v.string()), examDate: v.optional(v.number()), dailyMinutes: v.number(),
		referralCode: v.string(), centralReferralCode:v.optional(v.string()), referredBy: v.optional(v.id('users')), creditsDays: v.number(),
		slug: v.optional(v.string()), headline: v.optional(v.string()), bio: v.optional(v.string()), languages: v.optional(v.array(v.string())),
		streak: v.number(), lastActiveDay: v.optional(v.string()), status: v.union(v.literal('active'), v.literal('suspended'), v.literal('paused')),
		profileComplete: v.optional(v.boolean()), legacyUid: v.optional(v.string()), // Firebase uid, kept 90 days for linking
	}).index('by_authId', ['authId']).index('email', ['email']).index('phone', ['phone']).index('by_slug', ['slug']).index('by_referralCode', ['referralCode']).index('by_legacyUid', ['legacyUid'])
		.searchIndex('search_name', { searchField: 'name' }),
	roles: defineTable({ userId: v.id('users'), role, grantedBy: v.optional(v.id('users')), grantedAt: v.number() }).index('by_user', ['userId']).index('by_user_role', ['userId', 'role']),
	guardianLinks: defineTable({ guardianId: v.id('users'), childId: v.id('users'), spendingLimit: kobo, createdAt: v.number() }).index('by_guardian', ['guardianId']).index('by_child', ['childId']),
	guardianInvites: defineTable({ childId:v.id('users'),tokenHash:v.string(),expiresAt:v.number(),claimedAt:v.optional(v.number()) }).index('by_hash',['tokenHash']).index('by_child',['childId']),
	consents: defineTable({ guardianId: v.id('users'), childId: v.id('users'), scope: v.string(), refTable: v.optional(v.string()), refId: v.optional(v.string()), status: v.union(v.literal('pending'), v.literal('approved'), v.literal('declined')), decidedAt: v.optional(v.number()) }).index('by_guardian_status', ['guardianId', 'status']).index('by_child', ['childId']),
	verifications: defineTable({ userId: v.id('users'), kind: v.union(v.literal('nin'), v.literal('results'), v.literal('safeguarding'), v.literal('institution')), status: v.union(v.literal('pending'), v.literal('under_review'), v.literal('approved'), v.literal('rejected')), provider: v.optional(v.string()), providerRef: v.optional(v.string()), note: v.optional(v.string()), decidedBy: v.optional(v.id('users')) }).index('by_status', ['status']).index('by_user', ['userId']),
	payoutAccounts: defineTable({ userId: v.id('users'), bankCode: v.string(), bankName: v.string(), accountLast4: v.string(), accountName: v.string(), nameMatched: v.boolean(), flwRecipientRef: v.optional(v.string()) }).index('by_user', ['userId']),

	/* ── 2. Tenancy ──────────────────────────────────────────────── */
	tenants: defineTable({ slug: v.string(), name: v.string(), kind: v.union(v.literal('school'), v.literal('university'), v.literal('centre'), v.literal('sponsor')), state: v.string(), subdomain: v.string(), customDomain: v.optional(v.string()) }).index('by_slug', ['slug']).index('by_subdomain', ['subdomain']),
	tenantMembers: defineTable({ tenantId: v.id('tenants'), userId: v.id('users'), kind: v.union(v.literal('learner'), v.literal('staff')), className: v.optional(v.string()) }).index('by_tenant', ['tenantId']).index('by_user', ['userId']).index('by_tenant_user', ['tenantId', 'userId']),
	tenantThemes: defineTable({ tenantId: v.id('tenants'), brand: v.string(), accent: v.string(), logoText: v.string(), logoFileId: v.optional(v.id('_storage')) }).index('by_tenant', ['tenantId']),
	licences: defineTable({ tenantId: v.id('tenants'), seats: v.number(), modules: v.array(moduleId), startsAt: v.number(), endsAt: v.number(), priceKobo: kobo }).index('by_tenant', ['tenantId']),

	/* ── 3. Academic catalogue ───────────────────────────────────── */
	institutions: defineTable({ name: v.string(), type: v.string(), state: v.string() }).searchIndex('search_name', { searchField: 'name', filterFields: ['type', 'state'] }),
	faculties: defineTable({ institutionId: v.optional(v.id('institutions')), name: v.string() }),
	departments: defineTable({ facultyId: v.id('faculties'), name: v.string() }).index('by_faculty', ['facultyId']),
	courses: defineTable({ departmentId: v.optional(v.id('departments')), code: v.string(), name: v.string(), level: v.string() }).index('by_code', ['code']).searchIndex('search_name', { searchField: 'name' }),
	exams: defineTable({ key: v.string(), name: v.string(), module: moduleId, format: v.string() }).index('by_key', ['key']),
	subjects: defineTable({ examKey: v.string(), key: v.string(), name: v.string() }).index('by_exam', ['examKey']),
	topics: defineTable({ subjectId: v.id('subjects'), name: v.string(), order: v.number() }).index('by_subject', ['subjectId']),
	curricula: defineTable({ body: v.string(), version: v.string(), subjectId: v.id('subjects'), topicIds: v.array(v.id('topics')) }),

	/* ── 4. Question bank ────────────────────────────────────────── */
	questions: defineTable({
		exam: v.string(), subject: v.string(), topic: v.string(), stem: v.string(), options: v.array(v.string()), answer: v.number(), explanation: v.string(),
		a: v.float64(), b: v.float64(), bloom: v.string(), status: v.union(v.literal('reviewed'), v.literal('unreviewed'), v.literal('retired')),
		authorId: v.optional(v.id('users')), licence: v.string(), contentHash: v.string(), model: v.optional(v.string()), promptVersion: v.optional(v.string()), language: v.optional(v.string()),
	}).index('by_exam_subject_topic', ['exam', 'subject', 'topic']).index('by_hash', ['contentHash']).index('by_author', ['authorId']).index('by_status', ['status']),
	questionVersions: defineTable({ questionId: v.id('questions'), version: v.number(), snapshot: v.any(), editedBy: v.id('users') }).index('by_question', ['questionId']),
	questionStats: defineTable({ questionId: v.id('questions'), served: v.number(), servedPaying: v.number(), correct: v.number() }).index('by_question', ['questionId']),
	questionReviews: defineTable({ questionId: v.id('questions'), reviewerId: v.id('users'), approve: v.boolean(), note: v.optional(v.string()) }).index('by_question', ['questionId']),
	questionRoyalties: defineTable({ authorId: v.id('users'), month: v.string(), serves: v.number(), amount: kobo }).index('by_month', ['month']),

	/* ── 5. Practice & assessment ────────────────────────────────── */
	attempts: defineTable({ userId: v.id('users'), exam: v.string(), subject: v.string(), mode: v.union(v.literal('drill'), v.literal('mock'), v.literal('review'), v.literal('custom'), v.literal('ussd')), topic: v.optional(v.string()), target: v.number(), timeLimitSec: v.optional(v.number()), queue: v.optional(v.array(v.id('questions'))), startedAt: v.number(), endedAt: v.optional(v.number()), pct: v.optional(v.number()), grade: v.optional(v.string()), hostedExamId: v.optional(v.id('hostedExams')), clientId: v.optional(v.string()) })
		.index('by_user', ['userId']).index('by_user_mode', ['userId', 'mode']).index('by_hostedExam', ['hostedExamId']).index('by_clientId', ['clientId']),
	attemptAnswers: defineTable({ attemptId: v.id('attempts'), userId: v.id('users'), questionId: v.id('questions'), chosen: v.union(v.number(), v.null()), correct: v.boolean(), ms: v.number(), at: v.number(), clientId: v.optional(v.string()) }).index('by_attempt', ['attemptId']).index('by_clientId', ['clientId']),
	mastery: defineTable({ userId: v.id('users'), exam: v.string(), subject: v.string(), topic: v.string(), theta: v.float64(), answered: v.number(), correct: v.number() }).index('by_user_exam', ['userId', 'exam']).index('by_key', ['userId', 'exam', 'subject', 'topic']),
	reviewQueue: defineTable({ userId: v.id('users'), questionId: v.id('questions'), easiness: v.float64(), interval: v.number(), repetitions: v.number(), dueAt: v.number() }).index('by_user_due', ['userId', 'dueAt']).index('by_user_question', ['userId', 'questionId']),
	mocks: defineTable({ title: v.string(), exam: v.string(), subject: v.string(), questionIds: v.array(v.id('questions')), durationMin: v.number(), createdBy: v.id('users') }),
	certificates: defineTable({ userId: v.id('users'), title: v.string(), pct: v.number(), grade: v.string(), code: v.string(), module: moduleId, issuedAt: v.number() }).index('by_user', ['userId']).index('by_code', ['code']),
	hostedExams: defineTable({ tenantId: v.id('tenants'), title: v.string(), exam: v.string(), subject: v.string(), date: v.number(), seats: v.number(), durationMin: v.number(), status: v.union(v.literal('scheduled'), v.literal('live'), v.literal('closed')), questionIds: v.array(v.id('questions')) }).index('by_tenant', ['tenantId']),
	proctorEvents: defineTable({ hostedExamId: v.id('hostedExams'), userId: v.id('users'), type: v.string(), at: v.number() }).index('by_exam', ['hostedExamId']),

	/* ── 6. Marketplace ──────────────────────────────────────────── */
	offers: defineTable({ tutorId: v.id('users'), kind: v.union(v.literal('tutoring'), v.literal('feedback'), v.literal('coaching'), v.literal('skills'), v.literal('cohort')), title: v.string(), subjects: v.array(v.string()), topics: v.array(v.string()), levels: v.array(v.string()), languages: v.array(v.string()), price: kobo, availability: v.array(v.string()), module: moduleId, active: v.boolean(), minorsApproved: v.boolean(), rating: v.float64(), reviews: v.number(), completion: v.float64(), sessions: v.number() })
		.index('by_tutor', ['tutorId']).index('by_active_kind', ['active', 'kind']).searchIndex('search_title', { searchField: 'title', filterFields: ['active', 'kind', 'module'] }),
	bookings: defineTable({ offerId: v.id('offers'), learnerId: v.id('users'), tutorId: v.id('users'), topic: v.string(), slot: v.string(), minutes: v.number(), price: kobo, status: v.string(), paymentId: v.optional(v.id('payments')), note: v.optional(v.string()), handoffFrom: v.optional(v.id('users')), deliveredAt: v.optional(v.number()), threadId: v.optional(v.id('threads')) })
		.index('by_learner', ['learnerId']).index('by_tutor_status', ['tutorId', 'status']),
	sessionsLive: defineTable({ bookingId: v.id('bookings'), roomId: v.string(), startedAt: v.number(), endedAt: v.optional(v.number()), recordingKey: v.optional(v.string()), recordingExpiresAt: v.optional(v.number()) }).index('by_booking', ['bookingId']),
	feedbackJobs: defineTable({ bookingId: v.id('bookings'), docRoomId: v.string(), status: v.string() }).index('by_booking', ['bookingId']),
	cohorts: defineTable({ hostId: v.id('users'), title: v.string(), exam: v.string(), subject: v.string(), startsAt: v.number(), weeks: v.number(), seats: v.number(), price: kobo, schedule: v.string(), module: moduleId, description: v.string(), minorsAllowed: v.boolean() }).index('by_host', ['hostId']).index('by_start', ['startsAt']),
	cohortSeats: defineTable({ cohortId: v.id('cohorts'), userId: v.id('users'), paymentId: v.id('payments') }).index('by_cohort', ['cohortId']).index('by_user', ['userId']),
	reviews: defineTable({ bookingId: v.id('bookings'), offerId: v.id('offers'), rating: v.number(), text: v.string() }).index('by_offer', ['offerId']),
	disputes: defineTable({ bookingId: v.id('bookings'), openedBy: v.id('users'), reason: v.string(), status: v.union(v.literal('open'), v.literal('refunded'), v.literal('released')), decidedBy: v.optional(v.id('users')) }).index('by_status', ['status']),

	/* ── 7. Library & Studio ─────────────────────────────────────── */
	packs: defineTable({ authorId: v.id('users'), slug: v.string(), title: v.string(), subject: v.string(), exam: v.string(), kind: v.string(), price: kobo, pages: v.number(), status: v.union(v.literal('draft'), v.literal('checking'), v.literal('live'), v.literal('rejected')), preview: v.array(v.string()), version: v.number(), fileId: v.optional(v.id('_storage')), rating: v.float64(), sales: v.number() }).index('by_slug', ['slug']).index('by_author', ['authorId']).index('by_status', ['status']),
	packVersions: defineTable({ packId: v.id('packs'), version: v.number(), fileId: v.id('_storage') }).index('by_pack', ['packId']),
	purchases: defineTable({ userId: v.id('users'), packId: v.id('packs'), paymentId: v.id('payments'), tenantId: v.optional(v.id('tenants')) }).index('by_user', ['userId']).index('by_pack', ['packId']),
	studioBriefs: defineTable({ kind: v.string(), exam: v.string(), subject: v.string(), topic: v.string(), needed: v.number(), reward: kobo, language: v.optional(v.string()), deadline: v.number(), open: v.boolean() }).index('by_open', ['open']),
	studioSubmissions: defineTable({ briefId: v.id('studioBriefs'), authorId: v.id('users'), stem: v.string(), options: v.array(v.string()), answer: v.number(), explanation: v.string(), status: v.union(v.literal('pending'), v.literal('approved'), v.literal('rejected')), approvals: v.array(v.id('users')), rejections: v.array(v.id('users')) }).index('by_status', ['status']).index('by_author', ['authorId']),
	originalityChecks: defineTable({ refTable: v.string(), refId: v.string(), provider: v.literal('copyleaks'), score: v.float64(), passed: v.boolean() }).index('by_ref', ['refTable', 'refId']),

	/* ── 8. Collaboration ────────────────────────────────────────── */
	teams: defineTable({ name: v.string(), leadId: v.id('users'), subjects: v.array(v.string()), blurb: v.string(), rating: v.float64() }).index('by_lead', ['leadId']),
	teamMembers: defineTable({ teamId: v.id('teams'), userId: v.id('users'), role: v.string() }).index('by_team', ['teamId']).index('by_user', ['userId']),
	splitRules: defineTable({ teamId: v.id('teams'), userId: v.id('users'), bp: v.number(), accepted: v.boolean(), version: v.number() }).index('by_team', ['teamId']),
	contracts: defineTable({ title: v.string(), description: v.string(), posterUserId: v.id('users'), posterTenantId: v.optional(v.id('tenants')), budget: kobo, weeks: v.number(), tags: v.array(v.string()), status: v.union(v.literal('open'), v.literal('awarded'), v.literal('complete')), awardedTeamId: v.optional(v.id('teams')), threadId: v.optional(v.id('threads')) }).index('by_status', ['status']).index('by_tenant', ['posterTenantId']),
	milestones: defineTable({ contractId: v.id('contracts'), title: v.string(), amount: kobo, order: v.number(), status: v.union(v.literal('pending'), v.literal('active'), v.literal('submitted'), v.literal('released')) }).index('by_contract', ['contractId']),
	bids: defineTable({ contractId: v.id('contracts'), teamId: v.id('teams'), amount: kobo, note: v.string() }).index('by_contract', ['contractId']),
	tasks: defineTable({ title: v.string(), kind: v.string(), reward: kobo, minutes: v.number(), subject: v.string(), status: v.union(v.literal('open'), v.literal('claimed'), v.literal('submitted'), v.literal('approved')), claimedBy: v.optional(v.id('users')), submission: v.optional(v.string()) }).index('by_status', ['status']).index('by_claimer', ['claimedBy']),
	taskClaims: defineTable({ taskId: v.id('tasks'), userId: v.id('users'), claimedAt: v.number() }).index('by_task', ['taskId']),
	deliverables: defineTable({ milestoneId: v.id('milestones'), fileId: v.optional(v.id('_storage')), note: v.string(), submittedBy: v.id('users') }).index('by_milestone', ['milestoneId']),
	handoffs: defineTable({ bookingId: v.id('bookings'), fromId: v.id('users'), toId: v.id('users') }).index('by_from', ['fromId']),
	threads: defineTable({ title: v.string(), kind: v.string(), refId: v.optional(v.string()), participants: v.array(v.id('users')), guardianIncluded: v.boolean() }),
	messages: defineTable({ threadId: v.id('threads'), userId: v.optional(v.id('users')), body: v.string(), system: v.boolean(), flagged: v.boolean() }).index('by_thread', ['threadId']),

	/* ── 9. Money (double-entry; balances derived, never edited) ─── */
	wallets: defineTable({ ownerUserId: v.optional(v.id('users')), system: v.optional(v.string()), currency }).index('by_owner', ['ownerUserId']).index('by_system', ['system']),
	payments: defineTable({ userId: v.id('users'), flwTxId: v.optional(v.string()), txRef: v.string(), amount: kobo, currency, purpose: v.string(), refId: v.optional(v.string()), status: v.union(v.literal('pending'), v.literal('successful'), v.literal('failed'), v.literal('refunded')), tenantId: v.optional(v.id('tenants')), method: v.optional(v.string()), fulfilledAt:v.optional(v.number()), createdAt: v.number() })
		.index('by_flwTxId', ['flwTxId']).index('by_txRef', ['txRef']).index('by_user', ['userId']),
	escrows: defineTable({ paymentId: v.id('payments'), refKind: v.string(), refId: v.string(), amount: kobo, currency, status: v.union(v.literal('held'), v.literal('released'), v.literal('refunded'), v.literal('disputed')), releaseAfter: v.number(), split: v.any(), recipients: v.any() }).index('by_status_release', ['status', 'releaseAfter']).index('by_ref', ['refId']),
	ledgerEntries: defineTable({ txnId: v.string(), walletId: v.id('wallets'), amount: kobo, currency, kind: v.string(), memo: v.string(), sourcePaymentId: v.optional(v.id('payments')), createdAt: v.number() }).index('by_wallet', ['walletId']).index('by_txn', ['txnId']),
	payouts: defineTable({ userId: v.id('users'), amount: kobo, status: v.union(v.literal('awaiting_approval'), v.literal('queued'), v.literal('processing'), v.literal('paid'), v.literal('failed')), reference: v.string(), approvals: v.array(v.id('users')), flwTransferId: v.optional(v.string()) }).index('by_status', ['status']).index('by_user', ['userId']).index('by_reference', ['reference']),
	shareAllocations: defineTable({ paymentId: v.id('payments'), slice: v.string(), recipientWalletId: v.id('wallets'), amount: kobo }).index('by_payment', ['paymentId']),
	invoices: defineTable({ tenantId: v.id('tenants'), title: v.string(), amount: kobo, status: v.union(v.literal('draft'), v.literal('sent'), v.literal('paid')), due: v.number(), virtualAccount: v.optional(v.object({ bank: v.string(), number: v.string() })) }).index('by_tenant', ['tenantId']),
	subscriptions: defineTable({ userId: v.id('users'), planId: v.string(), until: v.number(), flwPlanId: v.optional(v.string()), paidBy: v.id('users'), status: v.optional(v.union(v.literal('active'),v.literal('cancelled'),v.literal('expired'))), startedAt:v.optional(v.number()), renewedAt:v.optional(v.number()), cancelAtPeriodEnd:v.optional(v.boolean()), cancelledAt:v.optional(v.number()), sourcePaymentId:v.optional(v.id('payments')) }).index('by_user', ['userId']),

	/* ── 10. Trust & operations ──────────────────────────────────── */
	integrityFlags: defineTable({ userId: v.id('users'), text: v.string(), reasons: v.array(v.string()), source: v.string(), status: v.union(v.literal('open'), v.literal('upheld'), v.literal('dismissed')) }).index('by_status', ['status']),
	reports: defineTable({ reporterId: v.id('users'), subjectId: v.optional(v.id('users')), body: v.string(), involvesMinor: v.boolean(), dueAt: v.number(), status: v.union(v.literal('open'),v.literal('under_review'), v.literal('resolved')) }).index('by_status_due', ['status', 'dueAt']),
	auditLog: defineTable({ actorId: v.optional(v.id('users')), action: v.string(), target: v.string(), meta: v.optional(v.string()), at: v.number() }).index('by_at', ['at']),
	featureFlags: defineTable({ key: v.string(), enabled: v.boolean(), rollout: v.number(), scope: v.string(), description: v.string() }).index('by_key', ['key']),
	notifications: defineTable({ userId: v.id('users'), title: v.string(), body: v.string(), href: v.optional(v.string()), tone: v.optional(v.string()), read: v.boolean() }).index('by_user_read', ['userId', 'read']),
	supportTickets: defineTable({ userId: v.id('users'), subject: v.string(), body: v.string(), status: v.string(), priority: v.string() }).index('by_status', ['status']).index('by_user',['userId']),
	referrals: defineTable({ ambassadorId: v.id('users'), userId: v.id('users'), channel: v.string(), firstPaymentAt: v.optional(v.number()) }).index('by_ambassador', ['ambassadorId']).index('by_user', ['userId']),
	ambassadors: defineTable({ userId: v.id('users'), campus: v.optional(v.string()), tenantId: v.optional(v.id('tenants')), active: v.boolean() }).index('by_user', ['userId'])
});
