<script lang="ts">
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import ResidenceFields from './ResidenceFields.svelte';
	let residenceState=$state(''),lga=$state(''),whatsapp=$state(''),nin=$state('');
	const auth = useAuth(), client = useConvexClient();
	const profile = useQuery(api.portal.profile, () => auth.isAuthenticated ? {} : 'skip');
	let adult = $state(false), busy = $state(false), error = $state('');
	let referralHandled=$state(false);
	const next = $derived(page.url.searchParams.get('next') || '/home');
	const safeNext = () => next.startsWith('/') && !next.startsWith('//') && !next.includes('\\') ? next : '/home';
	$effect(() => { if (!auth.isLoading && !auth.isAuthenticated) goto('/login', { replaceState: true }); });
	$effect(() => { if (profile.data?.ninLast4&&profile.data.state&&profile.data.lga&&profile.data.whatsapp&&!busy) {
	 const ref=page.url.searchParams.get('ref');if(ref&&!referralHandled){referralHandled=true;busy=true;client.action(api.referrals.attach,{code:ref}).then(()=>goto(safeNext(),{replaceState:true})).catch(e=>error=e instanceof Error?e.message:'Referral attribution failed.').finally(()=>busy=false);}else if(!error)goto(safeNext(),{replaceState:true});
	} });
	async function complete(event: SubmitEvent) {
		event.preventDefault(); busy = true;
	try { await client.mutation(api.portal.bootstrap, { isMinor: !adult }); await client.action(api.identity.update,{state:residenceState,lga,whatsapp,nin});nin='';const ref=page.url.searchParams.get('ref');if(ref)await client.action(api.referrals.attach,{code:ref});await goto(safeNext()); }
		catch (e) { error = e instanceof Error ? e.message : 'Account setup failed.'; }
		finally { busy = false; }
	}
</script>
<svelte:head><title>Complete account setup · SchoolXense</title><meta name="robots" content="noindex" /></svelte:head>
<form class="panel p-6 max-w-lg w-full grid gap-4" onsubmit={complete}>
	<h1 class="text-2xl font-semibold">Your learning starts here</h1>
	<p class="muted">Choose your age group so SchoolXense can apply the right guardian and earning protections.</p>
	<label class="flex gap-3"><input type="checkbox" bind:checked={adult} /><span>I am 18 or older.</span></label>
	<p class="text-xs muted">Under-18 accounts cannot take paid work and need guardian consent for paid bookings.</p>
	<ResidenceFields bind:state={residenceState} bind:lga bind:whatsapp bind:nin prefix="welcome"/>
	{#if error}<p role="alert" style="color:var(--bad)">{error}</p>{/if}
	{#if error&&profile.data?.ninLast4}<a class="ctl" href={safeNext()}>Continue with existing attribution</a>{/if}
	<button class="ctl ctl-primary" disabled={busy || !auth.isAuthenticated}>{busy ? 'Saving…' : 'Continue'}</button>
</form>
