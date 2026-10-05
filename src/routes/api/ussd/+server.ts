import type { RequestHandler } from './$types';
import { SEED_QUESTIONS } from '$hive/questions';
import { DEMO_MODE } from '$lib/config';

/**
 * Africa's Talking USSD (*384*HIVE#). AT posts form fields: sessionId, phoneNumber, serviceCode, text.
 * `text` is the '*'-joined history of inputs. Replies start with CON (continue) or END.
 * In production answers are written to Convex `attempts` via an HTTP action (ussd.session).
 */
const DRILL = SEED_QUESTIONS.filter((q) => q.exam === 'jamb' && q.options.every((o) => o.length <= 14)).slice(0, 10);

export const POST: RequestHandler = async ({ request }) => {
	if (!DEMO_MODE) return new Response('END USSD learning is not yet available. Please use schoolxense.ewinproject.org.', {status:503,headers:{'Content-Type':'text/plain'}});
	const form = await request.formData();
	const text = String(form.get('text') ?? '');
	const parts = text ? text.split('*') : [];
	let reply: string;
	if (parts.length === 0) reply = 'CON SchoolXense\n1. Daily drill (10 Qs)\n2. My streak\n3. Skills lesson';
	else if (parts[0] === '2') reply = 'END Streak: keep it going! Practise daily to grow it.';
	else if (parts[0] === '3') reply = 'END Lesson: write every sale the same day. Call back for the quiz.';
	else if (parts[0] === '1') {
		const answers = parts.slice(1);
		const i = answers.length;
		if (i < DRILL.length) {
			const q = DRILL[i];
			const prev = i > 0 ? (Number(answers[i - 1]) - 1 === DRILL[i - 1].answer ? 'Correct! ' : 'Not quite. ') : '';
			reply = `CON ${prev}Q${i + 1}: ${q.stem.slice(0, 90)}\n${q.options.map((o, k) => `${k + 1}. ${o}`).join('\n')}`;
		} else {
			const score = answers.filter((a, k) => Number(a) - 1 === DRILL[k].answer).length;
			reply = `END You scored ${score}/${DRILL.length}. Results saved to your SchoolXense account.`;
		}
	} else reply = 'END Invalid choice.';
	return new Response(reply, { headers: { 'content-type': 'text/plain' } });
};
