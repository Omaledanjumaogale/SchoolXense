/**
 * Payment-events Queue consumer (Cloudflare Worker).
 * 1. Receives events enqueued by /api/webhooks/flutterwave (signature already checked).
 * 2. Re-verifies each transaction with Flutterwave by id — never trusts the webhook body.
 * 3. Calls Convex money.settlePayment (idempotent on flwTxId) via the internal HTTP route.
 * Duplicate events are dropped by transaction id; failures retry with backoff.
 */
import {verifyGatewayPayment,korapay} from '../../../src/lib/payments/gateways';
export interface Env { FLW_SECRET_KEY: string; FLW_CLIENT_ID?:string; KORAPAY_SECRET_KEY?:string; CONVEX_SITE_URL: string; INTERNAL_WEBHOOK_TOKEN: string; PAYMENTS_ENABLED?: string }
type Msg = { id: string; txRef: string; type: string; gateway?:'flutterwave'|'korapay' };

export default {
	async queue(batch: MessageBatch<Msg>, env: Env): Promise<void> {
		for (const m of batch.messages) {
			const { id, type } = m.body;
			try {
				if (env.PAYMENTS_ENABLED !== 'true' || !env.INTERNAL_WEBHOOK_TOKEN) throw new Error('Payment processing is disabled');
				if(m.body.gateway){
				 if(type.startsWith('transfer.')){
				  if(m.body.gateway!=='korapay')throw new Error('Transfer verification unavailable');
				  const tx=await korapay<{reference:string;status:string;amount:number;currency:string}>(env,'/transactions/'+encodeURIComponent(id));
				  if(tx.reference!==id||!['success','failed'].includes(tx.status))throw new Error('Transfer identity or terminal status mismatch');
				  await settle(env,{kind:'transfer',txRef:tx.reference,flwTxId:'korapay:'+tx.reference,success:tx.status==='success',amountKobo:String(Math.round(Number(tx.amount)*100)),currency:tx.currency});
				 }else{
				  const tx=await verifyGatewayPayment(m.body.gateway,env,id);
				  if(tx.status==='pending')throw new Error('Payment is not terminal');
				  if(tx.status==='successful')await settle(env,{kind:'payment',gateway:m.body.gateway,txRef:tx.txRef,flwTxId:tx.id,amountKobo:String(tx.amountKobo),currency:tx.currency});
				 }
				 m.ack();continue;
				}
				if (!/^\d+$/.test(id)) throw new Error('Invalid provider transaction id');
				if (type === 'transfer.completed') {
					const t = await flw<{ status: string; reference: string; id: number; amount: number; currency: string }>(env, `/transfers/${id}`);
					if (String(t.id) !== id) throw new Error('Provider transfer identity mismatch');
					if (!['SUCCESSFUL','FAILED'].includes(t.status)) throw new Error('Transfer is not terminal');
					await settle(env, { kind: 'transfer', txRef: t.reference, flwTxId: String(t.id), success: t.status === 'SUCCESSFUL', amountKobo: String(Math.round(t.amount * 100)), currency: t.currency });
				} else if (type === 'charge.completed') {
					const tx = await flw<{ id: number; tx_ref: string; status: string; amount: number; currency: string; payment_type: string }>(env, `/transactions/${encodeURIComponent(id)}/verify`);
					if (String(tx.id) !== id) throw new Error('Provider payment identity mismatch');
					if (tx.status === 'failed' || tx.status === 'cancelled') { m.ack(); continue; }
					if (tx.status !== 'successful') throw new Error('Payment is not terminal');
					await settle(env, { kind: 'payment', txRef: tx.tx_ref, flwTxId: String(tx.id), amountKobo: String(Math.round(tx.amount * 100)), currency: tx.currency, method: tx.payment_type });
				}
				m.ack();
			} catch (e) {
				console.error('payment event failed', id, (e as Error).message);
				m.retry({ delaySeconds: Math.min(300, 10 * 2 ** m.attempts) });
			}
		}
	}
};

async function flw<T>(env: Env, path: string): Promise<T> {
	const r = await fetch(`https://api.flutterwave.com/v3${path}`, { headers: { Authorization: `Bearer ${env.FLW_SECRET_KEY}` }, signal: AbortSignal.timeout(15000) });
	const j = (await r.json()) as { status: string; data: T; message: string };
	if (!r.ok || j.status !== 'success') throw new Error(j.message ?? `HTTP ${r.status}`);
	return j.data;
}

async function settle(env: Env, body: Record<string, unknown>) {
	const r = await fetch(`${env.CONVEX_SITE_URL}/payments/settle`, { method: 'POST', headers: { authorization: `Bearer ${env.INTERNAL_WEBHOOK_TOKEN}`, 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) });
	if (!r.ok) throw new Error(`Convex settle ${r.status}`);
}
