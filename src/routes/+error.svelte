<script lang="ts">
	import { page } from '$app/state';
	import HexMark from '$ui/HexMark.svelte';
</script>

<div class="min-h-dvh grid place-items-center px-4">
	<div class="panel p-8 max-w-md text-center flex flex-col items-center gap-3">
		<HexMark size={56} />
		<p class="num text-5xl font-semibold mt-2">{page.status}</p>
		<h1 class="text-xl font-semibold">{page.status === 404 ? 'This cell of the hive is empty' : 'Something went wrong'}</h1>
		<p class="muted text-sm">{page.error?.message}</p>
		<div class="flex gap-2 mt-2"><a href="/" class="ctl ctl-primary">Go home</a><a href="/explore" class="ctl">Explore modules</a></div>
	</div>
</div>
