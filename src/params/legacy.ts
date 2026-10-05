import type { ParamMatcher } from '@sveltejs/kit';
/** Retired providers (Architecture § Migration step 4) — return 410 after last settlements. */
export const match: ParamMatcher = (p) => ['paystack', 'korapay', 'seerbit', 'stripe'].includes(p);
