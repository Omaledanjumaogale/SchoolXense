import type { ParamMatcher } from '@sveltejs/kit';
import { LANDINGS } from '$hive/landings';
export const match: ParamMatcher = (p) => p in LANDINGS;
