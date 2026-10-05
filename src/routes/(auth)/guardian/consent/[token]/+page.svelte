<script lang="ts">
	import { goto } from '$app/navigation';
	import { hive } from '$hive/store.svelte';
	import Icon from '$ui/Icon.svelte';
	// In production the token is a signed, single-use link sent to the guardian by SMS/email.
	function open() { hive.loginAs('u_ngozi', 'guardian'); goto('/family'); }
</script>

<div class="panel p-6 max-w-md rise flex flex-col gap-3">
	<span class="grid place-items-center w-12 h-12 rounded-xl" style="background:var(--info-soft);color:var(--info)"><Icon name="shield-check" size={24} /></span>
	<h1 class="text-2xl font-semibold">Guardian consent</h1>
	<p class="muted text-sm">A learner under 18 has asked to link their SchoolXense account to you. As their guardian you approve bookings over your spending limit, see their progress and session recordings, and are included in every message thread.</p>
	<button class="ctl ctl-primary" onclick={open}>Review request<Icon name="arrow-right" size={16} /></button>
</div>
