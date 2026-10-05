<script lang="ts">
	let { values, width = 96, height = 28, color = 'var(--accent)', fill = true }: { values: number[]; width?: number; height?: number; color?: string; fill?: boolean } = $props();
	const pts = $derived.by(() => {
		if (values.length < 2) return '';
		const min = Math.min(...values), max = Math.max(...values), r = max - min || 1;
		return values.map((v, i) => `${(i / (values.length - 1)) * width},${height - 2 - ((v - min) / r) * (height - 4)}`).join(' ');
	});
</script>

<svg {width} {height} viewBox="0 0 {width} {height}" class="overflow-visible" aria-hidden="true">
	{#if fill && pts}<polygon points="0,{height} {pts} {width},{height}" fill={color} opacity="0.12" />{/if}
	{#if pts}<polyline points={pts} fill="none" stroke={color} stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" />{/if}
</svg>
