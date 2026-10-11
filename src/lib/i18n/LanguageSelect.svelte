<script lang="ts">
 import {onMount} from 'svelte';import {transactionLocales} from './transactions';
 let {locale=$bindable('en')}:{locale?:string}=$props();
 const names:Record<string,string>={en:'English',ha:'Hausa',ig:'Igbo',yo:'Yorùbá',fr:'Français',ar:'العربية',pt:'Português',sw:'Kiswahili'};
 onMount(()=>{const saved=document.cookie.split('; ').find(x=>x.startsWith('sx_locale='))?.split('=')[1];if(saved&&transactionLocales.some(x=>x===saved))locale=saved;});
 function save(){document.cookie=`sx_locale=${locale}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol==='https:'?'; Secure':''}`;}
</script>
<label class="block text-sm mb-3">Language <select class="ctl" bind:value={locale} onchange={save}>{#each transactionLocales as value}<option value={value}>{names[value]}</option>{/each}</select></label>
