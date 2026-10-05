<script lang="ts">
	import { moduleById, examById } from '$hive/catalogue';
	import { hive } from '$hive/store.svelte';
	import HexMark from '$ui/HexMark.svelte';
	import Icon from '$ui/Icon.svelte';
	import OfferCard from '$ui/OfferCard.svelte';
	let { data } = $props();
	const l = $derived(data.l);
	const m = $derived(moduleById(l.module));
	const offers = $derived(hive.db.offers.filter((o) => o.active && (o.module === l.module || (l.module === 'secondary' && o.module === 'tutors'))).slice(0, 3));
</script>

<svelte:head><title>{m.name} · SchoolXense</title><meta name="description" content={l.lead} /></svelte:head>

<section class="max-w-[1240px] mx-auto px-4 sm:px-6 pt-14 pb-10" data-module={l.module}>
	<div class="grid lg:grid-cols-[1.2fr_1fr] gap-10 items-center">
		<div class="rise">
			<div class="flex items-center gap-3"><HexMark size={44} glyph={m.glyph} color={m.accent} /><span class="eyebrow" style="color:var(--accent)">{l.eyebrow}</span></div>
			<h1 class="mt-5 text-[2.3rem] sm:text-[3rem] leading-[1.06] font-semibold">{l.title}</h1>
			<p class="mt-4 text-lg text-[var(--text-2)] max-w-2xl">{l.lead}</p>
			<div class="mt-7 flex flex-wrap gap-3">
				<a href={l.primary.href} class="ctl ctl-primary !h-12 !px-6">{l.primary.label}<Icon name="arrow-right" size={17} /></a>
				{#if l.secondary}<a href={l.secondary.href} class="ctl !h-12 !px-6">{l.secondary.label}</a>{/if}
			</div>
		</div>
		<div class="grid grid-cols-2 gap-3">
			{#each l.stats as [v, k], i}
				<div class="panel p-5" style="transform:translateY({i % 2 ? 14 : 0}px)"><p class="num text-3xl font-semibold" style="color:var(--accent)">{v}</p><p class="text-sm muted mt-1">{k}</p></div>
			{/each}
		</div>
	</div>
</section>

<section class="max-w-[1240px] mx-auto px-4 sm:px-6 mt-10" data-module={l.module}>
	<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each l.features as f}
			<div class="panel p-5 flex flex-col gap-2">
				<span class="grid place-items-center w-10 h-10 rounded-lg" style="background:var(--accent-soft);color:var(--accent)"><Icon name={f.icon} size={19} /></span>
				<h3 class="font-semibold text-lg mt-1">{f.t}</h3>
				<p class="text-sm text-[var(--text-2)]">{f.d}</p>
			</div>
		{/each}
	</div>
</section>

{#if l.exams}
	<section class="max-w-[1240px] mx-auto px-4 sm:px-6 mt-16">
		<h2 class="text-2xl font-semibold">Start practising</h2>
		<div class="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
			{#each l.exams as eid}
				{@const ex = examById(eid)}
				{#if ex}
					{#each ex.subjects as s}
						<a href="/practice/{ex.id}/{s.id}" class="panel card-interactive p-4 flex items-center gap-3">
							<span class="grid place-items-center w-10 h-10 rounded-lg panel-sunk num text-xs font-bold" style="color:var(--accent)">{ex.name.split(' ')[0]}</span>
							<span class="min-w-0 flex-1"><span class="block font-semibold truncate">{s.name}</span><span class="block text-xs muted truncate">{s.topics.join(' · ')}</span></span>
							<Icon name="chevron-right" size={18} class="muted" />
						</a>
					{/each}
				{/if}
			{/each}
		</div>
	</section>
{/if}

{#if offers.length && l.audience === 'learn'}
	<section class="max-w-[1240px] mx-auto px-4 sm:px-6 mt-16">
		<div class="flex items-end justify-between"><h2 class="text-2xl font-semibold">Tutors who passed it</h2><a href="/tutors" class="link text-sm">All tutors →</a></div>
		<div class="mt-5 grid md:grid-cols-3 gap-3">{#each offers as o (o.id)}<OfferCard offer={o} />{/each}</div>
	</section>
{/if}
