<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import Icon from '$ui/Icon.svelte';
	import HexMark from '$ui/HexMark.svelte';
	import { ui } from '$ui/ui.svelte';
	let { children }: { children: Snippet } = $props();
	const auth = useAuth();
	const profile = useQuery(api.portal.profile, () => auth.isAuthenticated ? {} : 'skip');
	let open = $state(false);
	const nav = [
		{ label: 'Overview', href: '/home', icon: 'home' }, { label: 'Practice', href: '/practice', icon: 'target' }, { label: 'Study plan', href: '/plan', icon: 'calendar' },
		{ label: 'Find a tutor', href: '/book', icon: 'users' }, { label: 'Sessions', href: '/sessions', icon: 'video' }, { label: 'Wallet', href: '/wallet', icon: 'wallet' },
		{ label: 'Studio', href: '/studio', icon: 'pen' }, { label: 'Teams', href: '/teams', icon: 'handoff' }, { label: 'Contracts', href: '/contracts', icon: 'briefcase' },
		{ label: 'Tasks', href: '/tasks', icon: 'kanban' }, { label: 'Messages', href: '/threads', icon: 'message' }, { label: 'Family', href: '/family', icon: 'heart' },
		{ label: 'Certificates', href: '/certificates', icon: 'badge' }, { label: 'Settings', href: '/settings', icon: 'settings' }
	];
	$effect(() => { if (!auth.isLoading && !auth.isAuthenticated) goto(`/login?next=${encodeURIComponent(page.url.pathname + page.url.search)}`, { replaceState: true }); });
	$effect(() => { if (auth.isAuthenticated && !profile.isLoading && !profile.error && !profile.data) goto(`/welcome?next=${encodeURIComponent(page.url.pathname + page.url.search)}`, { replaceState: true }); });
	async function logout() { await authClient.signOut(); await goto('/'); }
</script>

{#if profile.data}
<div class="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
	<aside class="hidden lg:flex flex-col p-4 gap-5 sticky top-0 h-dvh overflow-y-auto" style="background:var(--surface);border-right:1px solid var(--line)">
		<a href="/" class="flex items-center gap-2"><HexMark size={34} /><span class="display text-xl font-semibold">SchoolXense</span></a>
		<p class="badge badge-good w-fit"><Icon name="shield-check" size={12} />Verified account</p>
		<nav aria-label="Workspace" class="grid gap-1">{#each nav as item}<a href={item.href} class="nav-item" aria-current={page.url.pathname === item.href ? 'page' : undefined}><Icon name={item.icon} size={18} />{item.label}</a>{/each}
		{#each profile.data.memberships as member}<a href={`/inst/${member.tenantId}/overview`} class="nav-item"><Icon name="building" size={18} />Institution</a>{/each}
		{#if profile.data.roles.includes('staff')}<a href="/ops" class="nav-item"><Icon name="shield" size={18} />Admin console</a>{/if}</nav>
		<a href="/explore" class="ctl ctl-sm mt-auto">Explore the hub<Icon name="arrow-right" size={16} /></a>
	</aside>
	<div class="min-w-0">
		<header class="sticky top-0 z-30 min-h-16 px-3 sm:px-6 flex items-center gap-2" style="background:var(--surface-solid);border-bottom:1px solid var(--line)">
			<button class="ctl ctl-icon lg:hidden" aria-label="Toggle workspace navigation" aria-expanded={open} onclick={() => open = !open}><Icon name={open ? 'x' : 'menu'} size={18} /></button>
			<a href="/" class="font-semibold lg:hidden">SchoolXense</a><span class="hidden sm:block text-sm muted">{profile.data.name}</span>
			<div class="ml-auto flex gap-2 items-center">
				{#if profile.data.roles.includes('staff')}<a href="/ops" class="ctl ctl-sm"><Icon name="shield" size={15} /><span class="hidden sm:inline">Admin console</span></a>{/if}
				<button class="ctl ctl-sm ctl-icon" aria-label="Toggle theme" onclick={() => ui.toggleTheme()}><Icon name={ui.theme === 'dark' ? 'sun' : 'moon'} size={16} /></button>
				<button class="ctl ctl-sm" onclick={logout}>Sign out</button>
			</div>
		</header>
		{#if open}<nav class="lg:hidden p-3 grid grid-cols-2 gap-1 panel" aria-label="Mobile workspace">{#each nav as item}<a class="nav-item" href={item.href} onclick={() => open = false}><Icon name={item.icon} size={16} />{item.label}</a>{/each}</nav>{/if}
		<main id="main" class="max-w-[1240px] mx-auto p-4 sm:p-6 pb-12">{@render children()}</main>
	</div>
</div>
{:else}
<main id="main" class="min-h-dvh grid place-items-center p-6"><div class="panel p-6 max-w-lg"><h1 class="font-semibold text-xl">{profile.error ? 'Unable to load your account' : 'Checking your session…'}</h1>{#if profile.error}<p class="muted mt-3">Please reconnect and try again. Your account data stays protected.</p><a href="/login" class="ctl mt-4">Return to sign in</a>{/if}</div></main>
{/if}
