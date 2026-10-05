<script lang="ts">
	import Icon from './Icon.svelte';
	import Sparkline from './Sparkline.svelte';
	let { label, value, sub, delta, icon, trend, tone = 'accent', href }: { label: string; value: string | number; sub?: string; delta?: number; icon?: string; trend?: number[]; tone?: 'accent' | 'brand' | 'good' | 'bad' | 'warn'; href?: string } = $props();
</script>

<svelte:element this={href ? 'a' : 'div'} {href} class="panel p-4 flex flex-col gap-2 min-w-0 {href ? 'card-interactive' : ''}">
	<div class="flex items-center justify-between gap-2">
		<span class="eyebrow truncate">{label}</span>
		{#if icon}<span class="grid place-items-center w-8 h-8 rounded-lg" style="background:var(--{tone}-soft, var(--accent-soft));color:var(--{tone === 'accent' ? 'accent' : tone})"><Icon name={icon} size={16} /></span>{/if}
	</div>
	<div class="flex items-end justify-between gap-3">
		<div class="min-w-0">
			<div class="num text-2xl font-semibold leading-none truncate">{value}</div>
			{#if sub || delta !== undefined}
				<div class="mt-1.5 flex items-center gap-1.5 text-xs muted">
					{#if delta !== undefined}
						<span class="inline-flex items-center gap-0.5 font-semibold" style="color:var(--{delta >= 0 ? 'good' : 'bad'})"><Icon name={delta >= 0 ? 'arrow-up' : 'arrow-down'} size={12} stroke={2.4} />{Math.abs(delta)}{typeof delta === 'number' && Math.abs(delta) < 100 ? '' : ''}</span>
					{/if}
					{#if sub}<span class="truncate">{sub}</span>{/if}
				</div>
			{/if}
		</div>
		{#if trend}<Sparkline values={trend} color="var(--{tone === 'accent' ? 'accent' : tone})" />{/if}
	</div>
</svelte:element>
