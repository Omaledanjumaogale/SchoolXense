/** Academic catalogue + module registry — merges SchoolCBT (NERDC subjects), CollegeCBT (institution registry) and ExamForge (professional exams). */

export type ModuleId =
	| 'secondary' | 'campus' | 'pro' | 'forge' | 'tutors' | 'cohorts' | 'library'
	| 'studio' | 'collab' | 'skills' | 'institutions' | 'ambassadors' | 'record';

export interface HiveModule {
	id: ModuleId;
	name: string;
	builtFrom: string;
	glyph: string; // icon name
	side: 'learn' | 'earn' | 'institution' | 'core';
	tagline: string;
	serves: string;
	earners: string;
	revenue: string;
	href: string; // public landing
	appHref: string; // signed-in entry
	accent: string;
	release: 'R1' | 'R2' | 'R3' | 'R4';
}

export const MODULES: HiveModule[] = [
	{ id: 'secondary', name: 'Hive Secondary', builtFrom: 'SchoolCBT', glyph: 'pencil', side: 'learn', tagline: 'JAMB, WAEC, NECO and NABTEB — adaptive CBT that finds weak topics in 20 questions.', serves: 'Secondary candidates and parents', earners: 'Peer tutors (18+), question creators', revenue: 'Hive Plus, exam passes', href: '/secondary', appHref: '/practice/jamb/physics', accent: '#1E3A8A', release: 'R1' },
	{ id: 'campus', name: 'Hive Campus', builtFrom: 'CollegeCBT', glyph: 'pillar', side: 'learn', tagline: 'Course-level CBT for 100+ universities, polytechnics and colleges.', serves: 'University, polytechnic and college students', earners: 'Course tutors, mock-exam creators', revenue: 'Hive Plus subscriptions', href: '/campus', appHref: '/practice/campus/mth101', accent: '#2563EB', release: 'R1' },
	{ id: 'pro', name: 'Hive Pro', builtFrom: 'ExamForge', glyph: 'flame', side: 'learn', tagline: 'ICAN, JUPEB and IELTS on the Forge engine, with small paid cohorts.', serves: 'Professional-exam candidates', earners: 'Professional coaches, cohort hosts', revenue: 'Pro subscriptions, cohort fees', href: '/pro', appHref: '/practice/ican/financial-reporting', accent: '#0F766E', release: 'R4' },
	{ id: 'forge', name: 'Forge Engine', builtFrom: 'ExamForge', glyph: 'cpu', side: 'core', tagline: 'IRT ability per topic, SM-2 review, daily drills, readiness ranges.', serves: 'Every exam module', earners: '—', revenue: 'Powers retention and upgrades', href: '/secondary#forge', appHref: '/review', accent: '#B45309', release: 'R2' },
	{ id: 'tutors', name: 'Hive Tutors', builtFrom: 'SchoolXense', glyph: 'users', side: 'earn', tagline: 'Verified 1:1 and group help, draft feedback and research coaching — escrow-protected.', serves: 'Any learner', earners: 'Peer tutors, editors, research coaches', revenue: '20% session fee', href: '/tutors', appHref: '/book', accent: '#B45309', release: 'R2' },
	{ id: 'cohorts', name: 'Hive Cohorts', builtFrom: 'SchoolXense', glyph: 'calendar', side: 'earn', tagline: 'Exam-season revision groups with co-host revenue splits.', serves: 'Exam-season groups', earners: 'Cohort hosts and co-hosts', revenue: '20% cohort fee', href: '/cohorts', appHref: '/cohorts', accent: '#B45309', release: 'R2' },
	{ id: 'library', name: 'Hive Library', builtFrom: 'SchoolXense', glyph: 'book', side: 'earn', tagline: 'Original notes, flashcards and worked solutions — originality-checked.', serves: 'Any learner', earners: 'Study-pack authors', revenue: '15% resource fee', href: '/library', appHref: '/library', accent: '#B45309', release: 'R3' },
	{ id: 'studio', name: 'Hive Studio', builtFrom: 'ExamForge writer program', glyph: 'pen', side: 'earn', tagline: 'Write, review and translate questions. Paid per accepted item plus monthly royalties.', serves: 'The question bank', earners: 'Writers, reviewers, translators, explainer creators', revenue: 'Royalty pool from subscriptions', href: '/studio-program', appHref: '/studio', accent: '#6D28D9', release: 'R3' },
	{ id: 'collab', name: 'Hive Collab', builtFrom: 'New', glyph: 'handoff', side: 'earn', tagline: 'Teams, split rules, contracts, micro-tasks and referral hand-offs.', serves: 'Earners working together', earners: 'Team leads, members, task workers', revenue: '12% contract and task fee', href: '/collab', appHref: '/teams', accent: '#15803D', release: 'R3' },
	{ id: 'skills', name: 'Hive Skills', builtFrom: 'New', glyph: 'leaf', side: 'earn', tagline: 'Agric practicals with farmer mentors; record-keeping and phone banking for farmers.', serves: 'Agric learners, farm clubs, farmers', earners: 'Field mentors, skills tutors', revenue: '20% session fee, certificates', href: '/skills', appHref: '/skills/hub', accent: '#4D7C0F', release: 'R4' },
	{ id: 'institutions', name: 'Hive Institutions', builtFrom: 'ExamForge + SchoolCBT school plan', glyph: 'building', side: 'institution', tagline: 'Tenant console, hosted CBT with proctor logs, sponsored seats, white-label.', serves: 'Schools, universities, centres, states', earners: 'Institutional tutor teams, school ambassadors', revenue: 'Licences, hosted CBT, sponsored seats', href: '/for-schools', appHref: '/inst/greenfield/overview', accent: '#334155', release: 'R4' },
	{ id: 'ambassadors', name: 'Hive Ambassadors', builtFrom: 'Replaces E-WIN referral sync', glyph: 'megaphone', side: 'earn', tagline: 'Links, QR codes, attribution and a transparent commission ledger.', serves: 'Campus and school growth', earners: 'Ambassadors and referrers', revenue: 'Paid from the Hive Share', href: '/ambassadors', appHref: '/referrals', accent: '#B45309', release: 'R3' },
	{ id: 'record', name: 'Hive Record', builtFrom: 'New', glyph: 'badge', side: 'core', tagline: 'A verified learning and earning profile you can share with consent.', serves: 'Learners, earners, employers', earners: '—', revenue: 'Verification fees', href: '/record-info', appHref: '/record', accent: '#1E3A8A', release: 'R3' }
];

