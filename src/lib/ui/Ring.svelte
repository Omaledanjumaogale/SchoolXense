<script lang="ts">
	import type { Snippet } from 'svelte';
	let { value, size = 96, stroke = 9, color = 'var(--accent)', children }: { value: number; size?: number; stroke?: number; color?: string; children?: Snippet } = $props();
	const r = $derived((size - stroke) / 2);
	const c = $derived(2 * Math.PI * r);
</script>

<div class="relative inline-grid place-items-center shrink-0" style="width:{size}px;height:{size}px">
	<svg width={size} height={size} class="-rotate-90" aria-hidden="true">
		<circle cx={size / 2} cy={size / 2} {r} fill="none" stroke="var(--surface-sunk)" stroke-width={stroke} />
		<circle cx={size / 2} cy={size / 2} {r} fill="none" stroke={color} stroke-width={stroke} stroke-linecap="round" stroke-dasharray={c} stroke-dashoffset={c * (1 - Math.max(0, Math.min(1, value)))} style="transition:stroke-dashoffset .6s var(--ease-snap);filter:drop-shadow(0 1px 2px color-mix(in oklab,{color} 50%,transparent))" />
	</svg>
	<div class="absolute inset-0 grid place-items-center text-center">{@render children?.()}</div>
</div>
