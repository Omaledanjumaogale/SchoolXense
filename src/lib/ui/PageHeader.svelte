<script lang="ts">
	import type { Snippet } from 'svelte';
	let { title, eyebrow, sub, actions }: { title: string; eyebrow?: string; sub?: string; actions?: Snippet } = $props();
</script>

<header class="flex flex-wrap items-end justify-between gap-4 mb-6 rise">
	<div class="min-w-0">
		{#if eyebrow}<p class="eyebrow mb-1.5" style="color:var(--accent)">{eyebrow}</p>{/if}
		<h1 class="text-[1.75rem] sm:text-[2rem] font-semibold leading-tight">{title}</h1>
		{#if sub}<p class="muted mt-1.5 max-w-2xl">{sub}</p>{/if}
	</div>
	{#if actions}<div class="flex flex-wrap gap-2">{@render actions()}</div>{/if}
</header>
