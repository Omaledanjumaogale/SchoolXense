<script lang="ts">
 import { onMount } from 'svelte';
 type InstallPrompt=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
 let prompt=$state<InstallPrompt|null>(null),ios=$state(false),help=$state(false),installed=$state(false);
 onMount(()=>{installed=matchMedia('(display-mode: standalone)').matches;ios=/iPhone|iPad|iPod/.test(navigator.userAgent);const capture=(event:Event)=>{event.preventDefault();prompt=event as InstallPrompt;};const complete=()=>{installed=true;prompt=null;};window.addEventListener('beforeinstallprompt',capture);window.addEventListener('appinstalled',complete);return()=>{window.removeEventListener('beforeinstallprompt',capture);window.removeEventListener('appinstalled',complete);};});
 async function install(){if(prompt){await prompt.prompt();await prompt.userChoice;prompt=null;}else help=!help;}
</script>
{#if !installed&&(prompt||ios)}<button class="ctl ctl-sm" onclick={install}>Install app</button>{/if}
{#if help}<aside class="fixed bottom-5 left-4 right-4 sm:left-auto sm:w-80 panel p-5 z-50 shadow-xl" aria-label="App installation instructions"><button class="ctl ctl-sm float-right" onclick={()=>help=false}>Close</button><h2 class="font-semibold">Add SchoolXense to your home screen</h2><p class="muted text-sm mt-3">In Safari, tap Share, then Add to Home Screen. Live learning needs an internet connection.</p></aside>{/if}
