import type { CheckoutRequest, VerifiedTransaction } from './provider';
export type Gateway = 'flutterwave' | 'korapay';
export type BankInstructions = { bank: string; account: string; expiresAt: string; amountKobo:number;feeKobo:number };
export type GatewayCheckout = { link?: string; bank?: BankInstructions; providerRef: string };
export type GatewaySecrets = { FLW_CLIENT_ID?: string; FLW_SECRET_KEY?: string; KORAPAY_SECRET_KEY?: string; PUBLIC_KORAPAY_PUBLIC_KEY?: string };
const KORA = 'https://api.korapay.com/merchant/api/v1';
const FLW = 'https://f4bexperience.flutterwave.com';
class GatewayError extends Error {constructor(message:string,public code?:string){super(message);}}
export function safeCheckoutUrl(link: string, gateway: Gateway) {
 const url = new URL(link);
 const allowed = gateway === 'korapay' ? url.hostname === 'checkout.korapay.com' : url.hostname === 'checkout.flutterwave.com';
 if (url.protocol !== 'https:' || !allowed || url.username || url.password) throw new Error('Invalid payment redirect.');
 return url.href;
}
export async function korapay<T>(secrets: GatewaySecrets, path: string, body?: unknown, publicKey = false, fetcher: typeof fetch = fetch): Promise<T> {
 const key = publicKey ? secrets.PUBLIC_KORAPAY_PUBLIC_KEY : secrets.KORAPAY_SECRET_KEY;
 if (!key) throw new Error('Gateway is not configured.');
 const response = await fetcher(KORA + path, { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000) });
 const result = await response.json();
 if (!response.ok || result.status !== true) throw new Error(`Korapay HTTP ${response.status}`);
 return result.data as T;
}
export async function flutterwaveV4<T>(secrets: GatewaySecrets, path: string, body?: unknown, idempotencyKey?: string, fetcher: typeof fetch = fetch): Promise<T> {
 if (!secrets.FLW_CLIENT_ID || !secrets.FLW_SECRET_KEY) throw new Error('Gateway is not configured.');
 const auth = await fetcher('https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: secrets.FLW_CLIENT_ID, client_secret: secrets.FLW_SECRET_KEY, grant_type: 'client_credentials' }), signal: AbortSignal.timeout(15000) });
 const token = await auth.json();
 if (!auth.ok || !token.access_token) throw new Error('Flutterwave authentication unavailable.');
 const response = await fetcher(FLW + path, { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json', 'X-Trace-Id': crypto.randomUUID(), ...(idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000) });
 const result = await response.json();
 if (!response.ok || result.status !== 'success') throw new GatewayError(`Flutterwave HTTP ${response.status}`,result.error?.type);
 return result.data as T;
}
export async function createGatewayCheckout(gateway: Gateway, secrets: GatewaySecrets, order: CheckoutRequest, fetcher: typeof fetch = fetch): Promise<GatewayCheckout> {
 if (!Number.isSafeInteger(order.amountKobo) || order.amountKobo <= 0) throw new Error('Invalid order amount.');
 if (gateway === 'korapay') {
  const data = await korapay<{ reference: string; checkout_url: string }>(secrets, '/charges/initialize', { reference: order.txRef, amount: order.amountKobo / 100, currency: order.currency, redirect_url: order.redirectUrl, notification_url: new URL('/api/webhooks/korapay', order.redirectUrl).href, customer: order.customer, narration: `SchoolXense ${order.purpose}`, merchant_bears_cost: true }, false, fetcher);
  if (data.reference !== order.txRef) throw new Error('Checkout reference mismatch.');
  return { link: safeCheckoutUrl(data.checkout_url, gateway), providerRef: data.reference };
 }
 const names = order.customer.name.trim().split(/\s+/);
 let customer:{id:string}|undefined;
 try{customer=await flutterwaveV4<{id:string}>(secrets,'/customers',{email:order.customer.email,name:{first:names[0],last:names.slice(1).join(' ')||names[0]}},order.txRef+'-customer',fetcher);}
 catch(e){if(!(e instanceof GatewayError)||e.code!=='CUSTOMER_ALREADY_EXISTS')throw e;
 // Exact provider email matching; a bounded lookup never invents a customer ID.
 for(let page=1;page<=20;page++){const rows=await flutterwaveV4<{id:string;email:string}[]>(secrets,`/customers?page=${page}&size=50`,undefined,undefined,fetcher);customer=rows.find(x=>x.email.toLowerCase()===order.customer.email.toLowerCase());if(customer||rows.length<50)break;}
 }
 if(!customer?.id)throw new Error('Existing customer needs reconciliation.');
 const account = await flutterwaveV4<{ id: string; reference: string; account_number: string; account_bank_name: string; account_expiration_datetime: string; amount: number; currency: string }>(secrets, '/virtual-accounts', { reference: order.txRef, customer_id: customer.id, amount: order.amountKobo / 100, expiry: 900, currency: order.currency, account_type: 'dynamic', narration: 'SchoolXense' }, order.txRef, fetcher);
 const total=Math.round(Number(account.amount)*100),fee=total-order.amountKobo;
 if (account.reference !== order.txRef || !Number.isSafeInteger(total)||fee<0||fee>Math.ceil(order.amountKobo*0.05)+5000 || account.currency !== order.currency || !/^\d{10}$/.test(account.account_number) || !Number.isFinite(Date.parse(account.account_expiration_datetime))) throw new Error('Bank checkout mismatch.');
 return { providerRef: account.id, bank: { bank: account.account_bank_name, account: account.account_number, expiresAt: account.account_expiration_datetime,amountKobo:total,feeKobo:fee } };
}
export async function verifyGatewayPayment(gateway: Gateway, secrets: GatewaySecrets, id: string, fetcher: typeof fetch = fetch): Promise<VerifiedTransaction> {
 if (!/^[A-Za-z0-9_-]{3,120}$/.test(id)) throw new Error('Invalid provider reference.');
 if (gateway === 'korapay') {
  const tx = await korapay<{ reference: string; status: string; amount: number; currency: string }>(secrets, '/charges/' + encodeURIComponent(id), undefined, false, fetcher);
  if (tx.reference !== id) throw new Error('Provider payment identity mismatch.');
  return { id: 'korapay:' + tx.reference, txRef: tx.reference, status: tx.status === 'success' ? 'successful' : tx.status === 'failed' ? 'failed' : 'pending', amountKobo: Math.round(Number(tx.amount) * 100), currency: tx.currency };
 }
 const tx = await flutterwaveV4<{ id: string; reference: string; status: string; amount: number; currency: string }>(secrets, '/charges/' + encodeURIComponent(id), undefined, undefined, fetcher);
 if (tx.id !== id) throw new Error('Provider payment identity mismatch.');
 return { id: 'flutterwave-v4:' + tx.id, txRef: tx.reference, status: tx.status === 'succeeded' ? 'successful' : tx.status === 'failed' ? 'failed' : 'pending', amountKobo: Math.round(Number(tx.amount) * 100), currency: tx.currency };
}
export async function verifyHmacSignature(value: string, signature: string | null, secret?: string, encoding: 'hex' | 'base64' = 'hex') {
 if (!secret || !signature) return false;
 const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
 const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)));
 const expected = encoding === 'hex' ? Array.from(bytes, x => x.toString(16).padStart(2, '0')).join('') : btoa(String.fromCharCode(...bytes));
 if (expected.length !== signature.length) return false;
 let diff = 0; for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
 return diff === 0;
}
