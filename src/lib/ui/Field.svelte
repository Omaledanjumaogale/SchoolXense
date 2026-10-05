<script lang="ts">
	import type { Snippet } from 'svelte';
	let { label, hint, children, id }: { label: string; hint?: string; children: Snippet; id?: string } = $props();
</script>

<div class="flex flex-col">
	<label class="label" for={id}>{label}</label>
	{@render children()}
	{#if hint}<p class="text-xs muted mt-1">{hint}</p>{/if}
</div>
