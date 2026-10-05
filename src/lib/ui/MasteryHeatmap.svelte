<script lang="ts">
	import { hive } from '$hive/store.svelte';
	import { examById } from '$hive/catalogue';
	let { userId, exam = 'jamb' }: { userId: string; exam?: string } = $props();
	const ex = $derived(examById(exam));
	const rows = $derived((ex?.subjects ?? []).map((s) => ({ s, cells: hive.masteryFor(userId, exam, s.id) })));
	const color = (p: number | null) => p === null ? 'var(--surface-sunk)' : `color-mix(in oklab, ${p >= 70 ? 'var(--good)' : p >= 50 ? 'var(--color-comb-400)' : 'var(--bad)'} ${30 + Math.abs(p - 55)}%, var(--surface-solid))`;
</script>

<div class="flex flex-col gap-2.5">
	{#each rows as row (row.s.id)}
		<div class="grid grid-cols-[6.5rem_1fr] gap-3 items-center">
			<a class="text-sm font-medium truncate hover:underline" href="/practice/{exam}/{row.s.id}">{row.s.name}</a>
			<div class="flex gap-1.5 flex-wrap">
				{#each row.cells as c (c.topic)}
					<a href="/practice/{exam}/{row.s.id}?topic={encodeURIComponent(c.topic)}" class="group relative h-8 min-w-8 flex-1 rounded-md grid place-items-center text-[10px] font-semibold num transition-transform hover:-translate-y-px" style="background:{color(c.pct)};border:1px solid var(--line);box-shadow:inset 0 1px 0 var(--edge-top)" aria-label="{c.topic}: {c.pct === null ? 'not started' : c.pct + '% mastery'}">
						<span class="opacity-80">{c.pct === null ? '–' : c.pct}</span>
						<span class="pointer-events-none absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap panel px-2 py-1 text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity z-10" style="background:var(--surface-solid)">{c.topic} · {c.answered} answered</span>
					</a>
				{/each}
			</div>
		</div>
	{/each}
	<div class="flex items-center gap-3 text-[11px] muted mt-1">
		<span class="flex items-center gap-1"><i class="w-3 h-3 rounded-sm inline-block" style="background:{color(30)}"></i>Needs work</span>
		<span class="flex items-center gap-1"><i class="w-3 h-3 rounded-sm inline-block" style="background:{color(58)}"></i>Developing</span>
		<span class="flex items-center gap-1"><i class="w-3 h-3 rounded-sm inline-block" style="background:{color(85)}"></i>Strong</span>
	</div>
</div>
