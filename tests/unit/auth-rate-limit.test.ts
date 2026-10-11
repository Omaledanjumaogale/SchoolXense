import { expect, test } from 'vitest';
import { convexTest } from 'convex-test';
import limiter from '@convex-dev/rate-limiter/test';
import schema from '../../convex/schema';
import { authRateLimitStorage } from '../../convex/authRateLimit';
const modules = import.meta.glob('../../convex/**/*.ts');

test('authentication limits are durable, independent by key, and fail closed after exhaustion', async () => {
	const t = convexTest(schema, modules);
	limiter.register(t);
	const consume = (key: string) => t.run(ctx => authRateLimitStorage(ctx).consume(key, { window: 60, max: 2 }));
	expect((await consume('account-a')).allowed).toBe(true);
	expect((await consume('account-a')).allowed).toBe(true);
	const rejected = await consume('account-a');
	expect(rejected.allowed).toBe(false);
	expect(rejected.retryAfter).toBeGreaterThan(0);
	expect((await consume('account-b')).allowed).toBe(true);
});
