<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { hive } from '$hive/store.svelte';
	import { ui } from './ui.svelte';
	import { sideNav, BOTTOM, ROLE_LABEL } from './nav';
	import Icon from './Icon.svelte';
	import HexMark from './HexMark.svelte';
	import Avatar from './Avatar.svelte';
	import RoleSwitcher from './RoleSwitcher.svelte';
	import NotificationBell from './NotificationBell.svelte';
	import { firstName } from './format';
	let { children }: { children: Snippet } = $props();
	const me = $derived(hive.me!);
	const role = $derived(hive.role ?? me.roles[0]);
	const tenantId = $derived(me.tenantIds[0]);
	const groups = $derived(sideNav(me.roles, role, tenantId));
	const tabs = $derived(BOTTOM[role].map((t) => (role === 'instadmin' && tenantId ? { ...t, href: t.href.replace('greenfield', tenantId) } : t)));
	const path = $derived(page.url.pathname);
	const isActive = (href: string, match?: string) => (match ? new RegExp(`^(${match})`).test(path) : path === href || (href !== '/' && path.startsWith(href + '/')));
	const moduleAttr = $derived(path.startsWith('/studio') ? 'studio' : /^\/(teams|contracts|tasks|threads)/.test(path) ? 'collab' : path.startsWith('/skills') ? 'skills' : path.startsWith('/inst') ? 'institutions' : path.startsWith('/ops') ? 'ops' : path.startsWith('/practice/campus') ? 'campus' : /^\/practice\/(ican|ielts|jupeb)/.test(path) ? 'pro' : /^\/(book|sessions|requests|offers|cohorts|library|packs)/.test(path) ? 'tutors' : 'secondary');
	let userMenu = $state(false);
	function logout() { hive.logout(); goto('/'); }
</script>

