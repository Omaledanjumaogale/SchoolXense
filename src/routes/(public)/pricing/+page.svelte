<script lang="ts">
	import { goto } from '$app/navigation';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import { PLANS, INSTITUTION_PRICING } from '$payments/plans';
	import { naira, date } from '$ui/format';
	import PageHeader from '$ui/PageHeader.svelte';
	import Icon from '$ui/Icon.svelte';
	const auth=useAuth(),client=useConvexClient();
	const profile=useQuery(api.portal.profile,()=>auth.isAuthenticated?{}:'skip');
	const subscription=useQuery(api.subscriptions.current,()=>profile.data?.profileComplete||profile.data?.roles.includes('staff')?{}:'skip');
	const family=useQuery(api.portal.workspace,()=>profile.data?.profileComplete&&profile.data.roles.includes('guardian')?{domain:'family'}:'skip');
	let beneficiaryId=$state('');
	let busy=$state(false),error=$state(''),notice=$state('');
	async function buy(id: string) {
		if (id === 'free') { await goto(auth.isAuthenticated ? '/home' : '/signup'); return; }
		if(!PLANS.find(p=>p.id===id)?.purchasable){await goto('/#enquiries');return;}
		if (!auth.isAuthenticated) { await goto('/login?next=/pricing'); return; }
		if(!profile.data?.profileComplete){await goto('/welcome?next=/pricing');return;}
		busy=true;error='';try{const paymentId=await client.mutation(api.checkout.order,{kind:'subscription',refId:id,...(beneficiaryId?{beneficiaryId:beneficiaryId as Id<'users'>}:{})});await goto(`/checkout/${paymentId}`);}catch(e){error=e instanceof Error?e.message:'Unable to create this order.';}finally{busy=false;}
	}
	async function manage(kind:'cancel'|'resume'){busy=true;error='';notice='';try{const result=await client.mutation(kind==='cancel'?api.subscriptions.cancel:api.subscriptions.resume,{});notice=kind==='cancel'?`Renewal cancelled. Access continues until ${date(result.until,{day:'numeric',month:'long',year:'numeric'})}.`:'Renewal cancellation removed.';}catch(e){error=e instanceof Error?e.message:'Unable to update the subscription.';}finally{busy=false;}}
</script>

<svelte:head><title>Pricing · SchoolXense</title></svelte:head>

<section class="max-w-[1240px] mx-auto px-4 sm:px-6 pt-10">
	<PageHeader eyebrow="Pricing" title="Student prices. No surprises." sub="Pay by card, bank transfer, USSD or mobile money through Flutterwave. Guardians can pay for a child's plan." />
	{#if subscription.data?.active && subscription.data.until}<div class="panel-sunk p-4 text-sm mb-6"><div class="flex flex-wrap items-center gap-2"><Icon name="check" size={16} class="text-[var(--good)]" />Your plan <b>{PLANS.find((p) => p.id === subscription.data?.planId)?.name??'Administrator'}</b> is active until {date(subscription.data.until, { day: 'numeric', month: 'long',year:'numeric' })}.</div>{#if subscription.data.planId!=='staff'}<button class="ctl ctl-sm mt-3" disabled={busy} onclick={()=>manage(subscription.data?.cancelAtPeriodEnd?'resume':'cancel')}>{subscription.data.cancelAtPeriodEnd?'Keep subscription':'Cancel renewal'}</button>{/if}</div>{/if}
	{#if error}<p role="alert" class="panel-sunk p-3 mb-4" style="color:var(--bad)">{error}</p>{/if}{#if notice}<p role="status" class="panel-sunk p-3 mb-4" style="color:var(--good)">{notice}</p>{/if}
	{#if family.data?.children?.length}<label class="label block mb-5">Who is this plan for?<select class="field mt-2" bind:value={beneficiaryId}><option value="">My account</option>{#each family.data.children as child}<option value={child._id}>{child.name}</option>{/each}</select></label>{/if}
	<div class="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
		{#each PLANS as p}
			{@const featured = 'featured' in p}
			<div class="panel p-5 flex flex-col gap-3" style={featured ? 'border-color:var(--brand);box-shadow:inset 0 1px 0 var(--edge-top),var(--shadow-lift),var(--brand-glow)' : ''}>
				<div class="flex items-center justify-between gap-2"><h2 class="font-semibold">{p.name}</h2>{#if featured}<span class="badge badge-brand">Popular</span>{/if}</div>
				<p class="text-xs muted -mt-2">{p.tagline}</p>
				<p class="num text-2xl font-semibold">{p.priceKobo ? naira(p.priceKobo) : 'Free'}<span class="text-xs muted font-normal"> / {p.period}</span></p>
				<ul class="text-sm grid gap-1.5">{#each p.features as f}<li class="flex gap-2"><Icon name="check" size={14} class="text-[var(--good)] mt-1" />{f}</li>{/each}</ul>
				<button class="ctl mt-auto {featured ? 'ctl-primary' : ''}" disabled={busy} onclick={() => buy(p.id)}>{p.cta}</button>
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
