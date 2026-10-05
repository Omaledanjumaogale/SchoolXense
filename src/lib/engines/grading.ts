/** WAEC / NECO A1–F9 grading, JAMB score bands, awards — carried from SchoolCBT. */
export type WAECGrade = 'A1' | 'B2' | 'B3' | 'C4' | 'C5' | 'C6' | 'D7' | 'E8' | 'F9';

export const WAEC_SCALE: { min: number; grade: WAECGrade; label: string; passed: boolean; points: number }[] = [
	{ min: 75, grade: 'A1', label: 'Excellent', passed: true, points: 1 },
	{ min: 70, grade: 'B2', label: 'Very good', passed: true, points: 2 },
	{ min: 65, grade: 'B3', label: 'Good', passed: true, points: 3 },
	{ min: 60, grade: 'C4', label: 'Credit', passed: true, points: 4 },
	{ min: 55, grade: 'C5', label: 'Credit', passed: true, points: 5 },
	{ min: 50, grade: 'C6', label: 'Credit', passed: true, points: 6 },
	{ min: 45, grade: 'D7', label: 'Pass', passed: false, points: 7 },
	{ min: 40, grade: 'E8', label: 'Pass', passed: false, points: 8 },
	{ min: 0, grade: 'F9', label: 'Fail', passed: false, points: 9 }
];

export function waecGrade(pct: number) {
	const e = WAEC_SCALE.find((s) => pct >= s.min) ?? WAEC_SCALE[WAEC_SCALE.length - 1];
	return { ...e, tone: e.points <= 3 ? 'good' : e.passed ? 'warn' : 'bad' } as const;
}

/** JAMB UTME: 4 subjects × 100 = 400. */
export const jambSubjectScore = (correct: number, total: number) => (total ? Math.round((correct / total) * 100) : 0);
export const jambAggregate = (subjectScores: number[]) => subjectScores.slice(0, 4).reduce((a, b) => a + b, 0);

export function jambBand(score400: number) {
	if (score400 >= 300) return { band: '300+', label: 'Elite — competitive for any course', tone: 'good' as const };
	if (score400 >= 250) return { band: '250–299', label: 'Strong — most competitive courses', tone: 'good' as const };
	if (score400 >= 200) return { band: '200–249', label: 'Solid — many courses', tone: 'warn' as const };
	if (score400 >= 160) return { band: '160–199', label: 'Minimum for many institutions', tone: 'warn' as const };
	return { band: '<160', label: 'Below common cut-offs', tone: 'bad' as const };
}

export function batchScore(answers: (number | null)[], correct: number[]) {
	let right = 0, wrong = 0, skipped = 0;
	answers.forEach((a, i) => {
		if (a === null || a === -1) skipped++;
		else if (a === correct[i]) right++;
		else wrong++;
	});
	const pct = correct.length ? Math.round((right / correct.length) * 100) : 0;
	return { right, wrong, skipped, pct };
}

export type Award = 'gold' | 'silver' | 'bronze' | null;
export const award = (pct: number): Award => (pct >= 90 ? 'gold' : pct >= 80 ? 'silver' : pct >= 75 ? 'bronze' : null);
