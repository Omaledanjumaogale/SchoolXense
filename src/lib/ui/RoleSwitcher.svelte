<script lang="ts">
	import { goto } from '$app/navigation';
	import { hive } from '$hive/store.svelte';
	import { ROLE_LABEL, ROLE_HOME } from './nav';
	import type { Role } from '$hive/types';
	import Icon from './Icon.svelte';
	const me = $derived(hive.me);
	function pick(e: Event) {
		const r = (e.currentTarget as HTMLSelectElement).value as Role;
		hive.switchRole(r);
		goto(ROLE_HOME[r]);
	}
</script>

{#if me && me.roles.length > 1}
	<label class="ctl ctl-sm relative pr-8 cursor-pointer w-full justify-start">
		<Icon name="layers" size={15} />
		<span class="sr-only">Active role</span>
		<select class="absolute inset-0 opacity-0 cursor-pointer" value={hive.role} onchange={pick} aria-label="Switch role">
			{#each me.roles as r}<option value={r}>{ROLE_LABEL[r]}</option>{/each}
		</select>
		<span class="truncate">Role: {ROLE_LABEL[hive.role ?? me.roles[0]]}</span>
		<Icon name="chevron-down" size={14} class="absolute right-2.5" />
	</label>
{/if}
