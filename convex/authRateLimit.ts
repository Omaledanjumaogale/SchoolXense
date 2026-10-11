import type { GenericCtx } from '@convex-dev/better-auth';
import type { DataModel } from './_generated/dataModel';
import { rateLimiter } from './rateLimits';

/** Better Auth 1.6.33 calls consume before handling requests. Use one durable
 * Convex transaction rather than the adapter's separate rateLimit row writes. */
export function authRateLimitStorage(ctx: GenericCtx<DataModel>) {
	return {
		get: async (): Promise<never> => { throw new Error('Atomic auth rate limiting is required'); },
		set: async (): Promise<never> => { throw new Error('Atomic auth rate limiting is required'); },
		consume: async (key: string, rule: { window: number; max: number }) => {
			if (!('runMutation' in ctx)) throw new Error('Auth rate limiting requires an action context');
			const result = await rateLimiter.limit(ctx, 'authentication', {
				key,
				config: { kind: 'fixed window', rate: rule.max, period: rule.window * 1000 }
			});
			return { allowed: result.ok, retryAfter: result.ok ? null : Math.max(1, Math.ceil(result.retryAfter / 1000)) };
		}
	};
}
