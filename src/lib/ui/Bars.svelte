<script lang="ts">
	let { rows, format = (n: number) => String(n), max: maxIn, color = 'var(--accent)' }: { rows: { label: string; value: number; tone?: string; hint?: string }[]; format?: (n: number) => string; max?: number; color?: string } = $props();
	const max = $derived(maxIn ?? Math.max(1, ...rows.map((r) => r.value)));
</script>

<ul class="flex flex-col gap-2.5">
	{#each rows as r (r.label)}
		<li class="grid grid-cols-[minmax(0,7.5rem)_1fr_auto] items-center gap-3 text-sm">
			<span class="truncate text-[var(--text-2)]" title={r.label}>{r.label}</span>
			<span class="meter"><span style="width:{Math.max(2, (r.value / max) * 100)}%;{r.tone ? `background:${r.tone}` : `background:linear-gradient(90deg,${color},color-mix(in oklab,${color} 55%,var(--brand)))`}"></span></span>
			<span class="num text-xs font-semibold text-right min-w-14">{format(r.value)}{#if r.hint}<span class="muted font-normal ml-1">{r.hint}</span>{/if}</span>
		</li>
	{/each}
</ul>
