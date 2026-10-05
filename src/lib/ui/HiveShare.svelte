<script lang="ts">
	import { split, type TxnKind } from '$engines/hiveShare';
	import { naira } from './format';
	let { kind = 'session', grossKobo = 187_500, referrer = true, collab = false }: { kind?: TxnKind; grossKobo?: number; referrer?: boolean; collab?: boolean } = $props();
	const s = $derived(split({ kind, grossKobo, hasReferrer: referrer, hasCollabPartner: collab }));
	const LABEL: Record<string, [string, string]> = { earner: ['Earner', 'var(--brand)'], royalty: ['Studio royalty pool', '#7c3aed'], platform: ['Platform', 'var(--accent)'], referrer: ['Referrer / ambassador', '#0891b2'], collab: ['Collaboration partner', '#16a34a'], impact: ['Learner Impact Fund', '#e11d48'], processing: ['Processing reserve', '#64748b'] };
	const rows = $derived(Object.entries(s).filter(([, v]) => v > 0).map(([k, v]) => ({ k, v, pct: (v / grossKobo) * 100 })));
</script>

<div class="flex flex-col gap-3">
	<div class="flex h-4 rounded-full overflow-hidden panel-sunk" role="img" aria-label="Hive Share split">
		{#each rows as r (r.k)}<span style="width:{r.pct}%;background:{LABEL[r.k][1]};box-shadow:inset 0 1px 0 rgba(255,255,255,.3)" title="{LABEL[r.k][0]} {r.pct.toFixed(1)}%"></span>{/each}
	</div>
	<ul class="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
		{#each rows as r (r.k)}
			<li class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-sm shrink-0" style="background:{LABEL[r.k][1]}"></span><span class="text-[var(--text-2)]">{LABEL[r.k][0]}</span><span class="ml-auto num font-semibold">{naira(r.v)}</span><span class="num muted text-xs w-11 text-right">{r.pct.toFixed(1)}%</span></li>
		{/each}
	</ul>
</div>