export const moduleById = (id: ModuleId) => MODULES.find((m) => m.id === id)!;

export interface ExamTrack { id: string; name: string; module: ModuleId; subjects: { id: string; name: string; topics: string[] }[]; format: string }

export const EXAMS: ExamTrack[] = [
	{
		id: 'jamb', name: 'JAMB UTME', module: 'secondary', format: '4 subjects · 180 questions · 2h · score /400',
		subjects: [
			{ id: 'physics', name: 'Physics', topics: ['Waves', 'Optics', 'Mechanics', 'Electricity', 'Heat'] },
			{ id: 'chemistry', name: 'Chemistry', topics: ['Mole concept', 'Organic chemistry', 'Periodic table', 'Acids & bases'] },
			{ id: 'mathematics', name: 'Mathematics', topics: ['Algebra', 'Indices & logs', 'Statistics', 'Geometry'] },
			{ id: 'english', name: 'Use of English', topics: ['Lexis', 'Comprehension', 'Oral English'] },
			{ id: 'biology', name: 'Biology', topics: ['Cell biology', 'Genetics', 'Ecology'] }
		]
	},
	{
		id: 'waec', name: 'WAEC WASSCE', module: 'secondary', format: 'Objective + theory · graded A1–F9',
		subjects: [
			{ id: 'physics', name: 'Physics', topics: ['Waves', 'Optics', 'Mechanics', 'Electricity', 'Heat'] },
			{ id: 'chemistry', name: 'Chemistry', topics: ['Mole concept', 'Organic chemistry', 'Periodic table', 'Acids & bases'] },
			{ id: 'mathematics', name: 'Mathematics', topics: ['Algebra', 'Indices & logs', 'Statistics', 'Geometry'] },
			{ id: 'agric', name: 'Agricultural Science', topics: ['Soil science', 'Crop production', 'Animal husbandry', 'Farm records'] }
		]
	},
	{ id: 'neco', name: 'NECO SSCE', module: 'secondary', format: 'Objective + theory · graded A1–F9', subjects: [{ id: 'mathematics', name: 'Mathematics', topics: ['Algebra', 'Indices & logs', 'Statistics', 'Geometry'] }, { id: 'biology', name: 'Biology', topics: ['Cell biology', 'Genetics', 'Ecology'] }] },
	{ id: 'nabteb', name: 'NABTEB', module: 'secondary', format: 'Technical & business · graded A1–F9', subjects: [{ id: 'mathematics', name: 'Mathematics', topics: ['Algebra', 'Statistics'] }] },
	{
		id: 'campus', name: 'Campus courses', module: 'campus', format: 'Course CBT · custom exams · certificates',
		subjects: [
			{ id: 'mth101', name: 'MTH 101 · General Mathematics I', topics: ['Set theory', 'Indices & logarithms', 'Quadratic equations'] },
			{ id: 'csc101', name: 'CSC 101 · Introduction to Computer Science', topics: ['History of computing', 'Number systems', 'Software types'] },
			{ id: 'eco101', name: 'ECO 101 · Principles of Economics I', topics: ['Supply and demand', 'Elasticity', 'Market structures'] },
			{ id: 'gst111', name: 'GST 111 · Use of English', topics: ['Grammar', 'Comprehension'] }
		]
	},
	{ id: 'ican', name: 'ICAN', module: 'pro', format: 'Professional · pass mark 50%', subjects: [{ id: 'financial-reporting', name: 'Financial Reporting', topics: ['IFRS basics', 'Consolidation', 'Ratios'] }] },
	{ id: 'ielts', name: 'IELTS Academic', module: 'pro', format: 'Band 1–9', subjects: [{ id: 'reading', name: 'Reading & Vocabulary', topics: ['Vocabulary', 'True/False/Not given'] }] },
	{ id: 'jupeb', name: 'JUPEB', module: 'pro', format: 'A-level equivalent · grades A–E', subjects: [{ id: 'economics', name: 'Economics', topics: ['Elasticity', 'National income'] }] },
	{ id: 'skills', name: 'Hive Skills', module: 'skills', format: 'Voice + keypad friendly · certificates', subjects: [{ id: 'farm-records', name: 'Farm records & money', topics: ['Farm records', 'Costing', 'Phone banking'] }] }
];

