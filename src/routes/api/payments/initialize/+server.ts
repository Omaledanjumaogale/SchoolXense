import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { Flutterwave } from '$payments/flutterwave';
import type { CheckoutRequest } from '$payments/provider';
import { authenticatedClient, assertSameOrigin } from '$lib/server/convex';
import { api } from '$convex/_generated/api';
import type { Id } from '$convex/_generated/dataModel';
import { APP_URL } from '$lib/config';
export const POST: RequestHandler = async (event) => {
 assertSameOrigin(event);
 const client = authenticatedClient(event);
 const body = await event.request.json().catch(() => null);
 if (!body || typeof body.paymentId !== 'string') return json({ message: 'A saved order is required.' }, { status: 400 });
 const order = await client.query(api.checkout.get, { paymentId: body.paymentId as Id<'payments'> });
 if (!order.customer.email || !['subscription','booking','pack','cohort','exam_pass'].includes(order.payment.purpose)) return json({message:'Invalid order.'},{status:400});
 if (order.payment.status !== 'pending') return json({ message: 'This order is no longer pending.' }, { status: 409 });
 const key = event.platform?.env?.FLW_SECRET_KEY ?? env.FLW_SECRET_KEY;
 if ((event.platform?.env?.PAYMENTS_ENABLED ?? env.PAYMENTS_ENABLED) !== 'true' || !key) return json({ message: 'Payments are temporarily unavailable.' }, { status: 503 });
 try {
  const result = await new Flutterwave(key).createCheckout({ txRef: order.payment.txRef, amountKobo: Number(order.payment.amount), currency: 'NGN', customer: {email:order.customer.email,name:order.customer.name}, purpose: order.payment.purpose as CheckoutRequest['purpose'], redirectUrl: APP_URL + '/checkout/' + order.payment._id });
  return json({ link: result.link });
 } catch { return json({ message: 'The payment provider is unavailable. Your order remains unpaid.' }, { status: 502 }); }
};
