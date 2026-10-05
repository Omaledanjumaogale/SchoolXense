<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import PasswordInput from '$ui/PasswordInput.svelte';
	import Icon from '$ui/Icon.svelte';
	import ResidenceFields from './ResidenceFields.svelte';
	let residenceState=$state(''),lga=$state(''),whatsapp=$state(''),nin=$state('');
	let { mode = 'login' }: { mode?: 'login' | 'signup' | 'admin' | 'forgot' | 'reset' } = $props();
	let email = $state(''), password = $state(''), name = $state('');
	let busy = $state(false), error = $state(''), notice = $state('');
	const heading = $derived(mode === 'signup' ? 'Create your SchoolXense account' : mode === 'admin' ? 'Administrator sign in' : mode === 'forgot' ? 'Recover your account' : mode === 'reset' ? 'Set a new password' : 'Welcome back');
	const next = $derived(page.url.searchParams.get('next') || '/home');
	function safeNext() { return next.startsWith('/') && !next.startsWith('//') && !next.includes('\\') ? next : '/home'; }
	async function submit(event: SubmitEvent) {
		event.preventDefault(); busy = true; error = ''; notice = '';
		try {
			if (mode === 'signup') {
				const response=await fetch('/api/registration',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email,password,state:residenceState,lga,whatsapp,nin,ref:page.url.searchParams.get('ref')??undefined})});
				const result=await response.json();if(!response.ok)throw new Error(result.message??'Account creation failed.');
				password='';nin='';notice=result.notice;
			} else if (mode === 'forgot') {
				const result = await authClient.requestPasswordReset({ email, redirectTo: `${location.origin}/reset-password` });
				if (result.error) throw new Error(result.error.message ?? 'Recovery request failed.');
				notice = 'If this address has an account, a recovery email will arrive shortly.';
			} else if (mode === 'reset') {
				const token = page.url.searchParams.get('token');
				if (!token) throw new Error('This reset link is incomplete. Request a new link.');
				const result = await authClient.resetPassword({ newPassword: password, token });
				if (result.error) throw new Error(result.error.message ?? 'This link has expired. Request a new one.');
				password = ''; notice = 'Password updated. Sign in with your new password.';
			} else {
				const result = await authClient.signIn.email({ email, password });
				if (result.error) throw new Error(result.error.message ?? 'Sign in failed.');
				await goto(`/welcome?next=${encodeURIComponent(mode === 'admin' ? '/ops?activate=1' : safeNext())}&ref=${encodeURIComponent(page.url.searchParams.get('ref')??'')}`);
			}
		} catch (e) { error = e instanceof Error ? e.message : 'Unable to complete your request. Please try again.'; }
		finally { busy = false; }
	}
	async function social(provider: 'google' | 'github') {
		busy = true; error = '';
		try { const result = await authClient.signIn.social({ provider, callbackURL: `${location.origin}/welcome?next=${encodeURIComponent(mode === 'admin' ? '/ops?activate=1' : safeNext())}&ref=${encodeURIComponent(page.url.searchParams.get('ref')??'')}` }); if (result.error) throw new Error(result.error.message); }
		catch (e) { error = e instanceof Error ? e.message : 'Provider sign in failed.'; busy = false; }
	}
	async function resend() {
		busy = true; error = '';
		try { const result = await authClient.sendVerificationEmail({ email, callbackURL: `${location.origin}/login?verified=1` }); if (result.error) throw new Error(result.error.message); notice = 'If verification is needed, check your inbox for a new link.'; }
		catch (e) { error = e instanceof Error ? e.message : 'Unable to resend verification.'; }
		finally { busy = false; }
	}
</script>

<svelte:head><title>{heading} · SchoolXense</title><meta name="robots" content="noindex,nofollow" /></svelte:head>
<div class="w-full max-w-lg rise">
	<p class="eyebrow">{mode === 'admin' ? 'Restricted administration' : 'One account for your learning journey'}</p>
	<h1 class="text-3xl font-semibold mt-2">{heading}</h1>
	<p class="muted mt-2">{mode === 'admin' ? 'Use your verified owner account. Administration is activated after secure sign in.' : 'Learn, collaborate and manage your progress in one place.'}</p>
	<form class="panel p-5 sm:p-7 mt-6 grid gap-4" onsubmit={submit}>
		{#if error}<p class="panel-sunk p-3 text-sm" role="alert" style="color:var(--bad)">{error}</p>{/if}
		{#if notice}<p class="panel-sunk p-3 text-sm" role="status" style="color:var(--good)">{notice}</p>{/if}
		{#if page.url.searchParams.get('verified') === '1'}<p class="text-sm" role="status">Email verified. You can now sign in.</p>{/if}
		{#if mode === 'signup'}<div><label class="label" for="auth-name">Full name</label><input id="auth-name" class="field" bind:value={name} autocomplete="name" minlength="2" maxlength="100" required /></div>{/if}
		{#if mode !== 'reset'}<div><label class="label" for="auth-email">Email address</label><input id="auth-email" class="field" type="email" bind:value={email} autocomplete="email" maxlength="254" required /></div>{/if}
		{#if mode !== 'forgot'}<div><label class="label" for="auth-password">{mode === 'reset' ? 'New password' : 'Password'}</label><PasswordInput id="auth-password" bind:value={password} autocomplete={mode === 'signup' || mode === 'reset' ? 'new-password' : 'current-password'} required /><p class="text-xs muted mt-1">{mode === 'signup' || mode === 'reset' ? 'Use at least 12 characters.' : 'Your password is kept private.'}</p></div>{/if}
		{#if mode === 'signup'}<ResidenceFields bind:state={residenceState} bind:lga bind:whatsapp bind:nin prefix="signup"/><label class="flex gap-2 text-xs muted"><input type="checkbox" required /> <span>I agree to the <a class="link" href="/terms">Terms</a> and <a class="link" href="/privacy">Privacy notice</a>.</span></label>{/if}
		<button class="ctl ctl-primary !h-12" disabled={busy}>{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Send recovery link' : mode === 'reset' ? 'Update password' : 'Sign in'}<Icon name="arrow-right" size={16} /></button>
		{#if ['login', 'signup', 'admin'].includes(mode)}
			<div class="divider"></div>
			<div class="grid sm:grid-cols-2 gap-2"><button type="button" class="ctl" disabled={busy} onclick={() => social('google')}><Icon name="globe" size={16} />Google</button><button type="button" class="ctl" disabled={busy} onclick={() => social('github')}><Icon name="code" size={16} />GitHub</button></div>
			<button type="button" class="link text-sm" disabled={busy || !email} onclick={resend}>Resend verification email</button>
		{/if}
	</form>
	<p class="text-sm muted mt-5"><a href={'/login?ref='+encodeURIComponent(page.url.searchParams.get('ref')??'')} class="link">Sign in</a> · <a href="/signup" class="link">Create account</a> · <a href="/forgot-password" class="link">Forgot password?</a></p>
</div>
