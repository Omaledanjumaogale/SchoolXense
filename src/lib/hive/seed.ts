import type { User, Offer, Cohort, Pack, StudioBrief, StudioSubmission, Team, Contract, Task, Tenant, HostedExam, FeatureFlag, Role } from './types';

const DAY = 86_400_000;

const baseUser = (u: Partial<User> & Pick<User, 'id' | 'name' | 'email' | 'roles'>, now: number): User => ({
	hue: (u.id.length * 47) % 360,
	isMinor: false,
	tenantIds: [],
	dailyMinutes: 20,
	referralCode: u.id.replace('u_', '').toUpperCase().slice(0, 6) + '26',
	creditsDays: 0,
	plan: { id: 'free', until: 0 },
	verified: {},
	streak: 0,
	status: 'active',
	joinedAt: now - 120 * DAY,
	...u
});

export function seedUsers(now: number): User[] {
	const U = (u: Partial<User> & Pick<User, 'id' | 'name' | 'email' | 'roles'>) => baseUser(u, now);
	const adult = { nin: true, results: true, pledge: true } as const;
	return [
		U({ id: 'u_ada', name: 'Ada Okafor', email: 'ada@demo.schoolxense.ng', roles: ['learner'], isMinor: true, guardianId: 'u_ngozi', tenantIds: ['greenfield'], state: 'Lagos', institution: 'Greenfield Schools', level: 'SS3', examTarget: 'jamb', examDate: now + 64 * DAY, dailyMinutes: 20, plan: { id: 'plus_month', until: now + 19 * DAY }, streak: 9, hue: 28, creditsDays: 7 }),
		U({ id: 'u_chidi', name: 'Chidi Eze', email: 'chidi@demo.schoolxense.ng', roles: ['learner', 'tutor', 'creator', 'teamlead', 'ambassador'], state: 'Lagos', institution: 'University of Lagos', level: '300 Level', examTarget: 'campus', verified: { ...adult, safeguarding: true, minorsApproved: true }, slug: 'chidi-eze', headline: 'Engineering Maths & MTH 101 · UNILAG 300L', bio: 'I passed MTH 101 with an A and have tutored 140+ sessions. I teach by working problems with you, not for you.', languages: ['English', 'Igbo', 'Pidgin'], payout: { bank: 'GTBank', account: '••••4821', name: 'CHIDI EZE', matched: true }, streak: 22, hue: 210, plan: { id: 'plus_year', until: now + 200 * DAY } }),
		U({ id: 'u_tunde', name: 'Tunde Bakare', email: 'tunde@demo.schoolxense.ng', roles: ['tutor', 'creator'], state: 'Lagos', institution: 'University of Lagos', level: '400 Level', verified: { ...adult, safeguarding: true, minorsApproved: true }, slug: 'tunde-bakare', headline: 'JAMB & WAEC Physics · A1 · 4.9★', bio: 'Physics A1 (WAEC), 312 in JAMB. Waves and optics are my favourite topics to make simple.', languages: ['English', 'Yoruba'], payout: { bank: 'Access Bank', account: '••••1190', name: 'BAKARE TUNDE', matched: true }, hue: 160 }),
		U({ id: 'u_bisi', name: 'Bisi Adewale', email: 'bisi@demo.schoolxense.ng', roles: ['tutor', 'creator'], state: 'Oyo', institution: 'University of Ibadan', level: 'Graduate', verified: { ...adult, safeguarding: true, minorsApproved: true }, slug: 'bisi-adewale', headline: 'Chemistry & draft feedback · UI graduate', bio: 'Organic chemistry without memorising everything. I also give feedback on your own lab reports — I explain, you rewrite.', languages: ['English', 'Yoruba'], payout: { bank: 'Opay', account: '••••7781', name: 'ADEWALE BISI', matched: true }, hue: 330 }),
		U({ id: 'u_musa', name: 'Musa Ibrahim', email: 'musa@demo.schoolxense.ng', roles: ['tutor', 'creator'], state: 'Kano', institution: 'Bayero University Kano', level: '400 Level', verified: { ...adult }, slug: 'musa-ibrahim', headline: 'Mathematics in English & Hausa', bio: 'Algebra and statistics for JAMB and 100-level. Na koya da Hausa ma.', languages: ['English', 'Hausa'], hue: 95 }),
		U({ id: 'u_amina', name: 'Amina Yusuf', email: 'amina@demo.schoolxense.ng', roles: ['creator'], state: 'Kaduna', institution: 'Ahmadu Bello University', verified: { ...adult }, headline: 'Hausa translator · Studio reviewer', languages: ['English', 'Hausa'], hue: 280 }),
		U({ id: 'u_kemi', name: 'Dr Kemi Alade', email: 'kemi@demo.schoolxense.ng', roles: ['tutor'], state: 'FCT', institution: 'University of Abuja', level: 'Postgraduate', verified: { ...adult }, slug: 'kemi-alade', headline: 'Research methods & data analysis coach', bio: 'PhD in public health. I coach research design, SPSS/R and literature search. I never write your project for you.', languages: ['English'], hue: 15 }),
		U({ id: 'u_sule', name: 'Baba Sule Garba', email: 'sule@demo.schoolxense.ng', roles: ['tutor'], state: 'Niger', headline: 'Farmer field mentor · 30 years in maize & poultry', slug: 'baba-sule', bio: 'I host school farm clubs on my farm near Minna. Practical soil, crop and poultry sessions for WAEC Agric.', languages: ['Hausa', 'English', 'Pidgin'], verified: { nin: true, pledge: true, safeguarding: true, minorsApproved: true }, hue: 70 }),
		U({ id: 'u_adaeze', name: 'Adaeze Nwosu', email: 'adaeze@demo.schoolxense.ng', roles: ['tutor', 'teamlead', 'creator'], state: 'Lagos', institution: 'University of Lagos', level: 'Graduate', verified: { ...adult, safeguarding: true, minorsApproved: true }, slug: 'adaeze-nwosu', headline: 'Physics cohort host · team lead', languages: ['English', 'Igbo'], hue: 250 }),
		U({ id: 'u_zainab', name: 'Zainab Bello', email: 'zainab@demo.schoolxense.ng', roles: ['learner'], state: 'FCT', institution: 'Nile University', level: '100 Level', examTarget: 'campus', hue: 300, streak: 3, referredBy: 'u_chidi' }),
		U({ id: 'u_ngozi', name: 'Ngozi Okafor', email: 'ngozi@demo.schoolxense.ng', roles: ['guardian'], children: ['u_ada'], state: 'Lagos', spendingLimitKobo: 3_000_000, hue: 20 }),
		U({ id: 'u_adeyemi', name: 'Mrs Funke Adeyemi', email: 'principal@greenfield.edu.ng', roles: ['instadmin'], tenantIds: ['greenfield'], state: 'Lagos', hue: 200 }),
		U({ id: 'u_fatima', name: 'Fatima Lawal', email: 'fatima@schoolxense.ng', roles: ['staff'], staffRole: 'admin', hue: 345 }),
		U({ id: 'u_emeka', name: 'Emeka Obi', email: 'emeka@demo.schoolxense.ng', roles: ['learner'], isMinor: true, tenantIds: ['greenfield'], level: 'SS3', examTarget: 'waec', hue: 120 }),
		U({ id: 'u_new', name: 'Ifeoma Uche', email: 'ifeoma@demo.schoolxense.ng', roles: ['tutor'], state: 'Enugu', institution: 'University of Nigeria, Nsukka', verified: { pledge: true }, headline: 'Biology tutor (verification pending)', hue: 180, joinedAt: now - 3 * DAY })
	];
}

