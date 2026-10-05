import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { verifyWebhookHash } from '$payments/flutterwave';

/**
 * Flutterwave webhook (Cloudflare Worker). Never trust the body alone:
 * check verif-hash, enqueue, and let the consumer re-verify by transaction id
 * (GET /v3/transactions/{id}/verify) before calling Convex money.settlePayment,
 * which is idempotent on flwTxId. Respond fast — Flutterwave retries non-2xx.
 */
export const POST: RequestHandler = async ({ request, platform }) => {
	const secret = platform?.env?.FLW_SECRET_HASH ?? env.FLW_SECRET_HASH;
	if ((platform?.env?.PAYMENTS_ENABLED ?? env.PAYMENTS_ENABLED) !== 'true') return new Response('payments disabled', { status: 503 });
	if (!verifyWebhookHash(request.headers.get('verif-hash'), secret)) return new Response('bad signature', { status: 401 });
	let event: { event?: string; data?: { id?: number | string; tx_ref?: string; reference?: string; status?: string } };
	try { event = await request.json(); } catch { return new Response('bad json', { status: 400 }); }
	const msg = { id: String(event?.data?.id ?? ''), txRef: event?.data?.tx_ref ?? event?.data?.reference ?? '', type: event?.event ?? 'unknown', receivedAt: Date.now() };
	if (!msg.id) return new Response('missing id', { status: 400 });
	if (platform?.env?.PAYMENT_EVENTS) await platform.env.PAYMENT_EVENTS.send(msg);
	else return new Response('queue unavailable', { status: 503 });
	return new Response('ok');
};
