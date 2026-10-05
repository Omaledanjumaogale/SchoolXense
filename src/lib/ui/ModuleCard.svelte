<script lang="ts">
	import type { HiveModule } from '$hive/catalogue';
	import HexMark from './HexMark.svelte';
	import Icon from './Icon.svelte';
	let { m, signedIn = false }: { m: HiveModule; signedIn?: boolean } = $props();
	const SIDE = { learn: 'Learn', earn: 'Earn', institution: 'Institutions', core: 'Core engine' };
</script>

<a href={signedIn ? m.appHref : m.href} class="panel card-interactive group p-5 flex flex-col gap-3 h-full relative overflow-hidden">
	<span class="decor absolute -right-8 -bottom-10 w-32 h-32 hex opacity-[.07] transition-transform duration-500 group-hover:rotate-12" style="background:{m.accent}"></span>
	<div class="flex items-center justify-between">
		<HexMark size={40} glyph={m.glyph} color={m.accent} />
		<span class="badge">{SIDE[m.side]} · {m.release}</span>
	</div>
	<div>
		<h3 class="text-lg font-semibold">{m.name}</h3>
		<p class="text-sm text-[var(--text-2)] mt-1">{m.tagline}</p>
	</div>
	<dl class="text-xs grid gap-1 mt-auto pt-2" style="border-top:1px dashed var(--line)">
		<div class="flex gap-2"><dt class="muted w-16 shrink-0">Earners</dt><dd>{m.earners}</dd></div>
		<div class="flex gap-2"><dt class="muted w-16 shrink-0">Built from</dt><dd>{m.builtFrom}</dd></div>
	</dl>
	<span class="inline-flex items-center gap-1 text-sm font-semibold" style="color:{m.accent === '#334155' ? 'var(--text)' : m.accent}">{signedIn ? 'Open' : 'Explore'} <Icon name="arrow-right" size={15} class="transition-transform group-hover:translate-x-0.5" /></span>
</a>