export const examById = (id: string) => EXAMS.find((e) => e.id === id);

export const INSTITUTION_TYPES = ['University', 'Polytechnic', 'College of Education', 'IEI / Technical'] as const;

export const CAMPUS_REGISTRY: { name: string; type: (typeof INSTITUTION_TYPES)[number]; state: string }[] = [
	{ name: 'University of Lagos', type: 'University', state: 'Lagos' },
	{ name: 'University of Abuja', type: 'University', state: 'FCT' },
	{ name: 'University of Ibadan', type: 'University', state: 'Oyo' },
	{ name: 'Obafemi Awolowo University', type: 'University', state: 'Osun' },
	{ name: 'Ahmadu Bello University', type: 'University', state: 'Kaduna' },
	{ name: 'University of Nigeria, Nsukka', type: 'University', state: 'Enugu' },
	{ name: 'University of Benin', type: 'University', state: 'Edo' },
	{ name: 'Bayero University Kano', type: 'University', state: 'Kano' },
	{ name: 'Lagos State University', type: 'University', state: 'Lagos' },
	{ name: 'Covenant University', type: 'University', state: 'Ogun' },
	{ name: 'Nile University', type: 'University', state: 'FCT' },
	{ name: 'Baze University', type: 'University', state: 'FCT' },
	{ name: 'Yaba College of Technology', type: 'Polytechnic', state: 'Lagos' },
	{ name: 'Federal Polytechnic Nekede', type: 'Polytechnic', state: 'Imo' },
	{ name: 'Kaduna Polytechnic', type: 'Polytechnic', state: 'Kaduna' },
	{ name: 'Federal College of Education, Zaria', type: 'College of Education', state: 'Kaduna' },
	{ name: 'Adeniran Ogunsanya College of Education', type: 'College of Education', state: 'Lagos' }
];

