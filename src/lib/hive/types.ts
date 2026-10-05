/** Unified data model — mirrors convex/schema.ts (ten domains). Money is integer kobo. */
import type { ReviewCard } from '$engines/sm2';
import type { ModuleId } from './catalogue';

export type Role = 'learner' | 'guardian' | 'tutor' | 'creator' | 'teamlead' | 'ambassador' | 'instadmin' | 'staff';
export type Id = string;

export interface User {
	id: Id;
	name: string;
	email: string;
	phone?: string;
	hue: number;
	isMinor: boolean;
	roles: Role[];
	guardianId?: Id;
	children?: Id[];
	tenantIds: Id[];
	state?: string;
	institution?: string;
	level?: string;
	examTarget?: string;
	examDate?: number;
	dailyMinutes: number;
	referralCode: string;
	referredBy?: Id;
	creditsDays: number;
	plan: { id: string; until: number };
	verified: { nin?: boolean; results?: boolean; pledge?: boolean; safeguarding?: boolean; minorsApproved?: boolean };
	payout?: { bank: string; account: string; name: string; matched: boolean };
	slug?: string;
	bio?: string;
	headline?: string;
	languages?: string[];
	streak: number;
	lastActiveDay?: string;
	spendingLimitKobo?: number;
	staffRole?: 'admin' | 'trust' | 'finance' | 'support' | 'content';
	status: 'active' | 'suspended' | 'paused';
	joinedAt: number;
}

export interface MasteryRow { theta: number; answered: number; correct: number }

export interface AttemptAnswer { qid: Id; chosen: number | null; correct: boolean; ms: number; at: number }
export interface Attempt {
	id: Id;
	userId: Id;
	exam: string;
	subject: string;
	mode: 'drill' | 'mock' | 'review' | 'custom' | 'ussd';
	topic?: string;
	target: number;
	timeLimitSec?: number;
	queue?: Id[]; // fixed order for mocks
	answers: AttemptAnswer[];
	startedAt: number;
	endedAt?: number;
	pct?: number;
	grade?: string;
	tenantExamId?: Id;
}

export interface ReviewItem { userId: Id; qid: Id; card: ReviewCard }

export type OfferKind = 'tutoring' | 'feedback' | 'coaching' | 'skills';
export interface Offer {
	id: Id;
	tutorId: Id;
	kind: OfferKind;
	title: string;
	subjects: string[];
	topics: string[];
	level: string[];
	languages: string[];
	priceKobo: number; // per 45-min session
	rating: number;
	reviews: number;
	completion: number;
	sessions: number;
	verifiedAt: number;
	minorsApproved: boolean;
	module: ModuleId;
	availability: string[];
	active: boolean;
}

export type BookingStatus = 'pending_payment' | 'awaiting_consent' | 'confirmed' | 'live' | 'delivered' | 'released' | 'disputed' | 'refunded' | 'cancelled';
export interface Booking {
	id: Id;
	offerId: Id;
	learnerId: Id;
	tutorId: Id;
	kind: OfferKind | 'cohort';
	topic: string;
	slot: string;
	minutes: number;
	priceKobo: number;
	status: BookingStatus;
	paymentId?: Id;
	escrowId?: Id;
	note?: string;
	handoffFrom?: Id;
	createdAt: number;
	deliveredAt?: number;
	rating?: number;
	review?: string;
	threadId?: Id;
}

export type PaymentPurpose = 'subscription' | 'booking' | 'pack' | 'cohort' | 'exam_pass' | 'contract' | 'invoice' | 'certificate';
export interface Payment {
	id: Id;
	userId: Id;
	txRef: string;
	flwTxId?: string;
	amountKobo: number;
	currency: 'NGN';
	purpose: PaymentPurpose;
	refId?: Id;
	status: 'pending' | 'successful' | 'failed' | 'refunded';
	method?: string;
	createdAt: number;
	tenantId?: Id;
}

export interface Escrow { id: Id; paymentId: Id; refKind: 'booking' | 'cohort' | 'milestone'; refId: Id; amountKobo: number; status: 'held' | 'released' | 'refunded' | 'disputed'; releaseAfter: number; split: Record<string, number>; recipients: Record<string, Id> }

export type LedgerKind = 'earner' | 'platform' | 'referrer' | 'collab' | 'impact' | 'royalty' | 'processing' | 'payout' | 'escrow' | 'clearing' | 'refund';
export interface LedgerEntry { id: Id; txnId: Id; walletId: Id; amountKobo: number; kind: LedgerKind; memo: string; createdAt: number; sourcePaymentId?: Id }

export interface Payout { id: Id; userId: Id; amountKobo: number; status: 'awaiting_approval' | 'queued' | 'processing' | 'paid' | 'failed'; reference: string; createdAt: number; approvals: Id[]; bank: string }

export interface Cohort { id: Id; hostId: Id; coHosts: { userId: Id; bp: number }[]; title: string; exam: string; subject: string; startsAt: number; weeks: number; seats: number; members: Id[]; priceKobo: number; schedule: string; module: ModuleId; description: string; minorsAllowed: boolean }

