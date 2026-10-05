import { RateLimiter, MINUTE, HOUR } from '@convex-dev/rate-limiter';
import { components } from './_generated/api';

/** CollegeCBT limits carried over: AI generation 5/min free, 60/min Pro. Free plan: 20 questions/day. */
export const rateLimiter = new RateLimiter(components.rateLimiter, {
	enquiries: { kind: 'token bucket', rate: 5, period: HOUR, capacity: 5 },
	freeDailyQuestions: { kind: 'fixed window', rate: 20, period: 24 * HOUR },
	aiFree: { kind: 'token bucket', rate: 5, period: MINUTE, capacity: 5 },
	aiPro: { kind: 'token bucket', rate: 60, period: MINUTE, capacity: 60 },
	signup: { kind: 'token bucket', rate: 10, period: HOUR, capacity: 10 }
});
