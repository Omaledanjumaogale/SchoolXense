/** Provider interface — Flutterwave is the only live provider; a fallback can be added without touching modules. */
export interface CheckoutRequest {
	txRef: string;
	amountKobo: number;
	currency: 'NGN' | 'GHS' | 'KES' | 'XOF';
	customer: { email: string; name: string; phone?: string };
	purpose: 'subscription' | 'booking' | 'pack' | 'cohort' | 'exam_pass' | 'contract' | 'invoice' | 'certificate';
	redirectUrl: string;
	paymentPlanId?: string;
	meta?: Record<string, string>;
}
export interface VerifiedTransaction {
	id: string;
	txRef: string;
	status: 'successful' | 'failed' | 'pending';
	amountKobo: number;
	currency: string;
}
export interface PaymentProvider {
	createCheckout(req: CheckoutRequest): Promise<{ link: string }>;
	verify(transactionId: string): Promise<VerifiedTransaction>;
	transfer(t: { reference: string; amountKobo: number; bankCode: string; accountNumber: string; narration: string }): Promise<{ id: string; status: string }>;
	resolveAccount(bankCode: string, accountNumber: string): Promise<{ accountName: string }>;
	refund(transactionId: string, amountKobo?: number): Promise<{ status: string }>;
}
