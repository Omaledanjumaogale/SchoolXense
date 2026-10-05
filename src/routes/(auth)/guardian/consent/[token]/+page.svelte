<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import Icon from '$ui/Icon.svelte';
	const auth=useAuth(),client=useConvexClient();let acknowledged=$state(false),busy=$state(false),error=$state('');
	async function open(){if(!auth.isAuthenticated){await goto(`/login?next=${encodeURIComponent(page.url.pathname)}`);return;}busy=true;error='';try{const token=page.params.token;if(!token)throw new Error('This invitation is incomplete.');await client.mutation(api.family.accept,{token,acknowledge:acknowledged});await goto('/family');}catch(e){error=e instanceof Error?e.message:'Unable to accept this invitation.';}finally{busy=false;}}
</script>

<div class="panel p-6 max-w-md rise flex flex-col gap-3">
	<span class="grid place-items-center w-12 h-12 rounded-xl" style="background:var(--info-soft);color:var(--info)"><Icon name="shield-check" size={24} /></span>
	<h1 class="text-2xl font-semibold">Guardian consent</h1>
	<p class="muted text-sm">A learner under 18 has asked to link their SchoolXense account to you. As their guardian you approve bookings over your spending limit, see their progress and session recordings, and are included in every message thread.</p>
	<label class="flex gap-3 text-sm"><input type="checkbox" bind:checked={acknowledged}/>I confirm that I am responsible for this learner.</label>
	{#if error}<p role="alert" style="color:var(--bad)">{error}</p>{/if}
	<button class="ctl ctl-primary" disabled={busy||!acknowledged} onclick={open}>{auth.isAuthenticated?'Accept request':'Sign in to review'}<Icon name="arrow-right" size={16} /></button>
</div>
