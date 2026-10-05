<script lang="ts">
 import { nigeria, states } from '$lib/data/nigeria';
 import PasswordInput from '$ui/PasswordInput.svelte';
 let { state=$bindable(''),lga=$bindable(''),whatsapp=$bindable(''),nin=$bindable(''),prefix='residence',required=true }: {state?:string;lga?:string;whatsapp?:string;nin?:string;prefix?:string;required?:boolean}=$props();
</script>
<div class="grid sm:grid-cols-2 gap-4">
 <div><label class="label" for={`${prefix}-state`}>State of residence</label><select id={`${prefix}-state`} class="field" bind:value={state} onchange={()=>lga=''} {required}><option value="">Select state or FCT</option>{#each states as item}<option value={item}>{item}</option>{/each}</select></div>
 <div><label class="label" for={`${prefix}-lga`}>LGA of residence</label><select id={`${prefix}-lga`} class="field" bind:value={lga} disabled={!state} {required}><option value="">Select LGA</option>{#each nigeria[state]??[] as item}<option value={item}>{item}</option>{/each}</select></div>
 <div><label class="label" for={`${prefix}-whatsapp`}>WhatsApp contact</label><input id={`${prefix}-whatsapp`} class="field" type="tel" autocomplete="tel" bind:value={whatsapp} placeholder="+2348012345678" maxlength="20" {required}/></div>
 <div><label class="label" for={`${prefix}-nin`}>NIN {required?'':'(leave blank to keep existing)'}</label><PasswordInput id={`${prefix}-nin`} label="NIN" inputmode="numeric" autocomplete="off" bind:value={nin} pattern={'[0-9]{11}'} maxlength={11} {required}/></div>
</div>
<p class="text-xs muted">Your NIN is encrypted for identity review. Enter 11 digits. Providing it does not automatically verify your identity.</p>
