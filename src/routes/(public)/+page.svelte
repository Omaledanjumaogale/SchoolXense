<script lang="ts">
	import { MODULES } from '$hive/catalogue';
	import { PLANS } from '$payments/plans';
	import { naira } from '$ui/format';
	import { ui } from '$ui/ui.svelte';
	import Hero3D from '$ui/Hero3D.svelte';
	import ModuleCard from '$ui/ModuleCard.svelte';
	import HiveShare from '$ui/HiveShare.svelte';
	import HexMark from '$ui/HexMark.svelte';
	import Icon from '$ui/Icon.svelte';
	import Tabs from '$ui/Tabs.svelte';
	import LandingExtras from '$lib/live/LandingExtras.svelte';

	let side = $state('all');
	const shown = $derived(side === 'all' ? MODULES : MODULES.filter((m) => m.side === side || (side === 'learn' && m.side === 'core')));
	let shareKind = $state<'session' | 'pack' | 'collab' | 'subscription'>('session');
	let amount = $state(1875);

	const ROLES = [
		{ role: 'Peer tutor', who: '200–400 level student with strong results', range: '₦8k–₦40k', icon: 'users' },
		{ role: 'Studio writer & reviewer', who: 'Students, retired teachers', range: '₦10k–₦80k', icon: 'pen' },
		{ role: 'Cohort host', who: 'Top tutors and teachers', range: '₦50k–₦250k / season', icon: 'calendar' },
		{ role: 'Collab team lead', who: 'Experienced earners', range: '₦80k–₦400k', icon: 'handoff' },
		{ role: 'Translator', who: 'Bilingual students', range: '₦10k–₦50k', icon: 'globe' },
		{ role: 'Farmer field mentor', who: 'Working farmers', range: '₦15k–₦60k', icon: 'leaf' },
		{ role: 'Campus ambassador', who: 'Student leaders, teachers', range: '₦20k–₦150k', icon: 'megaphone' },
		{ role: 'Task worker', who: 'Any verified adult, 30 spare minutes', range: '₦5k–₦30k', icon: 'kanban' }
	];
	const LOOP = [
		{ t: 'Practice', d: 'Adaptive CBT finds your weak topics in 15–20 questions.', icon: 'target' },
		{ t: 'Diagnose', d: 'Readiness ranges and a mastery heatmap show exactly what to fix.', icon: 'chart' },
		{ t: 'Get help', d: 'Verified tutors who passed the same course — paid through escrow.', icon: 'lifebuoy' },
		{ t: 'Earn', d: 'Two years later, the learner becomes the tutor, writer or team lead.', icon: 'coins' }
	];
</script>

<svelte:head><title>SchoolXense — Learn out loud, earn from what you've mastered</title></svelte:head>