export const PERSONAS: { userId: string; label: string; role: Role; blurb: string; landing: string }[] = [
	{ userId: 'u_ada', label: 'Ada · SS3 learner', role: 'learner', blurb: 'JAMB candidate (17), guardian-linked, Greenfield Schools seat', landing: '/home' },
	{ userId: 'u_chidi', label: 'Chidi · student earner', role: 'tutor', blurb: 'UNILAG 300L — learner, tutor, creator, team lead, ambassador', landing: '/earn' },
	{ userId: 'u_tunde', label: 'Tunde · Physics tutor', role: 'tutor', blurb: 'Verified, approved for minors, Studio writer', landing: '/earn' },
	{ userId: 'u_ngozi', label: 'Ngozi · guardian', role: 'guardian', blurb: "Ada's mother — consents, limits, recordings", landing: '/family' },
	{ userId: 'u_adeyemi', label: 'Mrs Adeyemi · school admin', role: 'instadmin', blurb: 'Greenfield Schools tenant console', landing: '/inst/greenfield/overview' },
	{ userId: 'u_sule', label: 'Baba Sule · field mentor', role: 'tutor', blurb: 'Hive Skills farmer mentor', landing: '/skills/hub' },
	{ userId: 'u_fatima', label: 'Fatima · operations', role: 'staff', blurb: 'Trust, payouts, reconciliation, flags, audit', landing: '/ops' }
];

