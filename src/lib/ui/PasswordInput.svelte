<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	let { id, value = $bindable(''), label = 'password', autocomplete = 'current-password', inputmode, required = false,pattern,maxlength,minlength }: {
		id: string; value?: string; label?: string; autocomplete?: HTMLInputAttributes['autocomplete']; inputmode?: 'numeric' | 'text'; required?: boolean;pattern?:string;maxlength?:number;minlength?:number;
	} = $props();
	let visible = $state(false);
</script>

<div class="relative">
	<input {id} class="field !pr-12" type={visible ? 'text' : 'password'} bind:value {autocomplete} {inputmode} {required} {pattern} {maxlength} {minlength}/>
	<button type="button" class="absolute right-1 top-1/2 -translate-y-1/2 ctl ctl-sm ctl-icon" aria-label={`${visible ? 'Hide' : 'Show'} ${label}`} aria-controls={id} aria-pressed={visible} onclick={() => (visible = !visible)}>
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
			<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
			<circle cx="12" cy="12" r="3" />
			{#if visible}<path d="m3 3 18 18" />{/if}
		</svg>
	</button>
</div>
