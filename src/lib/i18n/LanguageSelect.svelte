<script lang="ts">
 import {dashboardLocale} from './dashboard.svelte';
 import {onMount} from 'svelte';import {transactionLocales} from './transactions';
 let {locale=$bindable(dashboardLocale.value),compact=false}:{locale?:string;compact?:boolean}=$props();
 let ready=$state(false);
 const names:Record<string,string>={en:'English',ha:'Hausa',ig:'Igbo',yo:'Yorùbá',fr:'Français',ar:'العربية',pt:'Português',sw:'Kiswahili'};
 onMount(()=>{ready=true;const saved=document.cookie.split('; ').find(x=>x.startsWith('sx_locale='))?.split('=')[1];if(saved&&transactionLocales.some(x=>x===saved))locale=saved;dashboardLocale.value=locale;document.documentElement.lang=locale;});
 function save(){dashboardLocale.value=locale;document.documentElement.lang=locale;document.cookie=`sx_locale=${locale}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol==='https:'?'; Secure':''}`;}
</script>
<label class={compact?'text-xs':'block text-sm mb-3'}><span class={compact?'sr-only':''}>Language</span> <select aria-label="Language" disabled={!ready} class="ctl" style={compact?'max-width:7rem':undefined} bind:value={locale} onchange={save}>{#each transactionLocales as value}<option value={value}>{names[value]}</option>{/each}</select></label>