<div class="min-h-dvh lg:grid lg:grid-cols-[17rem_1fr]" data-module={moduleAttr}>
	<!-- Side navigation (desktop) -->
	<aside class="hidden lg:flex flex-col gap-4 sticky top-0 h-dvh p-4 overflow-y-auto" style="border-right:1px solid var(--line);background:color-mix(in oklab,var(--surface) 55%,transparent);backdrop-filter:blur(12px)">
		<a href="/explore" class="flex items-center gap-2.5 px-1.5 py-1"><HexMark size={34} /><span class="display text-xl font-semibold tracking-tight">SchoolXense</span></a>
		<RoleSwitcher />
		<button class="ctl ctl-sm justify-between w-full text-[var(--muted)] font-medium" onclick={() => (ui.paletteOpen = true)}><span class="flex items-center gap-2"><Icon name="search" size={15} />Search</span><kbd class="badge num !text-[10px]">⌘K</kbd></button>
		<nav class="flex flex-col gap-5 mt-1" aria-label="Main">
			{#each groups as g (g.label)}
				<div>
					<p class="eyebrow px-3 mb-1.5">{g.label}</p>
					<ul class="flex flex-col gap-0.5">
						{#each g.items as it (it.href)}
							<li><a href={it.href} class="nav-item" aria-current={isActive(it.href, it.match) ? 'page' : undefined}><Icon name={it.icon} size={18} />{it.label}</a></li>
						{/each}
					</ul>
				</div>
			{/each}
			<div>
				<p class="eyebrow px-3 mb-1.5">Hub</p>
				<a href="/explore" class="nav-item"><Icon name="grid" size={18} />All 12 modules</a>
			</div>
		</nav>
		<div class="mt-auto flex flex-col gap-2 pt-3" style="border-top:1px solid var(--line)">
			<div class="flex gap-1.5">
				<button class="ctl ctl-sm flex-1" onclick={() => ui.toggleTheme()} aria-label="Toggle theme"><Icon name={ui.theme === 'dark' ? 'sun' : 'moon'} size={15} />{ui.theme === 'dark' ? 'Light' : 'Dark'}</button>
				<button class="ctl ctl-sm flex-1" onclick={() => ui.toggleSaver()} data-pressed={ui.saver} aria-pressed={ui.saver} title="Data saver hides images and lowers video to audio"><Icon name="signal" size={15} />Saver {ui.saver ? 'on' : 'off'}</button>
			</div>
		</div>
	</aside>

	<div class="min-w-0 flex flex-col">
		<!-- Top bar -->
		<header class="sticky top-0 z-30 flex items-center gap-2 px-3 sm:px-5 h-16" style="background:color-mix(in oklab,var(--bg) 78%,transparent);backdrop-filter:blur(14px);border-bottom:1px solid var(--line)">
			<a href="/explore" class="lg:hidden flex items-center gap-2"><HexMark size={30} /><span class="display font-semibold text-lg">SchoolXense</span></a>
			<div class="hidden lg:flex items-center gap-2 text-sm muted"><span class="badge badge-accent">{ROLE_LABEL[role]}</span>{#if me.isMinor}<span class="badge badge-info"><Icon name="shield" size={12} />Guardian-linked</span>{/if}{#if !ui.online}<span class="badge badge-warn"><Icon name="wifi-off" size={12} />Offline — answers will sync</span>{/if}</div>
			<div class="ml-auto flex items-center gap-2">
				<button class="ctl ctl-sm ctl-icon lg:hidden" onclick={() => (ui.paletteOpen = true)} aria-label="Search"><Icon name="search" size={18} /></button>
				<NotificationBell />
				<div class="relative">
					<button class="ctl ctl-sm !pl-1 !pr-2.5" onclick={() => (userMenu = !userMenu)} aria-label="Account menu" data-pressed={userMenu}><Avatar name={me.name} hue={me.hue} size={28} /><span class="hidden sm:inline max-w-32 truncate">{firstName(me.name)}</span><Icon name="chevron-down" size={14} /></button>
					{#if userMenu}
						<button class="fixed inset-0 z-40 cursor-default" aria-label="Close menu" onclick={() => (userMenu = false)}></button>
						<div class="panel rise absolute right-0 mt-2 w-64 z-50 p-2" style="background:var(--surface-solid)">
							<div class="px-3 py-2"><p class="font-semibold">{me.name}</p><p class="text-xs muted truncate">{me.email}</p></div>
							<div class="lg:hidden px-1 pb-2"><RoleSwitcher /></div>
							<a href="/settings" class="nav-item" onclick={() => (userMenu = false)}><Icon name="settings" size={16} />Settings & privacy</a>
							<a href="/record" class="nav-item" onclick={() => (userMenu = false)}><Icon name="badge" size={16} />Hive Record</a>
							<button class="nav-item w-full lg:hidden" onclick={() => ui.toggleTheme()}><Icon name={ui.theme === 'dark' ? 'sun' : 'moon'} size={16} />{ui.theme === 'dark' ? 'Light' : 'Dark'} mode</button>
							<a href="/login" class="nav-item" onclick={() => (userMenu = false)}><Icon name="users" size={16} />Switch demo persona</a>
							<button class="nav-item w-full" onclick={logout}><Icon name="logout" size={16} />Sign out</button>
						</div>
					{/if}
				</div>
			</div>
		</header>

		<main id="main" class="flex-1 w-full max-w-[1240px] mx-auto px-3 sm:px-6 py-6 pb-28 lg:pb-10">
			{@render children()}
		</main>
	</div>

	<!-- Bottom navigation (mobile) -->
	<nav class="lg:hidden fixed bottom-0 inset-x-0 z-30 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2" style="background:color-mix(in oklab,var(--surface-solid) 88%,transparent);backdrop-filter:blur(14px);border-top:1px solid var(--line)" aria-label="Primary">
		<ul class="grid grid-cols-5 gap-1">
			{#each tabs as t (t.href)}
				{@const on = isActive(t.href, t.match)}
				<li>
					<a href={t.href} class="flex flex-col items-center gap-0.5 py-1.5 rounded-xl text-[11px] font-semibold transition-transform active:translate-y-px {on ? 'panel' : 'muted'}" style={on ? 'color:var(--brand)' : ''} aria-current={on ? 'page' : undefined}>
						<Icon name={t.icon} size={21} stroke={on ? 2.1 : 1.75} />{t.label}
					</a>
				</li>
			{/each}
		</ul>
	</nav>
</div>
