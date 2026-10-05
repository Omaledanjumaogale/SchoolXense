<script lang="ts">
 import LiveShell from "$lib/live/LiveShell.svelte";
 let { children } = $props();
</script>
<LiveShell>{@render children()}</LiveShell>