export interface Pack { id: Id; slug: string; authorId: Id; title: string; subject: string; exam: string; kind: 'notes' | 'flashcards' | 'worked-solutions' | 'past-questions'; priceKobo: number; pages: number; rating: number; sales: number; originality: number; status: 'draft' | 'checking' | 'live' | 'rejected'; preview: string[]; version: number; createdAt: number }
export interface Purchase { id: Id; userId: Id; packId: Id; at: number; tenantId?: Id }

export interface StudioBrief { id: Id; kind: 'write' | 'review' | 'translate' | 'explainer'; exam: string; subject: string; topic: string; needed: number; rewardKobo: number; language?: string; deadline: number }
export interface StudioSubmission { id: Id; briefId: Id; authorId: Id; stem: string; options: string[]; answer: number; explanation: string; topic: string; exam: string; subject: string; status: 'pending' | 'approved' | 'rejected'; approvals: Id[]; rejections: Id[]; originality: number; createdAt: number }

export interface Team { id: Id; name: string; leadId: Id; members: { userId: Id; bp: number; accepted: boolean; role: string }[]; subjects: string[]; rating: number; createdAt: number; blurb: string }
export interface Milestone { id: Id; title: string; amountKobo: number; status: 'pending' | 'active' | 'submitted' | 'released' }
export interface Contract { id: Id; title: string; posterName: string; posterTenantId?: Id; posterUserId?: Id; budgetKobo: number; weeks: number; tags: string[]; milestones: Milestone[]; status: 'open' | 'awarded' | 'complete'; awardedTeamId?: Id; bids: { teamId: Id; amountKobo: number; note: string; at: number }[]; description: string; createdAt: number; threadId?: Id }
export interface Task { id: Id; title: string; kind: 'review' | 'transcribe' | 'record' | 'moderate' | 'translate'; rewardKobo: number; minutes: number; status: 'open' | 'claimed' | 'submitted' | 'approved'; claimedBy?: Id; subject: string; submission?: string; createdAt: number }

export interface Thread { id: Id; title: string; participants: Id[]; kind: 'booking' | 'team' | 'contract' | 'support' | 'direct'; refId?: Id; guardianIncluded?: boolean }
export interface Message { id: Id; threadId: Id; userId: Id; body: string; at: number; flagged?: boolean; system?: boolean }

export interface Tenant { id: Id; name: string; kind: 'school' | 'university' | 'centre' | 'sponsor'; seats: number; members: Id[]; modules: ModuleId[]; theme: { brand: string; accent: string; logoText: string }; licenceEnds: number; classes: { name: string; learners: number; readiness: number; active7d: number }[]; state: string; subdomain: string }
export interface HostedExam { id: Id; tenantId: Id; title: string; exam: string; subject: string; date: number; seats: number; durationMin: number; status: 'scheduled' | 'live' | 'closed'; questionIds: Id[]; candidates: Id[] }
export interface ProctorEvent { id: Id; examId: Id; userId: Id; type: 'tab_switch' | 'paste' | 'multiple_faces' | 'fullscreen_exit' | 'idle'; at: number }
export interface Invoice { id: Id; tenantId: Id; title: string; amountKobo: number; status: 'draft' | 'sent' | 'paid'; due: number; virtualAccount?: { bank: string; number: string }; createdAt: number }

export interface Notification { id: Id; userId: Id; title: string; body: string; at: number; read: boolean; href?: string; tone?: 'good' | 'warn' | 'bad' | 'info' }
export interface IntegrityFlag { id: Id; userId: Id; text: string; reasons: string[]; source: 'booking' | 'message' | 'upload' | 'pack'; at: number; status: 'open' | 'upheld' | 'dismissed' }
export interface SafeguardReport { id: Id; reporterId: Id; subjectId?: Id; body: string; at: number; dueAt: number; status: 'open' | 'resolved'; involvesMinor: boolean }
export interface SupportTicket { id: Id; userId: Id; subject: string; body: string; status: 'open' | 'pending' | 'closed'; at: number; priority: 'low' | 'normal' | 'high' }
export interface Referral { id: Id; ambassadorId: Id; userId: Id; at: number; firstPaymentAt?: number; commissionKobo: number; channel: string }
export interface Certificate { id: Id; userId: Id; title: string; pct: number; grade: string; issuedAt: number; code: string; module: ModuleId }
export interface Consent { id: Id; guardianId: Id; childId: Id; scope: string; status: 'pending' | 'approved' | 'declined'; at: number; refId?: Id }
export interface FeatureFlag { key: string; enabled: boolean; rollout: number; description: string; scope: 'all' | 'role' | 'tenant' }
export interface AuditEntry { id: Id; actorId: Id; action: string; target: string; at: number; meta?: string }
export interface Verification { id: Id; userId: Id; kind: 'nin' | 'results' | 'safeguarding' | 'institution'; status: 'pending' | 'approved' | 'rejected'; at: number; note: string }