export function seedOffers(now: number): Offer[] {
	const O = (o: Partial<Offer> & Pick<Offer, 'id' | 'tutorId' | 'title' | 'subjects' | 'priceKobo'>): Offer => ({ kind: 'tutoring', topics: [], level: ['SS3'], languages: ['English'], rating: 4.7, reviews: 20, completion: 0.95, sessions: 40, verifiedAt: now - 200 * DAY, minorsApproved: false, module: 'tutors', availability: ['Thu 18:00', 'Fri 16:00', 'Sat 09:00'], active: true, ...o });
	return [
		O({ id: 'o_tunde_phy', tutorId: 'u_tunde', title: 'JAMB & WAEC Physics — Waves, Optics, Mechanics', subjects: ['Physics'], topics: ['Waves', 'Optics', 'Mechanics', 'Electricity'], level: ['SS2', 'SS3'], languages: ['English', 'Yoruba'], priceKobo: 187_500, rating: 4.9, reviews: 128, completion: 0.98, sessions: 212, minorsApproved: true, module: 'secondary' }),
		O({ id: 'o_chidi_mth', tutorId: 'u_chidi', title: 'MTH 101 & Engineering Maths — worked problems', subjects: ['MTH 101', 'Mathematics'], topics: ['Set theory', 'Quadratic equations', 'Indices & logarithms', 'Algebra'], level: ['100 Level', '200 Level', 'SS3'], languages: ['English', 'Igbo', 'Pidgin'], priceKobo: 200_000, rating: 4.8, reviews: 96, completion: 0.97, sessions: 141, minorsApproved: true, module: 'campus' }),
		O({ id: 'o_bisi_chem', tutorId: 'u_bisi', title: 'Chemistry made logical — Mole concept to Organic', subjects: ['Chemistry'], topics: ['Mole concept', 'Organic chemistry', 'Acids & bases'], languages: ['English', 'Yoruba'], priceKobo: 175_000, rating: 4.8, reviews: 77, completion: 0.96, sessions: 118, minorsApproved: true, module: 'secondary' }),
		O({ id: 'o_bisi_fb', tutorId: 'u_bisi', kind: 'feedback', title: 'Feedback on your own lab report or essay draft', subjects: ['Chemistry', 'English'], topics: ['Structure', 'Referencing', 'Grammar'], level: ['100 Level', '200 Level', '300 Level'], priceKobo: 250_000, rating: 4.9, reviews: 41, completion: 1, sessions: 52, module: 'tutors' }),
		O({ id: 'o_musa_math', tutorId: 'u_musa', title: 'Algebra & Statistics in English or Hausa', subjects: ['Mathematics'], topics: ['Algebra', 'Statistics', 'Indices & logs'], languages: ['English', 'Hausa'], priceKobo: 120_000, rating: 4.6, reviews: 33, completion: 0.93, sessions: 58, module: 'secondary' }),
		O({ id: 'o_kemi_res', tutorId: 'u_kemi', kind: 'coaching', title: 'Research methods & SPSS/R coaching', subjects: ['Research methods'], topics: ['Research design', 'Literature search', 'Data analysis'], level: ['400 Level', 'Postgraduate'], priceKobo: 600_000, rating: 5.0, reviews: 22, completion: 1, sessions: 31, module: 'tutors' }),
		O({ id: 'o_sule_farm', tutorId: 'u_sule', kind: 'skills', title: 'Farm practical: soil, maize & poultry (school clubs)', subjects: ['Agricultural Science'], topics: ['Soil science', 'Crop production', 'Animal husbandry'], languages: ['Hausa', 'English', 'Pidgin'], priceKobo: 150_000, rating: 4.9, reviews: 18, completion: 1, sessions: 26, minorsApproved: true, module: 'skills', availability: ['Sat 08:00', 'Sat 10:00'] }),
		O({ id: 'o_adaeze_phy', tutorId: 'u_adaeze', title: 'Physics problem clinic (group, max 6)', subjects: ['Physics'], topics: ['Electricity', 'Heat', 'Mechanics'], priceKobo: 90_000, rating: 4.7, reviews: 54, completion: 0.95, sessions: 80, minorsApproved: true, module: 'secondary' }),
		O({ id: 'o_ifeoma_bio', tutorId: 'u_new', title: 'Biology for JAMB — Genetics & Ecology', subjects: ['Biology'], topics: ['Genetics', 'Ecology', 'Cell biology'], priceKobo: 100_000, rating: 0, reviews: 0, completion: 0, sessions: 0, verifiedAt: now - 2 * DAY, module: 'secondary', active: false })
	];
}