export const FACULTIES: Record<string, Record<string, string[]>> = {
	'Faculty of Science': { 'Computer Science': ['mth101', 'csc101', 'gst111'], Mathematics: ['mth101', 'gst111'] },
	'Faculty of Social Sciences': { Economics: ['eco101', 'mth101', 'gst111'], Sociology: ['gst111'] },
	'Faculty of Engineering': { 'Mechanical Engineering': ['mth101', 'gst111'], 'Electrical Engineering': ['mth101', 'csc101'] }
};
export const LEVELS = ['100 Level', '200 Level', '300 Level', '400 Level', '500 Level'];
export const NIGERIA_STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'];
export const LANGUAGES = ['English', 'Yoruba', 'Hausa', 'Igbo', 'Pidgin'];

export const GLOSSARY: Record<string, { term: string; def: string; related: string[] }> = {
	'hive-share': { term: 'Hive Share', def: 'The rule set that splits every payment between the earner, the platform, referrers, collaboration partners and the Learner Impact Fund before anyone is paid. Recorded in a double-entry ledger.', related: ['escrow', 'learner-impact-fund'] },
	escrow: { term: 'Escrow', def: 'Money held after a learner pays and before the earner is paid. It releases 48 hours after delivery unless the learner opens a dispute.', related: ['hive-share', 'dispute'] },
	'learner-impact-fund': { term: 'Learner Impact Fund', def: '1% of most transactions funds sponsored seats for learners who cannot pay. Its balance and spending are published every quarter.', related: ['hive-share', 'sponsored-seat'] },
	'sponsored-seat': { term: 'Sponsored seat', def: 'A season of Hive Plus paid for by a state, company, alumni group or NGO, at ₦4,000 per learner per exam season.', related: ['learner-impact-fund'] },
	irt: { term: 'Item Response Theory (IRT)', def: 'A model that estimates both how hard a question is and how able a learner is. SchoolXense uses a 2-parameter model to pick the next most informative question.', related: ['readiness', 'spaced-repetition'] },
	'spaced-repetition': { term: 'Spaced repetition (SM-2)', def: 'Missed questions come back at growing intervals — 1 day, 6 days, then longer — so you review just before you would forget.', related: ['irt'] },
	readiness: { term: 'Readiness range', def: 'An estimate of your likely grade band or JAMB score, shown as a range with a confidence level. It narrows as you answer more. It is never a promise.', related: ['irt'] },
	'a1-f9': { term: 'A1–F9', def: 'The WAEC/NECO grading scale. A1 is 75% and above; C6 (50%) is the minimum credit; F9 is a fail.', related: ['readiness'] },
	dispute: { term: 'Dispute', def: 'A learner can dispute a session within 48 hours of completion. Escrow pauses and the trust team reviews the session record.', related: ['escrow'] },
	'split-rules': { term: 'Split rules', def: 'The percentage each Collab team member receives from every contract the team wins. Members accept the rules before joining.', related: ['hive-share'] }
};
