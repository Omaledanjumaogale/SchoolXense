<script lang="ts">
	import { ui } from './ui.svelte';
	import { ROLE_HOME } from './nav';
	import { hive } from '$hive/store.svelte';
	import Icon from './Icon.svelte';
	import HexMark from './HexMark.svelte';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	const auth = useAuth();
	const profile = useQuery(api.portal.profile, () => auth.isAuthenticated ? {} : 'skip');
	let open = $state(false);
	const LEARN = [
		{ href: '/secondary', label: 'Hive Secondary', sub: 'JAMB · WAEC · NECO · NABTEB', glyph: 'pencil' },
		{ href: '/campus', label: 'Hive Campus', sub: '100+ universities & polytechnics', glyph: 'pillar' },
		{ href: '/pro', label: 'Hive Pro', sub: 'ICAN · JUPEB · IELTS', glyph: 'flame' },
		{ href: '/tutors', label: 'Hive Tutors', sub: 'Verified, escrow-protected help', glyph: 'users' },
		{ href: '/cohorts', label: 'Hive Cohorts', sub: 'Exam-season groups', glyph: 'calendar' },
		{ href: '/library', label: 'Hive Library', sub: 'Original study packs', glyph: 'book' }
	];
	const EARN = [
		{ href: '/tutors', label: 'Tutor & coach', sub: 'Earn 80% of every session', glyph: 'users' },
		{ href: '/studio-program', label: 'Hive Studio', sub: 'Write, review, translate questions', glyph: 'pen' },
		{ href: '/collab', label: 'Hive Collab', sub: 'Teams, contracts & micro-tasks', glyph: 'handoff' },
		{ href: '/skills', label: 'Hive Skills', sub: 'Farm mentors & skills tutors', glyph: 'leaf' },
		{ href: '/ambassadors', label: 'Ambassadors', sub: 'Grow your campus, earn commission', glyph: 'megaphone' },
		{ href: '/record-info', label: 'Hive Record', sub: 'A verified profile for employers', glyph: 'badge' }
	];
	let menu = $state<'learn' | 'earn' | null>(null);
	const me = $derived(profile.data);
</script>

<header class="sticky top-0 z-40" style="background:color-mix(in oklab,var(--bg) 75%,transparent);backdrop-filter:blur(14px);border-bottom:1px solid var(--line)">
	<div class="max-w-[1240px] mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
		<a href="/" class="flex items-center gap-2.5" aria-label="SchoolXense home"><HexMark size={34} /><span class="display text-xl font-semibold tracking-tight">SchoolXense</span></a>
		<nav class="hidden lg:flex items-center gap-1 ml-4 text-sm font-medium" aria-label="Site">
			{#each [{ id: 'learn', label: 'Learn', items: LEARN }, { id: 'earn', label: 'Earn', items: EARN }] as { id, label, items }}
				<div class="relative" role="presentation" onmouseenter={() => (menu = id as 'learn' | 'earn')} onmouseleave={() => (menu = null)}>
					<button class="ctl ctl-sm ctl-ghost" aria-expanded={menu === id} onclick={() => (menu = menu === id ? null : (id as 'learn' | 'earn'))}>{label}<Icon name="chevron-down" size={14} /></button>
					{#if menu === id}
						<div class="absolute left-0 top-full pt-2 z-50">
							<div class="panel rise p-2 w-[34rem] grid grid-cols-2 gap-1" style="background:var(--surface-solid)">
								{#each items as it}
									<a href={it.href} class="flex gap-3 p-3 rounded-lg hover:bg-[var(--surface-sunk)] transition-transform hover:-translate-y-px" onclick={() => (menu = null)}>
										<HexMark size={30} glyph={it.glyph} color={id === 'learn' ? 'var(--color-navy-800)' : 'var(--brand)'} />
										<span><span class="block font-semibold">{it.label}</span><span class="block text-xs muted">{it.sub}</span></span>
									</a>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/each}
			<a href="/for-schools" class="ctl ctl-sm ctl-ghost">For schools</a>
			<a href="/pricing" class="ctl ctl-sm ctl-ghost">Pricing</a>
			<a href="/explore" class="ctl ctl-sm ctl-ghost">Explore hub</a>
		</nav>
		<div class="ml-auto flex items-center gap-2">
			<button class="ctl ctl-sm ctl-icon" onclick={() => ui.toggleTheme()} aria-label="Toggle colour theme"><Icon name={ui.theme === 'dark' ? 'sun' : 'moon'} size={17} /></button>
			{#if me}
				{#if me.roles.includes('staff')}<a href="/ops" class="ctl ctl-sm"><Icon name="shield" size={15} /><span class="hidden sm:inline">Admin console</span></a>{/if}
				<a href="/home" class="ctl ctl-sm ctl-primary">Dashboard<Icon name="arrow-right" size={15} /></a>
			{:else}
				<a href="/login" class="ctl ctl-sm hidden sm:inline-flex">Sign in</a>
				<a href="/signup" class="ctl ctl-sm ctl-primary">Start free</a>
			{/if}
			<button class="ctl ctl-sm ctl-icon lg:hidden" onclick={() => (open = !open)} aria-label="Menu" aria-expanded={open}><Icon name={open ? 'x' : 'menu'} size={18} /></button>
		</div>
	</div>
	{#if open}
		<div class="lg:hidden px-4 pb-4 grid gap-1 rise">
			{#each [...LEARN, ...EARN] as it}<a href={it.href} class="nav-item" onclick={() => (open = false)}><Icon name={it.glyph} size={17} />{it.label}</a>{/each}
			<a href="/for-schools" class="nav-item" onclick={() => (open = false)}><Icon name="building" size={17} />For schools</a>
			<a href="/pricing" class="nav-item" onclick={() => (open = false)}><Icon name="card" size={17} />Pricing</a>
			<a href="/explore" class="nav-item" onclick={() => (open = false)}><Icon name="grid" size={17} />Explore hub</a>
		</div>
	{/if}
</header>