export function seedCohorts(now: number): Cohort[] {
	return [
		{ id: 'c_jamb_phy', hostId: 'u_adaeze', coHosts: [{ userId: 'u_adaeze', bp: 6000 }, { userId: 'u_tunde', bp: 4000 }], title: 'JAMB Physics Sprint — 6 weekends to 280+', exam: 'jamb', subject: 'physics', startsAt: now + 6 * DAY, weeks: 6, seats: 12, members: ['u_ada', 'u_emeka', 'u_zainab', 'x1', 'x2', 'x3'], priceKobo: 1_200_000, schedule: 'Sat 10:00 · 90 min', module: 'cohorts', description: 'Diagnostic, weekly live clinics, two full mocks and a WhatsApp-free, on-platform thread. Co-hosted by Adaeze and Tunde.', minorsAllowed: true },
		{ id: 'c_mth101', hostId: 'u_chidi', coHosts: [{ userId: 'u_chidi', bp: 10000 }], title: 'MTH 101 Exam Bootcamp (UNILAG & UNIABUJA)', exam: 'campus', subject: 'mth101', startsAt: now + 12 * DAY, weeks: 3, seats: 20, members: ['u_zainab', 'y1', 'y2', 'y3', 'y4', 'y5', 'y6', 'y7', 'y8'], priceKobo: 800_000, schedule: 'Tue & Thu 19:00', module: 'campus', description: 'Every past-question type for MTH 101, with timed mini-mocks after each session.', minorsAllowed: false },
		{ id: 'c_waec_chem', hostId: 'u_bisi', coHosts: [{ userId: 'u_bisi', bp: 10000 }], title: 'WAEC Chemistry Practicals (virtual lab)', exam: 'waec', subject: 'chemistry', startsAt: now + 20 * DAY, weeks: 4, seats: 15, members: ['z1', 'z2', 'z3', 'z4'], priceKobo: 900_000, schedule: 'Sun 15:00', module: 'cohorts', description: 'Titration, salt analysis and organic tests, explained step by step.', minorsAllowed: true },
		{ id: 'c_ielts', hostId: 'u_kemi', coHosts: [{ userId: 'u_kemi', bp: 10000 }], title: 'IELTS Academic Band 7 Cohort', exam: 'ielts', subject: 'reading', startsAt: now + 9 * DAY, weeks: 5, seats: 10, members: ['p1', 'p2', 'p3'], priceKobo: 2_500_000, schedule: 'Mon & Wed 20:00', module: 'pro', description: 'Reading, writing tasks 1 & 2 and speaking drills with weekly band estimates.', minorsAllowed: false }
	];
}

