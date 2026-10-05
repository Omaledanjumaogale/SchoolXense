import { waecGrade, jambBand } from './grading';

/**
 * Readiness predictor — a calibrated estimate shown as a range with confidence,
 * never as a promise. Inputs: mean mastery (0..1), syllabus coverage (0..1),
 * recent mock percentages.
 */
export function estimateReadiness(input: { mastery: number; coverage: number; mocks: number[]; answered: number }) {
	const mockAvg = input.mocks.length ? input.mocks.reduce((a, b) => a + b, 0) / input.mocks.length / 100 : input.mastery;
	const point = 0.5 * input.mastery + 0.2 * input.coverage + 0.3 * mockAvg; // 0..1
	const n = input.answered + input.mocks.length * 40;
	const halfWidth = Math.max(0.04, 0.22 / Math.sqrt(1 + n / 25)); // shrinks with evidence
	const lo = Math.max(0, point - halfWidth), hi = Math.min(1, point + halfWidth);
	const confidence = Math.round(100 * Math.min(0.95, 0.4 + n / 600));
	return {
		pct: Math.round(point * 100),
		lowPct: Math.round(lo * 100),
		highPct: Math.round(hi * 100),
		jamb: { low: Math.round(lo * 400), high: Math.round(hi * 400), band: jambBand(Math.round(point * 400)) },
		waec: { low: waecGrade(lo * 100).grade, high: waecGrade(hi * 100).grade },
		confidence
	};
}
