<script lang="ts">
	import { hive } from '$hive/store.svelte';
	import { examById } from '$hive/catalogue';
	import Icon from './Icon.svelte';
	let { userId, exam = 'jamb', compact = false }: { userId: string; exam?: string; compact?: boolean } = $props();
	const r = $derived(hive.readiness(userId, exam));
	const ex = $derived(examById(exam));
	const isJamb = $derived(exam === 'jamb');
	const prev = $derived(r.mocks.length > 1 ? r.mocks[r.mocks.length - 2] : null);
	const last = $derived(r.mocks.at(-1) ?? null);
</script>

<div class="panel p-4 flex flex-col gap-3 h-full">
	<div class="flex items-center justify-between">
		<span class="eyebrow">{ex?.name ?? exam} readiness</span>
		<span class="badge badge-info" title="Confidence grows as you answer more questions">{r.confidence}% confidence</span>
	</div>
	<div class="flex items-baseline gap-2 flex-wrap">
		{#if isJamb}
			<span class="num text-3xl font-semibold">{r.jamb.low}–{r.jamb.high}</span><span class="muted text-sm">/ 400</span>
		{:else}
			<span class="num text-3xl font-semibold">{r.waec.high === r.waec.low ? r.waec.low : `${r.waec.low}–${r.waec.high}`}</span><span class="muted text-sm">grade band</span>
		{/if}
		{#if last !== null && prev !== null}
			<span class="inline-flex items-center text-sm font-semibold" style="color:var(--{last >= prev ? 'good' : 'bad'})"><Icon name={last >= prev ? 'arrow-up' : 'arrow-down'} size={14} />{Math.abs(last - prev)}</span>
		{/if}
	</div>
	<!-- range bar -->
	<div class="relative h-3 rounded-full panel-sunk overflow-visible" aria-hidden="true">
		<div class="absolute top-0 bottom-0 rounded-full" style="left:{r.lowPct}%;width:{Math.max(2, r.highPct - r.lowPct)}%;background:linear-gradient(90deg,var(--accent),var(--brand));box-shadow:0 0 0 1px color-mix(in oklab,var(--accent) 40%,transparent),0 4px 12px -4px var(--accent)"></div>
		<div class="absolute -top-1 w-1 h-5 rounded" style="left:calc({r.pct}% - 2px);background:var(--text)"></div>
	</div>
	{#if !compact}
		<p class="text-xs muted">{isJamb ? r.jamb.band.label : 'WAEC/NECO A1–F9 estimate'} · based on {r.answered} answers, {Math.round(r.coverage * 100)}% syllabus coverage{r.mocks.length ? `, ${r.mocks.length} mocks` : ''}. A range, never a promise.</p>
	{/if}
</div>