<!-- HERO -->
<section class="relative overflow-hidden">
	<div class="max-w-[1240px] mx-auto px-4 sm:px-6 pt-14 pb-16 lg:pt-20 grid lg:grid-cols-[1.05fr_1fr] gap-12 items-center">
		<div class="rise">
			<span class="badge badge-brand"><Icon name="sparkles" size={12} />CollegeCBT + SchoolCBT + ExamForge, now one hub</span>
			<h1 class="mt-5 text-[2.6rem] sm:text-[3.4rem] leading-[1.04] font-semibold">Learn out loud.<br /><span style="background:linear-gradient(90deg,var(--brand),var(--color-comb-400));-webkit-background-clip:text;background-clip:text;color:transparent">Earn from what you've mastered.</span></h1>
			<p class="mt-5 text-lg text-[var(--text-2)] max-w-xl">Adaptive JAMB, WAEC, NECO and campus CBT. Verified, escrow-protected tutors. Paid work writing questions, hosting cohorts and running team contracts. One account, one wallet, twelve modules.</p>
			<div class="mt-7 flex flex-wrap gap-3">
				<a href={ui.me ? '/home' : '/signup?intent=learn'} class="ctl ctl-primary !h-12 !px-6 text-base"><Icon name="target" size={18} />Start practising free</a>
				<a href="/signup?intent=earn" class="ctl !h-12 !px-6 text-base"><Icon name="coins" size={18} />Become an earner</a>
			</div>
			<dl class="mt-9 grid grid-cols-3 gap-3 max-w-lg">
				{#each [['100+', 'institutions in the course registry'], ['80%', 'of every session goes to the tutor'], ['48h', 'escrow window on every booking']] as [v, l]}
					<div class="panel-sunk px-3 py-3"><dt class="num text-2xl font-semibold">{v}</dt><dd class="text-xs muted mt-0.5 leading-snug">{l}</dd></div>
				{/each}
			</dl>
		</div>
		<Hero3D />
	</div>
</section>

<!-- THREE DOORS -->
<section class="max-w-[1240px] mx-auto px-4 sm:px-6">
	<div class="grid md:grid-cols-3 gap-4">
		{#each [
			{ t: 'I want to learn', d: 'JAMB, WAEC, NECO, NABTEB, 100+ campuses, ICAN, JUPEB, IELTS — plus tutors, cohorts and study packs.', href: '/secondary', cta: 'See learning modules', icon: 'target', c: 'var(--color-navy-800)' },
			{ t: 'I want to earn', d: 'Tutor, give draft feedback, write and review questions, translate, host cohorts or lead a team.', href: '/tutors', cta: 'See earning roles', icon: 'coins', c: 'var(--brand)' },
			{ t: 'I run an institution', d: 'Class readiness dashboards, hosted CBT with proctor logs, tutor-team contracts and white-label portals.', href: '/for-schools', cta: 'See Hive Institutions', icon: 'building', c: '#334155' }
		] as door}
			<a href={door.href} class="panel card-interactive p-6 flex flex-col gap-3 group">
				<span class="grid place-items-center w-11 h-11 rounded-xl text-white" style="background:linear-gradient(160deg,color-mix(in oklab,{door.c} 80%,white),{door.c});box-shadow:inset 0 1px 0 rgba(255,255,255,.3),0 6px 14px -6px {door.c}"><Icon name={door.icon} size={20} /></span>
				<h2 class="text-xl font-semibold">{door.t}</h2>
				<p class="text-sm text-[var(--text-2)]">{door.d}</p>
				<span class="mt-auto text-sm font-semibold inline-flex items-center gap-1" style="color:var(--brand)">{door.cta}<Icon name="arrow-right" size={15} class="transition-transform group-hover:translate-x-0.5" /></span>
			</a>
		{/each}
	</div>
</section>

