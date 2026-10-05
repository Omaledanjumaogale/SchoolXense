<script lang="ts">
	import type { Question } from '$hive/questions';
	import Icon from './Icon.svelte';
	let { q, chosen = $bindable(null), revealed = false, index, onpick }: { q: Question; chosen: number | null; revealed?: boolean; index?: number; onpick?: (i: number) => void } = $props();
	const L = ['A', 'B', 'C', 'D', 'E'];
	function pick(i: number) { if (revealed) return; chosen = i; onpick?.(i); }
	function key(e: KeyboardEvent) {
		const t = e.target as HTMLElement;
		if (t?.tagName === 'INPUT' || t?.tagName === 'TEXTAREA') return;
		const k = e.key.toUpperCase();
		const i = L.indexOf(k);
		if (i >= 0 && i < q.options.length) pick(i);
		if (/^[1-5]$/.test(e.key) && +e.key <= q.options.length) pick(+e.key - 1);
	}
</script>

<svelte:window onkeydown={key} />

<div class="flex flex-col gap-4">
	<div class="flex items-center gap-2 flex-wrap text-xs">
		{#if index !== undefined}<span class="badge num">Q{index + 1}</span>{/if}
		<span class="badge badge-accent">{q.topic}</span>
		<span class="badge">{q.bloom}</span>
		{#if q.status === 'unreviewed'}<span class="badge badge-warn">AI · unreviewed</span>{/if}
	</div>
	<p class="text-lg leading-relaxed font-medium">{q.stem}</p>
	<div class="grid gap-2" role="radiogroup" aria-label="Options">
		{#each q.options as opt, i}
			{@const isAns = revealed && i === q.answer}
			{@const isWrong = revealed && chosen === i && i !== q.answer}
			<button
				type="button"
				role="radio"
				aria-checked={chosen === i}
				class="ctl !justify-start !h-auto !min-h-[52px] !py-3 text-left !font-medium w-full"
				data-pressed={chosen === i && !revealed}
				style="{chosen === i && !revealed ? 'border-color:var(--accent);box-shadow:inset 0 1px 0 var(--edge-top),0 0 0 1px var(--accent),0 6px 16px -8px var(--accent);' : ''}{isAns ? 'border-color:var(--good);background:var(--good-soft);' : ''}{isWrong ? 'border-color:var(--bad);background:var(--bad-soft);' : ''}"
				onclick={() => pick(i)}
				disabled={revealed && !isAns && !isWrong}
			>
				<span class="num grid place-items-center w-7 h-7 rounded-md text-sm font-semibold shrink-0 panel-sunk">{L[i]}</span>
				<span class="flex-1 whitespace-normal">{opt}</span>
				{#if isAns}<Icon name="check" size={18} class="text-[var(--good)]" />{/if}
				{#if isWrong}<Icon name="x" size={18} class="text-[var(--bad)]" />{/if}
			</button>
		{/each}
	</div>
	<p class="text-[11px] muted hidden sm:block">Tip: press A–D or 1–4 to answer, Enter to submit.</p>
</div>
