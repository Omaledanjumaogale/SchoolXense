<script lang="ts">
 import {useAuth} from '@mmailaender/convex-better-auth-svelte/svelte';
 import {useConvexClient} from 'convex-svelte';
 import {api} from '$convex/_generated/api';
 import {goto} from '$app/navigation';
 import {naira} from '$ui/format';
 let {data}=$props();const auth=useAuth(),client=useConvexClient();let busy=$state(false),message=$state('');
 async function enrol(){if(!auth.isAuthenticated){await goto('/login?next='+encodeURIComponent('/cohorts/'+data.cohort._id));return;}busy=true;message='';try{const order=await client.mutation(api.checkout.order,{kind:'cohort',refId:data.cohort._id});await goto('/checkout/'+order);}catch(e){message=e instanceof Error?e.message:'Unable to begin enrolment';}finally{busy=false;}}
</script>
<section class="max-w-4xl mx-auto px-4 sm:px-6 py-12"><p class="eyebrow">Upcoming learning cohort</p><h1 class="text-4xl font-semibold mt-3">{data.cohort.title}</h1><p class="mt-5">{data.cohort.description}</p><dl class="panel p-6 grid sm:grid-cols-2 gap-4 mt-8"><div><dt>Host</dt><dd>{data.cohort.hostName}</dd></div><div><dt>Subject</dt><dd>{data.cohort.subject}</dd></div><div><dt>Starts</dt><dd>{new Date(data.cohort.startsAt).toLocaleDateString('en-NG',{timeZone:'Africa/Lagos'})}</dd></div><div><dt>Schedule</dt><dd>{data.cohort.schedule} · {data.cohort.weeks} weeks</dd></div><div><dt>Price</dt><dd>{naira(Number(data.cohort.price))}</dd></div></dl><p class="muted mt-5">Enrolment requires a verified SchoolXense account, applicable access conditions and server-confirmed payment.</p>{#if message}<p role="alert" class="mt-4">{message}</p>{/if}<button class="ctl ctl-primary mt-5" disabled={busy} onclick={enrol}>{busy?'Preparing checkout…':'Begin enrolment'}</button></section>