export function seedPacks(now: number): Pack[] {
	const P = (p: Partial<Pack> & Pick<Pack, 'id' | 'slug' | 'authorId' | 'title' | 'subject' | 'exam' | 'priceKobo'>): Pack => ({ kind: 'notes', pages: 24, rating: 4.7, sales: 120, originality: 0.04, status: 'live', preview: [], version: 1, createdAt: now - 60 * DAY, ...p });
	return [
		P({ id: 'p_optics', slug: 'optics-in-12-diagrams', authorId: 'u_tunde', title: 'Optics in 12 Diagrams', subject: 'Physics', exam: 'JAMB/WAEC', priceKobo: 150_000, pages: 18, sales: 412, rating: 4.9, preview: ['Ray diagrams for every lens position, drawn the way examiners mark them.', 'Sign convention cheat-sheet (real-is-positive).', '20 past-question walk-throughs.'], version: 3 }),
		P({ id: 'p_organic', slug: 'organic-chemistry-flashcards', authorId: 'u_bisi', title: 'Organic Chemistry Flashcards (180 cards)', subject: 'Chemistry', exam: 'JAMB/WAEC', kind: 'flashcards', priceKobo: 120_000, pages: 45, sales: 298, rating: 4.8, preview: ['Homologous series at a glance.', 'Reaction map: alkanes → alkenes → alcohols → acids.'] }),
		P({ id: 'p_mth101', slug: 'mth101-worked-solutions', authorId: 'u_chidi', title: 'MTH 101 Worked Solutions 2019–2025', subject: 'MTH 101', exam: 'Campus', kind: 'worked-solutions', priceKobo: 250_000, pages: 64, sales: 233, rating: 4.8, preview: ['Every question from 7 sessions, fully worked.', 'Common traps in set theory and logs.'], version: 2 }),
		P({ id: 'p_hausa_math', slug: 'jamb-maths-in-hausa', authorId: 'u_musa', title: 'JAMB Mathematics — bayani da Hausa', subject: 'Mathematics', exam: 'JAMB', priceKobo: 100_000, pages: 30, sales: 87, rating: 4.6, preview: ['Algebra and statistics explained in Hausa with English terms.'] }),
		P({ id: 'p_farm', slug: 'farm-records-starter', authorId: 'u_sule', title: 'Farm Records Starter (printable)', subject: 'Agricultural Science', exam: 'WAEC/Skills', priceKobo: 50_000, pages: 12, sales: 64, rating: 4.9, preview: ['Cash book, inventory and production record templates.'] }),
		P({ id: 'p_pending', slug: 'genetics-made-simple', authorId: 'u_new', title: 'Genetics Made Simple', subject: 'Biology', exam: 'JAMB', priceKobo: 80_000, status: 'checking', sales: 0, rating: 0, originality: 0.27, createdAt: now - DAY })
	];
}

export function seedBriefs(now: number): StudioBrief[] {
	return [
		{ id: 'b1', kind: 'write', exam: 'jamb', subject: 'physics', topic: 'Optics', needed: 40, rewardKobo: 30_000, deadline: now + 9 * DAY },
		{ id: 'b2', kind: 'write', exam: 'jamb', subject: 'chemistry', topic: 'Organic chemistry', needed: 60, rewardKobo: 30_000, deadline: now + 12 * DAY },
		{ id: 'b3', kind: 'review', exam: 'campus', subject: 'mth101', topic: 'Quadratic equations', needed: 120, rewardKobo: 8_000, deadline: now + 5 * DAY },
		{ id: 'b4', kind: 'translate', exam: 'waec', subject: 'agric', topic: 'Soil science', needed: 500, rewardKobo: 12_000, language: 'Hausa', deadline: now + 21 * DAY },
		{ id: 'b5', kind: 'explainer', exam: 'jamb', subject: 'mathematics', topic: 'Indices & logs', needed: 25, rewardKobo: 80_000, deadline: now + 14 * DAY },
		{ id: 'b6', kind: 'write', exam: 'ican', subject: 'financial-reporting', topic: 'Consolidation', needed: 200, rewardKobo: 60_000, deadline: now + 30 * DAY }
	];
}

