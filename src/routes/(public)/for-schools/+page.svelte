<script lang="ts">
	import { ui } from '$ui/ui.svelte';
	import Icon from '$ui/Icon.svelte';
	import HexMark from '$ui/HexMark.svelte';
	import Bars from '$ui/Bars.svelte';
	let sent = $state(false);
	let form = $state({ name: '', school: '', role: 'Principal', email: '', learners: 400 });
	let busy=$state(false),error=$state('');
	async function submit(event:SubmitEvent){event.preventDefault();busy=true;error='';try{const response=await fetch('/api/enquiries',{method:'POST',body:new URLSearchParams({name:form.name,email:form.email,organisation:form.school,topic:'School onboarding',message:`Please contact me about onboarding ${form.learners} learners. My role is ${form.role}.`,consent:'on'})});if(!response.ok)throw new Error((await response.json()).message??'Unable to submit.');sent=true;}catch(e){error=e instanceof Error?e.message:'Please try again.';}finally{busy=false;}}
</script>

<svelte:head><title>Hive Institutions · For schools and universities</title></svelte:head>

<section class="max-w-[1240px] mx-auto px-4 sm:px-6 pt-12" data-module="institutions">
	<div class="grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
		<div class="rise">
			<div class="flex items-center gap-3"><HexMark size={44} glyph="building" color="#334155" /><span class="eyebrow">Hive Institutions</span></div>
			<h1 class="text-[2.3rem] sm:text-[3rem] font-semibold leading-tight mt-4">See how ready your learners are — before results day.</h1>
			<p class="text-lg text-[var(--text-2)] mt-4">Class readiness dashboards, hosted CBT with proctor event logs, tutor-team contracts, invoices by virtual account and a white-label portal on your own subdomain.</p>
			<div class="flex flex-wrap gap-3 mt-6"><a href="#contact" class="ctl ctl-primary !h-12 !px-6">Discuss school onboarding</a><a href="/login" class="ctl !h-12 !px-6">Sign in to your workspace</a></div>
			<p class="text-xs muted mt-3">We sign institutional contracts after two exam cycles of usage data — proof first.</p>
		</div>
		<div class="panel p-5" style="background:var(--surface-solid)">
			<p class="badge badge-info mb-4">Illustrative dashboard · example data</p>
			<div class="flex items-center justify-between"><p class="font-semibold">Greenfield Schools · SS3</p><span class="badge">Avg readiness C4 → B3</span></div>
			<div class="grid grid-cols-3 gap-2 mt-4 text-center">
				{#each [['412/450', 'Seats'], ['368', 'Active 7d'], ['14 Nov', 'Mock 2']] as [v, k]}<div class="panel-sunk p-2"><p class="num font-semibold">{v}</p><p class="text-[11px] muted">{k}</p></div>{/each}
			</div>
			<p class="eyebrow mt-5 mb-2">Readiness by class</p>
			<Bars rows={[{ label: 'SS3A', value: 66, hint: 'B3' }, { label: 'SS3B', value: 58, hint: 'C4' }, { label: 'SS3C', value: 53, hint: 'C5' }]} max={100} format={(n) => n + '%'} />
			<p class="eyebrow mt-5 mb-2">Weakest topics</p>
			<Bars rows={[{ label: 'Organic chem', value: 41, tone: 'var(--bad)' }, { label: 'Optics', value: 46, tone: 'var(--bad)' }, { label: 'Statistics', value: 49, tone: 'var(--warn)' }]} max={100} format={(n) => n + '%'} />
		</div>
	</div>

	<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-16">
		{#each [['chart', 'Readiness dashboards', 'By class, department or LGA, with exportable outcome reports.'], ['file', 'Hosted CBT', '₦500 per candidate. Proctor events: tab switches, paste, fullscreen exits.'], ['handoff', 'Tutor-team contracts', 'Post scoped revision work; verified teams bid; milestones release escrow.'], ['sparkles', 'White-label', 'Your logo and colours on your own subdomain or custom domain.']] as [i, t, d]}
			<div class="panel p-5"><span style="color:var(--accent)"><Icon name={i} size={22} /></span><h3 class="font-semibold mt-3">{t}</h3><p class="text-sm muted mt-1">{d}</p></div>
		{/each}
	</div>

	<div id="contact" class="panel p-6 sm:p-8 mt-16 grid lg:grid-cols-2 gap-8">
		<div><h2 class="text-2xl font-semibold">Book a demo</h2><p class="muted mt-2">Tell us about your school. We'll set up a pilot tenant with your classes and show you a live readiness dashboard within a week.</p><ul class="mt-4 grid gap-2 text-sm">{#each ['School licence ₦1.5M–₦4M per year', 'Universities and state programmes priced per seat', 'Sponsored seats ₦4,000 per learner per season'] as l}<li class="flex gap-2"><Icon name="check" size={15} class="text-[var(--good)] mt-0.5" />{l}</li>{/each}</ul></div>
		{#if sent}
			<div class="panel-sunk p-6 grid place-items-center text-center"><Icon name="check" size={28} class="text-[var(--good)]" /><p class="font-semibold mt-2">Thanks, {form.name.split(' ')[0]} — we'll be in touch within one working day.</p></div>
		{:else}
			<form class="grid gap-3" onsubmit={submit}>
				{#if error}<p role="alert" style="color:var(--bad)">{error}</p>{/if}
				<div class="grid sm:grid-cols-2 gap-3"><input class="field" placeholder="Your name" bind:value={form.name} required aria-label="Your name" /><input class="field" placeholder="School or institution" bind:value={form.school} required aria-label="School" /></div>
				<div class="grid sm:grid-cols-2 gap-3"><select class="field" bind:value={form.role} aria-label="Role">{#each ['Principal', 'Vice principal', 'HOD', 'Registrar', 'Centre owner', 'State official', 'CSR lead'] as r}<option>{r}</option>{/each}</select><input class="field" type="email" placeholder="Work email" bind:value={form.email} required aria-label="Email" /></div>
				<label class="text-sm">Learners: <span class="num font-semibold">{form.learners}</span><input type="range" min="50" max="5000" step="50" bind:value={form.learners} class="w-full accent-[var(--brand)]" /></label>
				<label class="flex gap-2 text-sm"><input type="checkbox" required/>I agree to being contacted about this school enquiry.</label>
				<button class="ctl ctl-primary" disabled={busy}>{busy?'Submitting…':'Send school enquiry'}</button>
			</form>
		{/if}
	</div>
</section>
