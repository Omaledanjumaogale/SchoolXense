import type { ModuleId } from './catalogue';

export interface Landing {
	module: ModuleId;
	eyebrow: string;
	title: string;
	lead: string;
	primary: { label: string; href: string };
	secondary?: { label: string; href: string };
	stats: [string, string][];
	features: { icon: string; t: string; d: string }[];
	steps?: { t: string; d: string }[];
	audience?: 'learn' | 'earn' | 'institution';
	exams?: string[];
	note?: string;
}

export const LANDINGS: Record<string, Landing> = {
	secondary: {
		module: 'secondary', eyebrow: 'Hive Secondary · formerly SchoolCBT', audience: 'learn',
		title: 'JAMB, WAEC, NECO and NABTEB — practice that knows what you don\'t know yet.',
		lead: 'Adaptive CBT on the Forge engine finds your weak topics in 15–20 questions, then builds a daily drill and a review queue around them. Mocks grade exactly like the real thing: A1–F9 and JAMB score bands.',
		primary: { label: 'Start a free JAMB drill', href: '/practice/jamb/physics' }, secondary: { label: 'For parents', href: '/safety' },
		stats: [['4', 'exam boards'], ['A1–F9', 'grading identical to WAEC'], ['20', 'questions to find weak topics'], ['Mobile', 'responsive learning workspace']],
		exams: ['jamb', 'waec', 'neco', 'nabteb'],
		features: [
			{ icon: 'target', t: 'Adaptive drills', d: 'Each answer updates your ability per topic (2-parameter IRT). The next question is the one that teaches us — and you — the most.' },
			{ icon: 'refresh', t: 'Spaced review', d: 'Missed questions come back at 1, 6, then growing day intervals (SM-2), capped to the minutes you choose.' },
			{ icon: 'chart', t: 'Readiness range', d: 'Your likely JAMB band or WAEC grade as a range with confidence — it narrows as you practise. Never a promise.' },
			{ icon: 'file', t: 'Full mocks & report cards', d: 'Timed mocks, A1–F9 grading, certificates at 70%+, and weekly parent reports.' },
			{ icon: 'signal', t: 'Progress saved live', d: 'Practise online with reviewed questions and a record of your progress.' },
			{ icon: 'phone', t: 'USSD on any phone', d: 'Dial *384*HIVE# for a 10-question daily drill and results — no data needed.' }
		]
	},
	campus: {
		module: 'campus', eyebrow: 'Hive Campus · formerly CollegeCBT', audience: 'learn',
		title: 'Course-level CBT for 100+ universities, polytechnics and colleges.',
		lead: 'Pick Institution → Faculty → Department → Level → Course and practise the exact course you\'re sitting. The bank is lookup-first: if your course is thin, we generate once, review it, and serve it to everyone after.',
		primary: { label: 'Practise MTH 101 free', href: '/practice/campus/mth101' }, secondary: { label: 'Find a course tutor', href: '/tutors' },
		stats: [['100+', 'institutions in the registry'], ['5', 'levels per programme'], ['70%', 'mock score earns a certificate'], ['1×', 'AI cost per question, then reused']],
		exams: ['campus'],
		features: [
			{ icon: 'pillar', t: 'Academic selector', d: 'A five-step selector built for Nigerian higher education, returning in under 300 ms.' },
			{ icon: 'sparkles', t: 'Lookup-first AI bank', d: 'Missing courses get a generated set that is archived, reviewed in Studio and served from the bank thereafter.' },
			{ icon: 'edit', t: 'Custom exams', d: 'Build a mock from the topics your lecturer listed. Time it, grade it, share it with your study group.' },
			{ icon: 'badge', t: 'Certificates', d: 'Verifiable certificates with a public check code — add them to your Hive Record.' },
			{ icon: 'users', t: 'Tutors who passed it', d: 'Course tutors who took the same course, at your school, with results proof.' },
			{ icon: 'calendar', t: 'Exam bootcamps', d: 'Short paid cohorts before semester exams, hosted by top course tutors.' }
		]
	},
	pro: {
		module: 'pro', eyebrow: 'Hive Pro · powered by ExamForge', audience: 'learn',
		title: 'ICAN, JUPEB and IELTS on the Forge engine — without fixed-schedule fees.',
		lead: 'Professional-exam candidates get the same adaptive engine, a readiness predictor tuned to pass/fail, and small paid cohorts with qualified coaches.',
		primary: { label: 'Try IELTS reading', href: '/practice/ielts/reading' }, secondary: { label: 'Browse Pro cohorts', href: '/cohorts' },
		stats: [['3', 'tracks at launch'], ['2,000+', 'reviewed items per track before launch'], ['10', 'seats max per Pro cohort'], ['Band 1–9', 'IELTS estimates']],
		exams: ['ican', 'jupeb', 'ielts'],
		features: [
			{ icon: 'flame', t: 'Adaptive by default', d: 'The ExamForge spark: diagnostics that find gaps fast and a plan that closes them.' },
			{ icon: 'users', t: 'Pro cohorts', d: 'Small, paid cohorts with chartered accountants, JUPEB lecturers and IELTS examiners.' },
			{ icon: 'building', t: 'Staff development', d: 'Employers buy Pro licences for teams preparing for professional exams.' }
		]
	},
	collab: {
		module: 'collab', eyebrow: 'Hive Collab', audience: 'earn',
		title: 'Turn competitors into collaborators.',
		lead: 'Verified earners form teams, agree split rules once, bid on contracts from schools and Studio, claim 30-minute micro-tasks, and pass overflow bookings to teammates for a 2% collaboration share.',
		primary: { label: 'Open the contracts board', href: '/contracts' }, secondary: { label: 'Start a team', href: '/teams' },
		stats: [['88%', 'of contract value to the team'], ['2%', 'collaboration share on hand-offs'], ['30 min', 'typical micro-task'], ['100%', 'split rules accepted before joining']],
		features: [
			{ icon: 'users', t: 'Teams & split rules', d: 'The lead proposes each member\'s percentage. Members accept before joining; rules apply to every contract the team wins.' },
			{ icon: 'file', t: 'Contracts board', d: '“Run JAMB Physics revision for 400 SS3 students”, “Review 2,000 Chemistry questions”. Teams bid; milestones release escrow.' },
			{ icon: 'kanban', t: 'Task board', d: 'Fixed-price units: review one question set, transcribe a past-paper page, record an explainer.' },
			{ icon: 'handoff', t: 'Referral hand-offs', d: 'Fully booked? Pass the session to a verified teammate from inside the booking and keep 2%.' },
			{ icon: 'message', t: 'Threads & presence', d: 'Text-first team threads with attachments on demand, integrity-screened.' }
		]
	},
	skills: {
		module: 'skills', eyebrow: 'Hive Skills', audience: 'earn',
		title: 'Farmers teach the practicals. Students teach the records.',
		lead: 'WAEC and NECO Agricultural Science need practical exposure many schools lack. Working farmers earn as paid field mentors for school farm clubs — and agric and business students earn teaching farmers record-keeping, simple costing and phone banking in local languages, by voice and USSD.',
		primary: { label: 'Open Hive Skills', href: '/skills/hub' }, secondary: { label: 'Become a field mentor', href: '/signup?intent=earn' },
		stats: [['4', 'languages: Hausa, Yoruba, Igbo, Pidgin'], ['Voice', '+ keypad lessons on any phone'], ['80%', 'of each session to the mentor'], ['0', 'produce or inputs sold — learning only']],
		features: [
			{ icon: 'leaf', t: 'Farm-club practicals', d: 'Soil, crop and animal husbandry sessions hosted on real farms, mapped to the WAEC Agric syllabus.' },
			{ icon: 'mic', t: 'Voice lessons', d: 'Short lessons over Africa\'s Talking voice with keypad quizzes — complete without a smartphone.' },
			{ icon: 'receipt', t: 'Records & money', d: 'Cash books, costing and safe phone banking, taught by students who earn while they learn.' },
			{ icon: 'badge', t: 'Skills certificates', d: 'Certificates for farmers and students, verifiable on the Hive Record.' }
		]
	},
	'studio-program': {
		module: 'studio', eyebrow: 'Hive Studio', audience: 'earn',
		title: 'Write the questions a million learners will practise.',
		lead: 'Take a brief, author a question with LaTeX and images, pass two-reviewer approval and an originality check, and get paid per accepted item — plus a monthly royalty every time a paying learner is served your work.',
		primary: { label: 'Open Studio', href: '/studio' }, secondary: { label: 'Apply as a creator', href: '/signup?intent=earn' },
		stats: [['10%', 'of subscription revenue to the royalty pool'], ['2', 'independent approvals per item'], ['₦80', 'per completed review'], ['Monthly', 'royalty runs']],
		features: [
			{ icon: 'pen', t: 'Briefs', d: 'Open briefs by exam, subject and topic, with the reward and deadline up front.' },
			{ icon: 'user-check', t: 'Two-reviewer standard', d: 'Every item needs two approvals from different verified reviewers. Authors can\'t review their own work.' },
			{ icon: 'globe', t: 'Translations', d: 'Explanations into Hausa, Yoruba, Igbo and Pidgin, paid per accepted translation.' },
			{ icon: 'coins', t: 'Royalties', d: 'Paid in proportion to how often your approved questions were served to paying learners.' }
		]
	},
	ambassadors: {
		module: 'ambassadors', eyebrow: 'Hive Ambassadors', audience: 'earn',
		title: 'Grow your campus. Earn on every referral that pays.',
		lead: 'Get a personal link and QR code, track sign-ups to first payments, and earn from the Hive Share: 10% of attributed Hive Plus in year one, 3% of your referred tutors\' sessions, and licence commissions for school ambassadors.',
		primary: { label: 'Open my referrals', href: '/referrals' }, secondary: { label: 'Apply', href: '/signup?intent=earn' },
		stats: [['10%', 'of attributed subscriptions, year one'], ['3%', 'of referred tutors\' sessions'], ['10% / 5%', 'school licence: first year / renewals'], ['Daily', 'payouts above ₦2,000']],
		features: [
			{ icon: 'qr', t: 'Link & QR', d: 'Attribution survives sign-up on another device via code entry.' },
			{ icon: 'chart', t: 'Funnel', d: 'Sign-ups → first payments → commissions by month, with a campus leaderboard.' },
			{ icon: 'gift', t: 'Under-18 friendly', d: 'Students under 18 earn free Plus days for referrals, never cash.' }
		]
	},
	'record-info': {
		module: 'record', eyebrow: 'Hive Record', audience: 'earn',
		title: 'A verified learning and earning record you control.',
		lead: 'Certificates, mastery, sessions delivered, ratings, Studio acceptance and contracts completed — in one profile you can share with consent. Employers verify with a link that expires after 30 days.',
		primary: { label: 'View my Record', href: '/record' }, secondary: { label: 'Verify a certificate', href: '/verify' },
		stats: [['30 days', 'verification link lifetime'], ['Consent', 'per field'], ['0', 'fields shared without you'], ['Instant', 'certificate checks']],
		features: [
			{ icon: 'badge', t: 'Learning record', d: 'Certificates, readiness history and verified mastery by subject.' },
			{ icon: 'coins', t: 'Earning record', d: 'Sessions, ratings, completion rate, Studio items and contracts — the reputation you built.' },
			{ icon: 'link', t: 'Shareable link', d: 'You choose the fields. Every share is logged.' }
		]
	}
};