export function seedSubmissions(now: number): StudioSubmission[] {
	return [
		{ id: 'ss1', briefId: 'b1', authorId: 'u_adaeze', stem: 'A concave mirror has a radius of curvature of 30 cm. Its focal length is', options: ['60 cm', '30 cm', '15 cm', '7.5 cm'], answer: 2, explanation: 'f = r/2 = 15 cm.', topic: 'Optics', exam: 'jamb', subject: 'physics', status: 'pending', approvals: ['u_tunde'], rejections: [], originality: 0.02, createdAt: now - 2 * DAY },
		{ id: 'ss2', briefId: 'b2', authorId: 'u_musa', stem: 'Which compound is an isomer of butane?', options: ['Propane', '2-methylpropane', 'Butene', 'Cyclobutane'], answer: 1, explanation: '2-methylpropane has the same formula C₄H₁₀ with a different structure.', topic: 'Organic chemistry', exam: 'jamb', subject: 'chemistry', status: 'pending', approvals: [], rejections: [], originality: 0.05, createdAt: now - DAY },
		{ id: 'ss3', briefId: 'b1', authorId: 'u_chidi', stem: 'Total internal reflection can only occur when light travels from', options: ['Air to glass', 'A less dense to a denser medium', 'A denser to a less dense medium', 'Vacuum to water'], answer: 2, explanation: 'TIR requires going from higher n to lower n at an angle greater than the critical angle.', topic: 'Optics', exam: 'jamb', subject: 'physics', status: 'approved', approvals: ['u_tunde', 'u_bisi'], rejections: [], originality: 0.01, createdAt: now - 10 * DAY }
	];
}

export function seedTeams(now: number): Team[] {
	return [
		{ id: 't_phys', name: 'UNILAG Physics Crew', leadId: 'u_adaeze', members: [{ userId: 'u_adaeze', bp: 3000, accepted: true, role: 'Lead' }, { userId: 'u_tunde', bp: 2500, accepted: true, role: 'Tutor' }, { userId: 'u_bisi', bp: 2500, accepted: true, role: 'Reviewer' }, { userId: 'u_musa', bp: 2000, accepted: true, role: 'Tutor' }], subjects: ['Physics', 'Chemistry'], rating: 4.8, createdAt: now - 90 * DAY, blurb: 'Revision programmes and question reviews for JAMB/WAEC sciences.' },
		{ id: 't_maths', name: 'Engineering Maths Tutors', leadId: 'u_chidi', members: [{ userId: 'u_chidi', bp: 4000, accepted: true, role: 'Lead' }, { userId: 'u_musa', bp: 3000, accepted: true, role: 'Tutor' }, { userId: 'u_adaeze', bp: 3000, accepted: false, role: 'Tutor' }], subjects: ['MTH 101', 'Mathematics'], rating: 4.7, createdAt: now - 40 * DAY, blurb: '100–200 level maths cohorts and course question banks.' },
		{ id: 't_hausa', name: 'Hausa Translation Crew', leadId: 'u_amina', members: [{ userId: 'u_amina', bp: 5000, accepted: true, role: 'Lead' }, { userId: 'u_musa', bp: 5000, accepted: true, role: 'Translator' }], subjects: ['Agric', 'Mathematics'], rating: 4.9, createdAt: now - 30 * DAY, blurb: 'Explanations into Hausa for Studio and Hive Skills voice lessons.' }
	];
}

