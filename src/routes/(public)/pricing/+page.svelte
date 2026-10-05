<script lang="ts">
	import { goto } from '$app/navigation';
	import { hive } from '$hive/store.svelte';
	import { ui } from '$ui/ui.svelte';
	import { PLANS, INSTITUTION_PRICING } from '$payments/plans';
	import { naira, date } from '$ui/format';
	import PageHeader from '$ui/PageHeader.svelte';
	import Icon from '$ui/Icon.svelte';
	function buy(id: string, price: number) {
		if (id === 'free') { goto(ui.me ? '/home' : '/signup'); return; }
		if (!ui.me) { goto('/login?next=/pricing'); return; }
		const child = ui.me.roles.includes('guardian') ? ui.me.children?.[0] : undefined;
		const p = ui.run(() => hive.buyPlan(id, price, child));
		if (p) goto(`/checkout/${p.id}`);
	}
</script>

<svelte:head><title>Pricing · SchoolXense</title></svelte:head>

<section class="max-w-[1240px] mx-auto px-4 sm:px-6 pt-10">
	<PageHeader eyebrow="Pricing" title="Student prices. No surprises." sub="Pay by card, bank transfer, USSD or mobile money through Flutterwave. Guardians can pay for a child's plan." />
	{#if ui.me && ui.me.plan.until > Date.now()}<div class="panel-sunk p-3 text-sm mb-6 flex items-center gap-2"><Icon name="check" size={16} class="text-[var(--good)]" />Your plan <b>{PLANS.find((p) => p.id === ui.me!.plan.id)?.name}</b> is active until {date(ui.me.plan.until, { day: 'numeric', month: 'long' })}.</div>{/if}
	<div class="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
		{#each PLANS as p}
			{@const featured = 'featured' in p}
			<div class="panel p-5 flex flex-col gap-3" style={featured ? 'border-color:var(--brand);box-shadow:inset 0 1px 0 var(--edge-top),var(--shadow-lift),var(--brand-glow)' : ''}>
				<div class="flex items-center justify-between gap-2"><h2 class="font-semibold">{p.name}</h2>{#if featured}<span class="badge badge-brand">Popular</span>{/if}</div>
				<p class="text-xs muted -mt-2">{p.tagline}</p>
				<p class="num text-2xl font-semibold">{p.priceKobo ? naira(p.priceKobo) : 'Free'}<span class="text-xs muted font-normal"> / {p.period}</span></p>
				<ul class="text-sm grid gap-1.5">{#each p.features as f}<li class="flex gap-2"><Icon name="check" size={14} class="text-[var(--good)] mt-1" />{f}</li>{/each}</ul>
				<button class="ctl mt-auto {featured ? 'ctl-primary' : ''}" onclick={() => buy(p.id, p.priceKobo)}>{p.cta}</button>
			</div>
		{/each}
	</div>

	<h2 class="text-2xl font-semibold mt-16">For institutions, states and sponsors</h2>
	<div class="grid md:grid-cols-3 gap-4 mt-5">
		{#each INSTITUTION_PRICING as p}
			<div class="panel p-5 flex flex-col gap-3" data-module="institutions">
				<h3 class="font-semibold text-lg">{p.name}</h3>
				<p class="num text-xl font-semibold" style="color:var(--accent)">{p.price}</p>
				<ul class="text-sm grid gap-1.5">{#each p.items as f}<li class="flex gap-2"><Icon name="check" size={14} class="text-[var(--good)] mt-1" />{f}</li>{/each}</ul>
				<a href="/for-schools#contact" class="ctl mt-auto">Talk to us</a>
			</div>
		{/each}
	</div>
	<p class="text-xs muted mt-6">Marketplace prices are set by tutors and authors. SchoolXense keeps 20% of sessions, 15% of study packs and 12% of collab contracts — split across the Hive Share.</p>
</section>
