<script lang="ts">
	import Icon from './Icon.svelte';
	let { value, count, size = 14 }: { value: number; count?: number; size?: number } = $props();
</script>

<span class="inline-flex items-center gap-1 text-sm" aria-label="{value.toFixed(1)} out of 5">
	<span style="color:var(--color-comb-400)"><Icon name="star" {size} stroke={0} class="fill-current" /></span>
	<span class="num font-semibold">{value ? value.toFixed(1) : 'New'}</span>
	{#if count !== undefined}<span class="muted">({count})</span>{/if}
</span>
