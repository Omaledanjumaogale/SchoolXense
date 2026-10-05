import type { PaymentProvider, CheckoutRequest, VerifiedTransaction } from './provider';

/**
 * Flutterwave v3 client (server / Worker only — never import into browser code).
 * Endpoints per Implementation Plan § Flutterwave implementation. Confirm versions
 * against Flutterwave docs at build time.
 */
const BASE = 'https://api.flutterwave.com/v3';

export class Flutterwave implements PaymentProvider {
	constructor(private secretKey: string, private fetcher: typeof fetch = fetch) {}

	private async call<T>(path: string, init: RequestInit = {}): Promise<T> {
		const res = await this.fetcher(BASE + path, {
			...init,
			headers: { Authorization: `Bearer ${this.secretKey}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) }
		});
		const body = (await res.json()) as { status: string; message: string; data: T };
		if (!res.ok || body.status !== 'success') throw new Error(`Flutterwave ${path}: ${body.message ?? res.status}`);
		return body.data;
	}

	async createCheckout(r: CheckoutRequest) {
		const data = await this.call<{ link: string }>('/payments', {
			method: 'POST',
			body: JSON.stringify({
				tx_ref: r.txRef,
				amount: r.amountKobo / 100,
				currency: r.currency,
				redirect_url: r.redirectUrl,
				payment_plan: r.paymentPlanId,
				payment_options: 'card,banktransfer,ussd,mobilemoneyghana,mpesa',
				customer: { email: r.customer.email, name: r.customer.name, phonenumber: r.customer.phone },
				customizations: { title: 'SchoolXense', description: r.purpose, logo: 'https://schoolxense.ewinproject.org/icon-512.svg' },
				meta: { purpose: r.purpose, ...r.meta }
			})
		});
		return { link: data.link };
	}

	async verify(id: string): Promise<VerifiedTransaction> {
		const d = await this.call<{ id: number; tx_ref: string; status: string; amount: number; currency: string }>(`/transactions/${encodeURIComponent(id)}/verify`);
		return { id: String(d.id), txRef: d.tx_ref, status: d.status as VerifiedTransaction['status'], amountKobo: Math.round(d.amount * 100), currency: d.currency };
	}

	async transfer(t: { reference: string; amountKobo: number; bankCode: string; accountNumber: string; narration: string }) {
		const d = await this.call<{ id: number; status: string }>('/transfers', {
			method: 'POST',
			body: JSON.stringify({ account_bank: t.bankCode, account_number: t.accountNumber, amount: t.amountKobo / 100, narration: t.narration, currency: 'NGN', reference: t.reference })
		});
		return { id: String(d.id), status: d.status };
	}

	async bulkTransfer(title: string, items: { reference: string; amountKobo: number; bankCode: string; accountNumber: string; narration: string }[]) {
		return this.call<{ id: number; status: string }>('/bulk-transfers', {
			method: 'POST',
			body: JSON.stringify({ title, bulk_data: items.map((t) => ({ bank_code: t.bankCode, account_number: t.accountNumber, amount: t.amountKobo / 100, currency: 'NGN', narration: t.narration, reference: t.reference })) })
		});
	}

	async resolveAccount(bankCode: string, accountNumber: string) {
		const d = await this.call<{ account_name: string }>('/accounts/resolve', { method: 'POST', body: JSON.stringify({ account_bank: bankCode, account_number: accountNumber }) });
		return { accountName: d.account_name };
	}

	async refund(id: string, amountKobo?: number) {
		const d = await this.call<{ status: string }>(`/transactions/${encodeURIComponent(id)}/refund`, { method: 'POST', body: JSON.stringify(amountKobo ? { amount: amountKobo / 100 } : {}) });
		return { status: d.status };
	}

	async createVirtualAccount(email: string, txRef: string, amountKobo: number, bvn?: string) {
		return this.call<{ account_number: string; bank_name: string }>('/virtual-account-numbers', {
			method: 'POST',
			body: JSON.stringify({ email, tx_ref: txRef, amount: amountKobo / 100, is_permanent: false, bvn })
		});
	}
}

/** Webhook signature: Flutterwave sends the dashboard "secret hash" in `verif-hash`. Constant-time compare. */
export function verifyWebhookHash(header: string | null, secretHash: string | undefined) {
	if (!header || !secretHash || header.length !== secretHash.length) return false;
	let diff = 0;
	for (let i = 0; i < header.length; i++) diff |= header.charCodeAt(i) ^ secretHash.charCodeAt(i);
	return diff === 0;
}

/** Check a verified transaction against the pending payment row before settling. */
export function matchesPending(tx: VerifiedTransaction, pending: { txRef: string; amountKobo: number; currency: string }) {
	return tx.status === 'successful' && tx.txRef === pending.txRef && tx.amountKobo >= pending.amountKobo && tx.currency === pending.currency;
}

export const makeTxRef = (purpose: string) => `SH-${purpose.slice(0, 3).toUpperCase()}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
