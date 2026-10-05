<script lang="ts">
	import { ui } from './ui.svelte';
	import Icon from './Icon.svelte';
	const icons = { good: 'check', warn: 'alert', bad: 'alert', info: 'info' } as const;
</script>

<div class="fixed z-[80] bottom-20 lg:bottom-6 right-3 left-3 sm:left-auto sm:w-96 flex flex-col gap-2 pointer-events-none" aria-live="polite">
	{#each ui.toasts as t (t.id)}
		<div class="panel rise pointer-events-auto flex gap-3 items-start px-4 py-3" style="background:var(--surface-solid);border-left:3px solid var(--{t.tone})">
			<span style="color:var(--{t.tone})" class="mt-0.5"><Icon name={icons[t.tone]} size={18} /></span>
			<div class="flex-1 min-w-0 text-sm"><p class="font-semibold">{t.title}</p>{#if t.body}<p class="muted">{t.body}</p>{/if}</div>
			<button class="muted hover:text-[var(--text)]" onclick={() => ui.dismiss(t.id)} aria-label="Dismiss"><Icon name="x" size={16} /></button>
		</div>
	{/each}
</div>