<!-- LOOP -->
<section class="max-w-[1240px] mx-auto px-4 sm:px-6 mt-24">
	<p class="eyebrow" style="color:var(--accent)">The whole loop, on one platform</p>
	<h2 class="text-3xl sm:text-4xl font-semibold mt-2 max-w-2xl">Practice data shows who needs help. The marketplace supplies it. The earners came from the same learners.</h2>
	<ol class="mt-10 grid md:grid-cols-4 gap-4 relative">
		{#each LOOP as s, i}
			<li class="panel p-5 relative">
				<span class="num absolute top-4 right-4 text-xs muted">0{i + 1}</span>
				<span class="grid place-items-center w-10 h-10 rounded-lg panel-sunk" style="color:var(--brand)"><Icon name={s.icon} size={19} /></span>
				<h3 class="mt-4 text-lg font-semibold">{s.t}</h3>
				<p class="text-sm muted mt-1">{s.d}</p>
			</li>
		{/each}
	</ol>
</section>

<!-- MODULES -->
<section class="max-w-[1240px] mx-auto px-4 sm:px-6 mt-24" id="modules">
	<div class="flex flex-wrap items-end justify-between gap-4">
		<div>
			<p class="eyebrow" style="color:var(--accent)">One account · one wallet · twelve modules</p>
			<h2 class="text-3xl sm:text-4xl font-semibold mt-2">Everything in the hive</h2>
		</div>
		<Tabs bind:value={side} label="Filter modules" items={[{ id: 'all', label: 'All' }, { id: 'learn', label: 'Learn' }, { id: 'earn', label: 'Earn' }, { id: 'institution', label: 'Institutions' }]} />
	</div>
	<div class="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each shown as m (m.id)}<ModuleCard {m} />{/each}
	</div>
</section>

<!-- HIVE SHARE -->
<section class="max-w-[1240px] mx-auto px-4 sm:px-6 mt-24">
	<div class="panel p-6 sm:p-10 grid lg:grid-cols-[1fr_1.1fr] gap-10 items-center relative overflow-hidden">
		<div class="decor absolute -left-16 -bottom-20 w-72 h-72 hex opacity-[.06]" style="background:var(--brand)"></div>
		<div class="relative">
			<p class="eyebrow" style="color:var(--brand)">The Hive Share</p>
			<h2 class="text-3xl font-semibold mt-2">Every naira is split before anyone is paid.</h2>
			<p class="mt-3 text-[var(--text-2)]">The earner, the platform, whoever referred them, the tutor who handed off the booking and the Learner Impact Fund all gain from the same transaction — recorded in a double-entry ledger, paid out daily through Flutterwave.</p>
			<ul class="mt-5 grid gap-2 text-sm">
				<li class="flex gap-2"><Icon name="check" size={16} class="text-[var(--good)] mt-0.5" />Unattributed slices go back to the platform — never to nobody.</li>
				<li class="flex gap-2"><Icon name="check" size={16} class="text-[var(--good)] mt-0.5" />No shares paid on refunded or disputed money.</li>
				<li class="flex gap-2"><Icon name="check" size={16} class="text-[var(--good)] mt-0.5" />The Learner Impact Fund buys sponsored seats and reports quarterly.</li>
			</ul>
		</div>
		<div class="relative panel p-5" style="background:var(--surface-solid)">
			<div class="flex flex-wrap items-center gap-2 justify-between">
				<Tabs bind:value={shareKind} label="Transaction type" items={[{ id: 'session', label: 'Session' }, { id: 'pack', label: 'Study pack' }, { id: 'collab', label: 'Collab' }, { id: 'subscription', label: 'Hive Plus' }]} />
			</div>
			<label class="block mt-5"><span class="label">Payment amount: <span class="num">{naira(amount * 100)}</span></span>
				<input type="range" min="500" max="50000" step="125" bind:value={amount} class="w-full accent-[var(--brand)]" />
			</label>
			<div class="mt-4"><HiveShare kind={shareKind} grossKobo={amount * 100} referrer={true} collab={shareKind === 'session'} /></div>
		</div>
	</div>
</section>

<!-- EARNING ROLES -->
<section class="max-w-[1240px] mx-auto px-4 sm:px-6 mt-24">
	<p class="eyebrow" style="color:var(--brand)">Stack two or three roles</p>
	<h2 class="text-3xl sm:text-4xl font-semibold mt-2 max-w-2xl">From SS3 candidate at 16 to Collab team lead at 22 — without rebuilding your reputation.</h2>
	<div class="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
		{#each ROLES as r}
			<div class="panel p-4 flex flex-col gap-2">
				<span style="color:var(--brand)"><Icon name={r.icon} size={20} /></span>
				<p class="font-semibold">{r.role}</p>
				<p class="text-xs muted">{r.who}</p>
				<p class="num text-sm font-semibold mt-auto">{r.range}<span class="muted font-normal text-xs"> / month*</span></p>
			</div>
		{/each}
	</div>
	<p class="text-xs muted mt-3">*Illustrative planning ranges, not guarantees. Actual income depends on demand, effort and quality. Under-18s earn Hive Credits (free subscription days), never cash.</p>
</section>

<!-- TRUST -->
<section class="max-w-[1240px] mx-auto px-4 sm:px-6 mt-24 grid lg:grid-cols-3 gap-4">
	{#each [
		{ t: 'Integrity first', d: 'We help people learn. We never sell completed assignments, projects, theses or exam answers. Requests for that are blocked; tutors who accept them are removed.', href: '/integrity', icon: 'shield-check' },
		{ t: 'Safe for under-18s', d: 'Guardian consent before any booking, guardians in every thread, recorded sessions kept 30 days, approved-for-minors badges and a staffed 24-hour report queue.', href: '/safety', icon: 'heart' },
		{ t: 'Your money, protected', d: 'Webhooks verified and re-checked with Flutterwave, idempotent ledger writes, payouts only to name-matched accounts, daily reconciliation.', href: '/security', icon: 'lock' }
	] as t}
		<a href={t.href} class="panel card-interactive p-6 flex flex-col gap-3">
			<span style="color:var(--good)"><Icon name={t.icon} size={24} /></span>
			<h3 class="text-xl font-semibold">{t.t}</h3>
			<p class="text-sm text-[var(--text-2)]">{t.d}</p>
		</a>
	{/each}
</section>

<!-- PRICING TEASER -->
<section class="max-w-[1240px] mx-auto px-4 sm:px-6 mt-24">
	<div class="flex flex-wrap items-end justify-between gap-4">
		<h2 class="text-3xl sm:text-4xl font-semibold">Student prices. Parent-friendly plans.</h2>
		<a href="/pricing" class="ctl">All plans & institution pricing<Icon name="arrow-right" size={16} /></a>
	</div>
	<div class="mt-8 grid md:grid-cols-3 gap-4">
		{#each PLANS.filter((p) => ['free', 'plus_month', 'exam_pass'].includes(p.id)) as p}
			<div class="panel p-6 flex flex-col gap-3 {'featured' in p ? 'ring-1' : ''}" style={'featured' in p ? 'box-shadow:inset 0 1px 0 var(--edge-top),var(--shadow-lift),var(--brand-glow);border-color:var(--brand)' : ''}>
				<div class="flex items-center justify-between"><h3 class="text-lg font-semibold">{p.name}</h3>{#if 'featured' in p}<span class="badge badge-brand">Most popular</span>{/if}</div>
				<p class="num text-3xl font-semibold">{p.priceKobo ? naira(p.priceKobo) : 'Free'}<span class="text-sm muted font-normal"> / {p.period}</span></p>
				<ul class="text-sm grid gap-1.5">{#each p.features as f}<li class="flex gap-2"><Icon name="check" size={15} class="text-[var(--good)] mt-0.5" />{f}</li>{/each}</ul>
				<a href="/pricing" class="ctl mt-auto {'featured' in p ? 'ctl-primary' : ''}">{p.cta}</a>
			</div>
		{/each}
	</div>
</section>

<LandingExtras />

<!-- CTA -->
<section class="max-w-[1240px] mx-auto px-4 sm:px-6 mt-24">
	<div class="panel p-8 sm:p-12 text-center flex flex-col items-center gap-4 relative overflow-hidden" style="background:linear-gradient(160deg,color-mix(in oklab,var(--color-navy-800) 92%,black),var(--color-navy-900));color:#f8fafc;border-color:rgba(255,255,255,.08)">
		<HexMark size={56} />
		<h2 class="text-3xl sm:text-4xl font-semibold max-w-2xl">Your next exam is a practice session away. Your first income is a session after that.</h2>
		<div class="flex flex-wrap gap-3 justify-center mt-2">
			<a href="/signup" class="ctl ctl-primary !h-12 !px-6">Create your Hive ID</a>
			<a href="/explore" class="ctl !h-12 !px-6" style="background:rgba(255,255,255,.08);color:#fff;border-color:rgba(255,255,255,.18)">Explore the hub</a>
		</div>
	</div>
</section>
