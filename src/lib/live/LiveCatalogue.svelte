<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { naira } from '$ui/format';
	import Icon from '$ui/Icon.svelte';
	const client = useConvexClient(), auth = useAuth();
	const kind = $derived<'offers' | 'packs' | 'cohorts'>(page.url.pathname.startsWith('/tutors') ? 'offers' : page.url.pathname.startsWith('/library') ? 'packs' : 'cohorts');
	const catalogue = useQuery(api.portal.catalogue, () => ({ kind }));
	const items = $derived((catalogue.data ?? []).filter((item): item is Exclude<typeof item, {quote:string}> => 'title' in item));
	let error = $state(''), busy = $state(false);
	async function buy(id: string) {
		if (!auth.isAuthenticated) { await goto(`/login?next=${encodeURIComponent(page.url.pathname)}`); return; }
		busy = true; error = '';
		try { const order = await client.mutation(api.checkout.order, { kind: kind === 'packs' ? 'pack' : 'cohort', refId: id }); await goto(`/checkout/${order}`); }
		catch (e) { error = e instanceof Error ? e.message : 'Unable to create your order.'; }
		finally { busy = false; }
	}
</script>
<svelte:head><title>{kind === 'offers' ? 'Find a tutor' : kind === 'packs' ? 'Study library' : 'Learning cohorts'} · SchoolXense</title></svelte:head>
<section class="max-w-[1240px] mx-auto px-4 sm:px-6 pt-12">
	<p class="eyebrow">Learn with SchoolXense</p><h1 class="text-4xl font-semibold mt-3">{kind === 'offers' ? 'Find your next learning partner' : kind === 'packs' ? 'Explore original study resources' : 'Make progress together'}</h1>
	<p class="muted mt-4">{kind === 'offers' ? 'Offers from verified tutors, with clear pricing and protected bookings.' : 'Published resources and upcoming cohorts, updated as creators add new material.'}</p>
	{#if error}<p role="alert" class="mt-5" style="color:var(--bad)">{error}</p>{/if}
	<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">{#each items as item}<article class="panel p-5"><Icon name={kind === 'offers' ? 'users' : 'book'} size={22} /><h2 class="font-semibold text-xl mt-4">{item.title}</h2><p class="num text-2xl mt-3">{naira(Number(item.price))}</p>{#if kind === 'offers'}<a href="/book" class="ctl ctl-primary mt-5">Request session</a>{:else}<button class="ctl ctl-primary mt-5" disabled={busy} onclick={() => buy(item._id)}>View checkout</button>{/if}</article>{:else}<div class="panel p-6 md:col-span-2"><h2 class="font-semibold">{catalogue.error ? 'Unable to load the catalogue' : catalogue.isLoading ? 'Loading…' : 'New opportunities are on their way'}</h2><p class="muted mt-3">{catalogue.error ? 'Please reconnect and try again.' : 'Published offers and resources will appear here. Contact us if you need help finding the right support.'}</p><a class="ctl mt-4" href="/#enquiries">Send an enquiry</a></div>{/each}</div>
</section>
