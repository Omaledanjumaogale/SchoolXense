<script lang="ts">
 import { nigeria, states } from '$lib/data/nigeria';
 import {accountText} from '$lib/i18n/account';
 import PasswordInput from '$ui/PasswordInput.svelte';
 let { state=$bindable(''),lga=$bindable(''),whatsapp=$bindable(''),nin=$bindable(''),prefix='residence',required=true,locale='en' }: {state?:string;lga?:string;whatsapp?:string;nin?:string;prefix?:string;required?:boolean;locale?:string}=$props();
const text=$derived(accountText(locale));
</script>
<div class="grid sm:grid-cols-2 gap-4">
 <div><label class="label" for={`${prefix}-state`}>{text.state}</label><select id={`${prefix}-state`} class="field" bind:value={state} onchange={()=>lga=''} {required}><option value="">{text.selectState}</option>{#each states as item}<option value={item}>{item}</option>{/each}</select></div>
 <div><label class="label" for={`${prefix}-lga`}>{text.lga}</label><select id={`${prefix}-lga`} class="field" bind:value={lga} disabled={!state} {required}><option value="">{text.selectLga}</option>{#each nigeria[state]??[] as item}<option value={item}>{item}</option>{/each}</select></div>
 <div><label class="label" for={`${prefix}-whatsapp`}>{text.whatsapp}</label><input id={`${prefix}-whatsapp`} class="field" type="tel" autocomplete="tel" bind:value={whatsapp} placeholder="+2348012345678" maxlength="20" {required}/></div>
 <div><label class="label" for={`${prefix}-nin`}>NIN {required?'':'(leave blank to keep existing)'}</label><PasswordInput id={`${prefix}-nin`} label="NIN" inputmode="numeric" autocomplete="off" bind:value={nin} pattern={'[0-9]{11}'} maxlength={11} {required}/></div>
</div>
<p class="text-xs muted">{text.ninNotice}</p>
