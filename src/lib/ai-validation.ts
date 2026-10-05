export type GeneratedQuestion = { topic: string; stem: string; options: string[]; answer: number; explanation: string };
export function validateQuestions(value: unknown, max = 10): GeneratedQuestion[] {
	if (!Array.isArray(value) || !value.length || value.length > max) throw new Error('Invalid AI question count.');
	return value.map(item => {
		if (!item || typeof item !== 'object') throw new Error('Invalid AI question.');
		const q = item as Record<string, unknown>;
		for (const field of ['topic', 'stem', 'explanation']) if (typeof q[field] !== 'string' || !(q[field] as string).trim() || (q[field] as string).length > 4000) throw new Error('Invalid AI text.');
		if (!Array.isArray(q.options) || q.options.length !== 4 || q.options.some(x => typeof x !== 'string' || !x.trim() || x.length > 1000) || new Set(q.options.map(x=>typeof x==='string'?x.trim():x)).size !== 4 || !Number.isInteger(q.answer) || (q.answer as number) < 0 || (q.answer as number) > 3) throw new Error('Invalid AI options or answer.');
		return { topic: (q.topic as string).trim(), stem: (q.stem as string).trim(), options: q.options.map(x => x.trim()), answer: q.answer as number, explanation: (q.explanation as string).trim() };
	});
}
export function parseQuestions(text: string, max: number) {
	const trimmed = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
	return validateQuestions(JSON.parse(trimmed), max);
}
