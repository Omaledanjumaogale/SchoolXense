/**
 * The Hive Share — every payment is split before anyone is paid.
 * All math is integer kobo; rounding remainders go to the platform line so
 * slices always sum exactly to the gross.
 */
export type TxnKind = 'session' | 'pack' | 'collab' | 'subscription' | 'licence';
export type Slice = 'earner' | 'platform' | 'referrer' | 'collab' | 'impact' | 'royalty' | 'processing';

/** basis points (1/100 of a percent) — Architecture § Money · Hive Share table */
export const HIVE_SHARE: Record<TxnKind, Partial<Record<Slice, number>>> = {
	session: { earner: 8000, platform: 1200, referrer: 300, collab: 200, impact: 100, processing: 200 },
	pack: { earner: 8500, platform: 1000, referrer: 200, impact: 100, processing: 200 },
	collab: { earner: 8800, platform: 800, referrer: 150, impact: 100, processing: 150 },
	subscription: { royalty: 1000, platform: 7700, referrer: 1000, impact: 100, processing: 200 },
	licence: { platform: 8800, referrer: 1000, processing: 200 }
};

export interface SplitInput { kind: TxnKind; grossKobo: number; hasReferrer?: boolean; hasCollabPartner?: boolean; renewal?: boolean }

export function split({ kind, grossKobo, hasReferrer = false, hasCollabPartner = false, renewal = false }: SplitInput) {
	if (!Number.isInteger(grossKobo) || grossKobo < 0) throw new Error('grossKobo must be a non-negative integer');
	const table = { ...HIVE_SHARE[kind] };
	if (kind === 'licence' && renewal) { table.referrer = 500; table.platform = 9300; }
	const out: Record<Slice, number> = { earner: 0, platform: 0, referrer: 0, collab: 0, impact: 0, royalty: 0, processing: 0 };
	for (const [slice, bp] of Object.entries(table) as [Slice, number][]) out[slice] = Math.floor((grossKobo * bp) / 10_000);
	// Unattributed slices return to the platform line.
	if (!hasReferrer) { out.platform += out.referrer; out.referrer = 0; }
	if (!hasCollabPartner) { out.platform += out.collab; out.collab = 0; }
	const sum = Object.values(out).reduce((a, b) => a + b, 0);
	out.platform += grossKobo - sum; // rounding remainder
	return out;
}

/** Split an earner amount across team members by split-rule percentages (basis points summing to 10000). */
export function splitByRules(amountKobo: number, rules: { memberId: string; bp: number }[]) {
	const total = rules.reduce((a, r) => a + r.bp, 0);
	if (total !== 10_000) throw new Error('Split rules must sum to 100%');
	const parts = rules.map((r) => ({ memberId: r.memberId, kobo: Math.floor((amountKobo * r.bp) / 10_000) }));
	let rem = amountKobo - parts.reduce((a, p) => a + p.kobo, 0);
	for (let i = 0; rem > 0; i = (i + 1) % parts.length, rem--) parts[i].kobo += 1;
	return parts;
}

export const naira = (kobo: number, opts: { compact?: boolean } = {}) => {
	const n = kobo / 100;
	if (opts.compact && Math.abs(n) >= 1_000_000) return `₦${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
	if (opts.compact && Math.abs(n) >= 10_000) return `₦${(n / 1000).toFixed(0)}k`;
	return '₦' + n.toLocaleString('en-NG', { maximumFractionDigits: opts.compact || !(n % 1) ? 0 : 2 });
};
