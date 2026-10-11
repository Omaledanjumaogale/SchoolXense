import { afterEach, describe, expect, it, vi } from 'vitest';
import consumer from '../../workers/payment-consumer/src/index';

const env = { PAYMENTS_ENABLED: 'true', FLW_SECRET_KEY: 'test-provider-key', INTERNAL_WEBHOOK_TOKEN: 'test-internal-token', CONVEX_SITE_URL: 'https://test.convex.site' };
const transaction = { id: 123, tx_ref: 'server-order', status: 'successful', amount: 25000, currency: 'NGN', payment_type: 'card' };
function message(type = 'charge.completed') {
 return { body: { id: '123', txRef: 'untrusted-webhook-reference', type }, attempts: 1, ack: vi.fn(), retry: vi.fn() };
}
async function run(m: ReturnType<typeof message>, settings = env) {
 await consumer.queue({ messages: [m] } as never, settings);
}
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('payment queue recovery and authoritative verification', () => {
 it('retries pending payments without settling or acknowledging them', async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json({ status: 'success', data: { ...transaction, status: 'pending' } }));
  vi.stubGlobal('fetch', fetch); vi.spyOn(console, 'error').mockImplementation(() => {});
  const m = message(); await run(m);
  expect(fetch).toHaveBeenCalledTimes(1); expect(m.ack).not.toHaveBeenCalled(); expect(m.retry).toHaveBeenCalledWith({ delaySeconds: 20 });
 });
 it('settles successful payments using only the verified provider reference and amount', async () => {
  const fetch = vi.fn().mockResolvedValueOnce(Response.json({ status: 'success', data: transaction })).mockResolvedValueOnce(new Response('ok'));
  vi.stubGlobal('fetch', fetch); const m = message(); await run(m);
  expect(JSON.parse(fetch.mock.calls[1][1].body)).toMatchObject({ txRef: 'server-order', flwTxId: '123', amountKobo: '2500000', currency: 'NGN' });
  expect(m.ack).toHaveBeenCalledOnce(); expect(m.retry).not.toHaveBeenCalled();
 });
 it.each(['charge.completed', 'transfer.completed'])('rejects mismatched provider identity for %s', async type => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ status: 'success', data: { ...transaction, id: 456, status: type === 'transfer.completed' ? 'SUCCESSFUL' : 'successful' } })));
  vi.spyOn(console, 'error').mockImplementation(() => {}); const m = message(type); await run(m);
  expect(fetch).toHaveBeenCalledTimes(1); expect(m.ack).not.toHaveBeenCalled(); expect(m.retry).toHaveBeenCalledOnce();
 });
 it('retries when the durable settlement endpoint rejects delivery', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(Response.json({ status: 'success', data: transaction })).mockResolvedValueOnce(new Response('unavailable', { status: 503 })));
  vi.spyOn(console, 'error').mockImplementation(() => {}); const m = message(); await run(m);
  expect(m.ack).not.toHaveBeenCalled(); expect(m.retry).toHaveBeenCalledOnce();
 });
 it('does not call providers or settle while payments are disabled', async () => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch); vi.spyOn(console, 'error').mockImplementation(() => {});
  const m = message(); await run(m, { ...env, PAYMENTS_ENABLED: 'false' });
  expect(fetch).not.toHaveBeenCalled(); expect(m.ack).not.toHaveBeenCalled(); expect(m.retry).toHaveBeenCalledOnce();
 });
 it('acknowledges terminal failed payments without creating a settlement', async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json({ status: 'success', data: { ...transaction, status: 'failed' } }));
  vi.stubGlobal('fetch', fetch); const m = message(); await run(m);
  expect(fetch).toHaveBeenCalledTimes(1); expect(m.ack).toHaveBeenCalledOnce(); expect(m.retry).not.toHaveBeenCalled();
 });
});
