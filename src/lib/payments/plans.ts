/** Business Plan § Business model — learner pricing (kobo). */
export const PLANS = [
	{ id: 'free', name: 'Free', priceKobo: 0, period: 'forever', tagline: 'Start practising today', features: ['20 adaptive questions a day', 'JAMB/WAEC/NECO + campus courses', 'Unreviewed AI practice items (labelled)', 'Weekly progress email'], cta: 'Start free' },
	{ id: 'plus_month', name: 'Hive Plus', priceKobo: 200_000, period: 'month', tagline: 'Everything, every subject', features: ['Unlimited adaptive drills + mocks', 'Readiness predictor with confidence', 'Spaced-repetition review queue', 'Offline packs (200 Qs/topic)', 'Certificates + Hive Record'], cta: 'Go Plus', featured: true },
	{ id: 'plus_year', name: 'Hive Plus Annual', priceKobo: 1_500_000, period: 'year', tagline: 'Save ₦9,000 a year', features: ['All Plus features', '2 free cohort mock weekends', 'Priority tutor matching', 'Family sharing for 2 siblings'], cta: 'Go annual' },
	{ id: 'exam_pass', name: 'Exam Pass', priceKobo: 1_000_000, period: '90 days', tagline: 'One exam season, fully loaded', features: ['One exam track (JAMB, WAEC, NECO or NABTEB)', 'Full mocks graded A1–F9 / score bands', 'Parent report cards'], cta: 'Buy pass' },
	{ id: 'plus_tutor', name: 'Plus + Tutor', priceKobo: 2_500_000, period: '90 days', tagline: 'Practice plus a verified tutor', features: ['Exam Pass features', '6 × 45-min tutor sessions', 'Draft feedback on your own work', 'Tutor report after each session'], cta: 'Get matched' }
] as const;

export const INSTITUTION_PRICING = [
	{ id: 'school', name: 'School licence', price: '₦1.5M–₦4M / year', items: ['Unlimited learner seats in one school', 'Class readiness dashboards', 'Hosted CBT at ₦500/candidate', 'White-label portal'] },
	{ id: 'campus', name: 'University & polytechnic', price: 'Per seat', items: ['Departmental practice & mock exams', 'Course-level question banks', 'Proctor event logs', 'SSO + data export'] },
	{ id: 'sponsor', name: 'Sponsored seats', price: '₦4,000 / learner / season', items: ['For states, CSR, alumni and NGOs', 'Outcome reports by LGA and school', 'Activation tracking', 'Quarterly impact audit'] }
] as const;
