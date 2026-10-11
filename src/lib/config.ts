import { env } from '$env/dynamic/public';
export const APP_URL = 'https://schoolxense.ewinproject.org';
export const CONVEX_URL = env.PUBLIC_CONVEX_URL || 'https://tacit-snail-617.eu-west-1.convex.cloud';
export const CONVEX_SITE_URL = env.PUBLIC_CONVEX_SITE_URL || env.PUBLIC_CONVEX_HTTP_ACTIONS_URL || 'https://tacit-snail-617.eu-west-1.convex.site';
export const DEMO_MODE = env.PUBLIC_DEMO_MODE === 'true';