export function seedContracts(now: number): Contract[] {
	return [
		{ id: 'k_greenfield', title: 'JAMB Physics revision · 400 SS3 students', posterName: 'Greenfield Schools', posterTenantId: 'greenfield', budgetKobo: 120_000_000, weeks: 6, tags: ['Physics', 'JAMB', 'Cohorts'], milestones: [{ id: 'm1', title: 'Wk 1–2 diagnostic', amountKobo: 30_000_000, status: 'released' }, { id: 'm2', title: 'Wk 3–4 cohorts', amountKobo: 45_000_000, status: 'active' }, { id: 'm3', title: 'Wk 5–6 mocks', amountKobo: 45_000_000, status: 'pending' }], status: 'awarded', awardedTeamId: 't_phys', bids: [{ teamId: 't_phys', amountKobo: 120_000_000, note: 'Four verified tutors, two approved for minors.', at: now - 30 * DAY }], description: 'Run diagnostic, weekly cohorts and two full mocks for all SS3 arms. Readiness report per class at each milestone.', createdAt: now - 35 * DAY },
		{ id: 'k_studio_chem', title: 'Review 2,000 Chemistry questions', posterName: 'Hive Studio', budgetKobo: 16_000_000, weeks: 4, tags: ['Chemistry', 'Review', 'Studio'], milestones: [{ id: 'm1', title: '1,000 reviewed', amountKobo: 8_000_000, status: 'pending' }, { id: 'm2', title: '2,000 reviewed', amountKobo: 8_000_000, status: 'pending' }], status: 'open', bids: [{ teamId: 't_phys', amountKobo: 15_500_000, note: 'Bisi leads review; two-reviewer standard.', at: now - DAY }], description: 'Two-reviewer approval against the Studio rubric. ₦80 per approved review.', createdAt: now - 4 * DAY },
		{ id: 'k_translate', title: 'Translate 500 Agric explanations into Hausa', posterName: 'Hive Skills', budgetKobo: 6_000_000, weeks: 3, tags: ['Translation', 'Hausa', 'Agric'], milestones: [{ id: 'm1', title: '250 explanations', amountKobo: 3_000_000, status: 'pending' }, { id: 'm2', title: '500 explanations', amountKobo: 3_000_000, status: 'pending' }], status: 'open', bids: [], description: 'Plain, spoken-style Hausa suitable for voice lessons. Glossary provided.', createdAt: now - 2 * DAY },
		{ id: 'k_lasg', title: 'MTH 101 cohort for 150 scholarship students', posterName: 'Lagos State Scholarship Board', posterTenantId: 'lasg-sponsor', budgetKobo: 45_000_000, weeks: 3, tags: ['MTH 101', 'Cohorts', 'Campus'], milestones: [{ id: 'm1', title: 'Cohort weeks 1–2', amountKobo: 30_000_000, status: 'pending' }, { id: 'm2', title: 'Mock + report', amountKobo: 15_000_000, status: 'pending' }], status: 'open', bids: [], description: 'Three cohorts of 50, one mock exam, and an outcome report for the board.', createdAt: now - 6 * 3_600_000 }
	];
}

export function seedTasks(now: number): Task[] {
	const T = (t: Partial<Task> & Pick<Task, 'id' | 'title' | 'kind' | 'rewardKobo' | 'minutes' | 'subject'>): Task => ({ status: 'open', createdAt: now - DAY, ...t });
	return [
		T({ id: 'tk1', title: 'Review 10 Optics questions against the rubric', kind: 'review', rewardKobo: 80_000, minutes: 25, subject: 'Physics' }),
		T({ id: 'tk2', title: 'Transcribe one page of 2014 WAEC Biology', kind: 'transcribe', rewardKobo: 50_000, minutes: 20, subject: 'Biology' }),
		T({ id: 'tk3', title: 'Record a 2-min explainer: critical angle', kind: 'record', rewardKobo: 150_000, minutes: 30, subject: 'Physics' }),
		T({ id: 'tk4', title: 'Moderate 15 Library pack reports', kind: 'moderate', rewardKobo: 60_000, minutes: 20, subject: 'General' }),
		T({ id: 'tk5', title: 'Translate 8 Agric explanations to Yoruba', kind: 'translate', rewardKobo: 96_000, minutes: 30, subject: 'Agric' }),
		T({ id: 'tk6', title: 'Review 10 MTH 101 set-theory items', kind: 'review', rewardKobo: 80_000, minutes: 25, subject: 'MTH 101', status: 'submitted', claimedBy: 'u_musa', submission: 'Approved 8, flagged 2 (ambiguous option C).' })
	];
}

