<script lang="ts">
	import { MODULES } from '$hive/catalogue';
	import { hive } from '$hive/store.svelte';
	import { ui } from '$ui/ui.svelte';
	import { ROLE_LABEL, ROLE_HOME } from '$ui/nav';
	import { naira } from '$ui/format';
	import ModuleCard from '$ui/ModuleCard.svelte';
	import Icon from '$ui/Icon.svelte';
	import Tabs from '$ui/Tabs.svelte';
	let side = $state('all');
	const me = $derived(ui.me);
	const shown = $derived(side === 'all' ? MODULES : MODULES.filter((m) => m.side === side));

	const CORE = [
		['Hive ID', 'One identity, many roles', 'user-check'], ['Hive Wallet', 'Balances, escrow, payouts', 'wallet'], ['Hive Share ledger', 'Double-entry splits', 'scale'], ['Hive Record', 'Verified profile', 'badge'],
		['Notifications', 'Account notifications', 'bell'], ['Search', 'Find learning opportunities', 'search'], ['Integrity service', 'Learning-integrity screening', 'shield-check'], ['AI router', 'Reviewed practice drafts', 'sparkles'],
		['Media & files', 'R2 + Images', 'layers'], ['Audit log', 'Append-only', 'list'], ['Feature flags', 'Controlled feature rollout', 'toggle'], ['Operations console', 'Role-scoped views', 'activity']
	];
</script>

<svelte:head><title>Explore the hub · SchoolXense</title></svelte:head>

<section class="max-w-[1240px] mx-auto px-4 sm:px-6 pt-12">
	<p class="eyebrow" style="color:var(--accent)">The centralized hub</p>
	<h1 class="text-[2.3rem] sm:text-[2.8rem] font-semibold leading-tight mt-2 max-w-3xl">Twelve modules on one shared core. Every module reads the same profile, wallet and question bank.</h1>

	{#if me}
		<div class="panel p-5 mt-8 flex flex-wrap items-center gap-4">
			<div class="flex-1 min-w-60">
				<p class="eyebrow">Signed in as {me.name}</p>
				<p class="mt-1 text-sm text-[var(--text-2)]">Your roles unlock these dashboards — one account, no switching apps.</p>
			</div>
			<div class="flex flex-wrap gap-2">
				{#each me.roles as r}<a href={ROLE_HOME[r]} class="ctl ctl-sm" onclick={() => hive.switchRole(r)}>{ROLE_LABEL[r]}<Icon name="arrow-right" size={14} /></a>{/each}
			</div>
		</div>
	{/if}

	<div class="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
		{#each [['Account access', 'Verified email'], ['Practice content', 'Reviewed questions'], ['Your progress', 'Saved live'], ['Learning support', 'Guardian controls']] as [k, v]}
			<div class="panel p-4"><p class="eyebrow">{k}</p><p class="num text-2xl font-semibold mt-1">{v}</p></div>
		{/each}
	</div>
</section>

<section class="max-w-[1240px] mx-auto px-4 sm:px-6 mt-12">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h2 class="text-2xl font-semibold">Modules</h2>
		<Tabs bind:value={side} label="Filter" items={[{ id: 'all', label: 'All', count: MODULES.length }, { id: 'learn', label: 'Learn', count: MODULES.filter((x) => x.side === 'learn').length }, { id: 'earn', label: 'Earn', count: MODULES.filter((x) => x.side === 'earn').length }, { id: 'institution', label: 'Institutions', count: 1 }, { id: 'core', label: 'Core', count: 2 }]} />
	</div>
	<div class="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each shown as mod (mod.id)}<ModuleCard m={mod} signedIn={!!me} />{/each}
	</div>
</section>

<section class="max-w-[1240px] mx-auto px-4 sm:px-6 mt-16">
	<h2 class="text-2xl font-semibold">Shared core services</h2>
	<p class="muted mt-1">Keep your profile, learning progress and support requests together as you explore the hub.</p>
	<div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
		{#each CORE as [t, d, i]}
			<div class="panel p-4 flex gap-3 items-start"><span style="color:var(--brand)"><Icon name={i} size={19} /></span><div><p class="font-semibold text-sm">{t}</p><p class="text-xs muted">{d}</p></div></div>
		{/each}
	</div>
	<div class="panel p-5 mt-6 grid md:grid-cols-4 gap-4 text-sm">
		{#each [['Clients', 'PWA (offline packs) · USSD *384*HIVE# · WhatsApp & SMS'], ['Edge', 'Cloudflare Workers · WAF · Turnstile · KV · Queues · Durable Objects · Realtime'], ['Backend', 'Convex: 10 domains, ACID money mutations, live queries, crons'], ['Providers', 'Flutterwave · Reviewed practice drafts · Smile ID · Africa\'s Talking · Resend']] as [k, v], i}
			<div class="flex flex-col gap-1.5"><span class="badge badge-accent w-fit">{i + 1}. {k}</span><p class="text-[var(--text-2)]">{v}</p></div>
		{/each}
	</div>
</section>
