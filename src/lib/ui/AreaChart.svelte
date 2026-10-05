<script lang="ts">
	let { series, labels = [], height = 160, format = (n: number) => String(n) }: { series: { name: string; values: number[]; color: string }[]; labels?: string[]; height?: number; format?: (n: number) => string } = $props();
	const W = 600;
	let hover = $state<number | null>(null);
	const n = $derived(Math.max(...series.map((s) => s.values.length)));
	const max = $derived(Math.max(1, ...series.flatMap((s) => s.values)) * 1.1);
	const x = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * W);
	const y = (v: number) => height - 18 - (v / max) * (height - 30);
	const path = (vals: number[]) => vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
	function move(e: PointerEvent) {
		const r = (e.currentTarget as SVGElement).getBoundingClientRect();
		hover = Math.round(((e.clientX - r.left) / r.width) * (n - 1));
	}
</script>

<div class="relative">
	<svg viewBox="0 0 {W} {height}" class="w-full" style="height:{height}px" preserveAspectRatio="none" role="img" aria-label={series.map((s) => s.name).join(', ')} onpointermove={move} onpointerleave={() => (hover = null)}>
		{#each [0.25, 0.5, 0.75, 1] as g}
			<line x1="0" x2={W} y1={y(max * g / 1.1)} y2={y(max * g / 1.1)} stroke="var(--line)" stroke-dasharray="3 5" vector-effect="non-scaling-stroke" />
		{/each}
		{#each series as s, si}
			{#if si === 0}<path d="{path(s.values)} L{x(s.values.length - 1)},{height - 18} L0,{height - 18} Z" fill={s.color} opacity="0.1" />{/if}
			<path d={path(s.values)} fill="none" stroke={s.color} stroke-width="2.2" stroke-dasharray={si === 0 ? undefined : "5 5"} vector-effect="non-scaling-stroke" stroke-linejoin="round" />
		{/each}
		{#if hover !== null}
			<line x1={x(hover)} x2={x(hover)} y1="6" y2={height - 18} stroke="var(--line-strong)" vector-effect="non-scaling-stroke" />
			{#each series as s}<circle cx={x(hover)} cy={y(s.values[hover] ?? 0)} r="4" fill={s.color} stroke="var(--surface-solid)" stroke-width="2" vector-effect="non-scaling-stroke" />{/each}
		{/if}
	</svg>
	{#if labels.length}
		<div class="flex justify-between text-[11px] muted -mt-3 px-0.5">{#each labels as l, i}{#if i % Math.ceil(labels.length / 6) === 0 || i === labels.length - 1}<span>{l}</span>{/if}{/each}</div>
	{/if}
	{#if hover !== null}
		<div class="panel absolute top-1 px-3 py-2 text-xs pointer-events-none" style="left:clamp(0px, calc({(x(hover) / W) * 100}% - 70px), calc(100% - 150px));min-width:140px">
			{#if labels[hover]}<div class="font-semibold mb-1">{labels[hover]}</div>{/if}
			{#each series as s}<div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full" style="background:{s.color}"></span><span class="muted">{s.name}</span><span class="num ml-auto font-semibold">{format(s.values[hover] ?? 0)}</span></div>{/each}
		</div>
	{/if}
</div>
