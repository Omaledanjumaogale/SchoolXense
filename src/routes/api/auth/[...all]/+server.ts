import { createSvelteKitHandler } from '@mmailaender/convex-better-auth-svelte/sveltekit';
import { CONVEX_SITE_URL } from '$lib/config';
export const { GET, POST } = createSvelteKitHandler({ convexSiteUrl: CONVEX_SITE_URL });
