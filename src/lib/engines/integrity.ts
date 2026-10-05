/**
 * Integrity classifier — rules layer (fast, on-device and in Convex).
 * The production path adds a Claude classification on borderline text.
 * SchoolXense helps people learn; it never sells completed assessed work.
 */
const BLOCK: [RegExp, string][] = [
	[/\b(write|do|complete|finish|solve)\b.{0,30}\b(my|our|the)\b.{0,25}\b(assignment|homework|project|thesis|dissertation|essay|term ?paper|seminar|coursework|report)\b/i, 'Writing graded work for a learner'],
	[/\b(take|write|sit|do)\b.{0,15}\b(my|the)\b.{0,15}\b(exam|test|quiz|ca|continuous assessment)\b.{0,20}\b(for me|on my behalf)\b/i, 'Impersonation in an assessment'],
	[/\b(exam|jamb|waec|neco|utme)\b.{0,25}\b(expo|leak|leaked|runz|answers? before)\b/i, 'Leaked exam material'],
	[/\b(ghost ?writ|pay (someone|you) to write)\b/i, 'Ghost-writing'],
	[/\b(paraphrase|rewrite|spin)\b.{0,30}\b(to (beat|pass|avoid) (turnitin|plagiarism))\b/i, 'Plagiarism evasion']
];
const CONTACT = /(\+?234|0)[789][01]\d{8}|\b[\w.+-]+@[\w-]+\.[\w.]+\b|wa\.me\/|whatsapp\s*(me|number)/i;

export interface IntegrityVerdict { allowed: boolean; reasons: string[]; contactShared: boolean; score: number }

export function screen(text: string): IntegrityVerdict {
	const reasons = BLOCK.filter(([re]) => re.test(text)).map(([, r]) => r);
	const contactShared = CONTACT.test(text);
	return { allowed: reasons.length === 0, reasons, contactShared, score: Math.min(1, reasons.length * 0.6 + (contactShared ? 0.2 : 0)) };
}
