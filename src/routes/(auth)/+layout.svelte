<script lang="ts">
	import HexMark from '$ui/HexMark.svelte';
	import Icon from '$ui/Icon.svelte';
	import { ui } from '$ui/ui.svelte';
	let { children } = $props();
</script>

<div class="min-h-dvh grid lg:grid-cols-[1fr_1.05fr]">
	<aside class="hidden lg:flex flex-col justify-between p-10 relative overflow-hidden" style="background:linear-gradient(160deg,#0b1220,#13213d 60%,#1e3a8a);color:#f1f5f9">
		<div class="decor absolute inset-0 opacity-[.12]" style="background-image:url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='34' height='59'%3E%3Cpath d='M17 0 34 9.8v19.6L17 39.3 0 29.4V9.8zM17 39.3v19.6' fill='none' stroke='%23F5C542' stroke-width='1'/%3E%3C/svg%3E&quot;)"></div>
		<a href="/" class="relative flex items-center gap-2.5"><HexMark size={38} /><span class="display text-2xl font-semibold">SchoolXense</span></a>
		<div class="relative max-w-md">
			<p class="display text-4xl leading-tight font-semibold">Learn out loud.<br /><span style="color:#F5C542">Earn from what you've mastered.</span></p>
			<ul class="mt-8 grid gap-3 text-sm text-slate-300">
				<li class="flex gap-3"><Icon name="target" size={18} class="text-amber-300" />Adaptive drills find your weak topics in 20 questions.</li>
				<li class="flex gap-3"><Icon name="lock" size={18} class="text-amber-300" />Every booking is escrow-protected for 48 hours.</li>
				<li class="flex gap-3"><Icon name="shield-check" size={18} class="text-amber-300" />Guardians approve under-18 bookings. Integrity-first, always.</li>
				<li class="flex gap-3"><Icon name="coins" size={18} class="text-amber-300" />One wallet across tutoring, Studio, cohorts and teams.</li>
			</ul>
		</div>
		<p class="relative text-xs text-slate-400">Earnings are illustrative, not guarantees.</p>
	</aside>
	<div class="flex flex-col">
		<div class="flex justify-between items-center p-4"><a href="/" class="lg:hidden flex items-center gap-2"><HexMark size={30} /><span class="display font-semibold text-lg">SchoolXense</span></a><button class="ctl ctl-sm ctl-icon ml-auto" onclick={() => ui.toggleTheme()} aria-label="Toggle theme"><Icon name={ui.theme === 'dark' ? 'sun' : 'moon'} size={17} /></button></div>
		<main id="main" class="flex-1 grid place-items-center px-4 pb-10">{@render children()}</main>
	</div>
</div>
