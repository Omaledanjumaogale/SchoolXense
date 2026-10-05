<script lang="ts">
	import { goto } from '$app/navigation';
	import { hive } from '$hive/store.svelte';
	import { MODULES } from '$hive/catalogue';
	import { ui } from './ui.svelte';
	import Icon from './Icon.svelte';
	let q = $state('');
	let idx = $state(0);
	let input = $state<HTMLInputElement>();
	const quick = [
		{ kind: 'Go', label: 'Today', sub: 'Learner dashboard', href: '/home' },
		{ kind: 'Go', label: 'Earnings', sub: 'Earner dashboard', href: '/earn' },
		{ kind: 'Go', label: 'Explore all modules', sub: 'The SchoolXense hub', href: '/explore' },
		{ kind: 'Go', label: 'Wallet', sub: 'Balance, escrow, payouts', href: '/wallet' },
		{ kind: 'Go', label: 'Settings', sub: 'Profile, privacy, data saver', href: '/settings' }
	];
	const results = $derived(q.trim() ? [...hive.search(q), ...MODULES.filter((m) => m.name.toLowerCase().includes(q.toLowerCase())).map((m) => ({ kind: 'Module', label: m.name, sub: m.tagline, href: m.appHref }))] : quick);
	$effect(() => { if (ui.paletteOpen) { q = ''; idx = 0; setTimeout(() => input?.focus(), 10); } });
	function key(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); ui.paletteOpen = !ui.paletteOpen; }
		if (!ui.paletteOpen) return;
		if (e.key === 'Escape') ui.paletteOpen = false;
		if (e.key === 'ArrowDown') { e.preventDefault(); idx = Math.min(results.length - 1, idx + 1); }
		if (e.key === 'ArrowUp') { e.preventDefault(); idx = Math.max(0, idx - 1); }
		if (e.key === 'Enter' && results[idx]) go(results[idx].href);
	}
	function go(href: string) { ui.paletteOpen = false; goto(href); }
</script>

<svelte:window onkeydown={key} />

{#if ui.paletteOpen}
	<div class="fixed inset-0 z-[90] grid place-items-start justify-center pt-[12vh] px-3" style="background:rgba(8,12,22,.5);backdrop-filter:blur(3px)" onclick={(e) => { if (e.target === e.currentTarget) ui.paletteOpen = false; }} role="presentation">
		<div class="panel rise w-full max-w-xl overflow-hidden" style="background:var(--surface-solid)" role="dialog" aria-label="Command palette">
			<div class="flex items-center gap-3 px-4 h-14" style="border-bottom:1px solid var(--line)">
				<Icon name="search" size={18} class="muted" />
				<input bind:this={input} bind:value={q} oninput={() => (idx = 0)} class="flex-1 bg-transparent outline-none text-base" placeholder="Jump to a course, tutor, team, pack or module…" aria-label="Search" />
				<kbd class="badge num">Esc</kbd>
			</div>
			<ul class="max-h-[50vh] overflow-y-auto p-2" role="listbox">
				{#each results as r, i (r.href + r.label)}
					<li role="option" aria-selected={i === idx}>
						<button class="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg {i === idx ? 'panel' : ''}" onmouseenter={() => (idx = i)} onclick={() => go(r.href)}>
							<span class="badge w-20 justify-center">{r.kind}</span>
							<span class="min-w-0 flex-1"><span class="block font-medium truncate">{r.label}</span><span class="block text-xs muted truncate">{r.sub}</span></span>
							{#if i === idx}<Icon name="arrow-right" size={16} class="muted" />{/if}
						</button>
					</li>
				{:else}
					<li class="p-6 text-center muted text-sm">No matches for “{q}”.</li>
				{/each}
			</ul>
		</div>
	</div>
{/if}