export function seedTenants(now: number): Tenant[] {
	return [
		{ id: 'greenfield', name: 'Greenfield Schools', kind: 'school', seats: 450, members: ['u_ada', 'u_emeka', 'u_adeyemi'], modules: ['secondary', 'tutors', 'cohorts', 'institutions'], theme: { brand: '#0f766e', accent: '#1e3a8a', logoText: 'GF' }, licenceEnds: now + 240 * DAY, classes: [{ name: 'SS3A', learners: 142, readiness: 66, active7d: 131 }, { name: 'SS3B', learners: 138, readiness: 58, active7d: 120 }, { name: 'SS3C', learners: 132, readiness: 53, active7d: 117 }], state: 'Lagos', subdomain: 'greenfield.schoolxense.ewinproject.org' },
		{ id: 'unilag-csc', name: 'UNILAG · Dept. of Computer Science', kind: 'university', seats: 600, members: ['u_chidi'], modules: ['campus', 'institutions'], theme: { brand: '#7c2d12', accent: '#1e3a8a', logoText: 'UL' }, licenceEnds: now + 300 * DAY, classes: [{ name: '100 Level', learners: 210, readiness: 61, active7d: 170 }, { name: '200 Level', learners: 188, readiness: 64, active7d: 140 }], state: 'Lagos', subdomain: 'unilag-csc.schoolxense.ewinproject.org' },
		{ id: 'lasg-sponsor', name: 'Lagos State Scholarship Board', kind: 'sponsor', seats: 5000, members: [], modules: ['secondary', 'campus'], theme: { brand: '#b91c1c', accent: '#14532d', logoText: 'LS' }, licenceEnds: now + 150 * DAY, classes: [{ name: 'Ikeja LGA', learners: 1240, readiness: 57, active7d: 980 }, { name: 'Epe LGA', learners: 860, readiness: 49, active7d: 610 }, { name: 'Badagry LGA', learners: 910, readiness: 51, active7d: 702 }], state: 'Lagos', subdomain: 'lasg.schoolxense.ewinproject.org' }
	];
}

export function seedHostedExams(now: number, qids: string[]): HostedExam[] {
	return [
		{ id: 'he_mock2', tenantId: 'greenfield', title: 'SS3 JAMB Mock 2', exam: 'jamb', subject: 'physics', date: now + 41 * DAY, seats: 412, durationMin: 30, status: 'scheduled', questionIds: qids.slice(0, 15), candidates: ['u_ada', 'u_emeka'] },
		{ id: 'he_mock1', tenantId: 'greenfield', title: 'SS3 JAMB Mock 1', exam: 'jamb', subject: 'physics', date: now - 20 * DAY, seats: 405, durationMin: 30, status: 'closed', questionIds: qids.slice(0, 15), candidates: ['u_ada', 'u_emeka'] },
		{ id: 'he_live', tenantId: 'greenfield', title: 'SS3 Physics Weekly Test', exam: 'jamb', subject: 'physics', date: now - 3_600_000, seats: 140, durationMin: 20, status: 'live', questionIds: qids.slice(0, 10), candidates: ['u_ada', 'u_emeka'] }
	];
}

export const SEED_FLAGS: FeatureFlag[] = [
	{ key: 'forge.adaptive', enabled: true, rollout: 100, description: 'Forge IRT next-item picker on practice', scope: 'all' },
	{ key: 'market.escrow', enabled: true, rollout: 100, description: 'Escrow-protected bookings with 48h dispute window', scope: 'all' },
	{ key: 'collab.handoffs', enabled: true, rollout: 100, description: 'Referral hand-offs between tutors (2% collab slice)', scope: 'all' },
	{ key: 'studio.royalties', enabled: true, rollout: 100, description: 'Monthly royalty pool (10% of subscription net)', scope: 'all' },
	{ key: 'live.video', enabled: true, rollout: 50, description: 'Cloudflare Realtime SFU video in session rooms (audio-first fallback)', scope: 'role' },
	{ key: 'ai.feedback_assistant', enabled: false, rollout: 10, description: 'Draft feedback assistant — explains, never rewrites', scope: 'role' },
	{ key: 'ussd.drills', enabled: true, rollout: 100, description: 'USSD *384*HIVE# daily drills', scope: 'all' },
	{ key: 'pro.ican', enabled: false, rollout: 0, description: 'ICAN track (needs ≥ 2,000 reviewed items)', scope: 'all' },
	{ key: 'inst.white_label', enabled: true, rollout: 100, description: 'Tenant theming and subdomains', scope: 'tenant' }
];
