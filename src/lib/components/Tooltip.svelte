<script lang="ts">let {text}:{text:string}=$props();</script>
<span class="relative inline-flex group"><button type="button" class="rounded-full border px-2 text-xs" aria-label={text}>i</button><span role="tooltip" class="absolute z-50 bottom-full right-0 mb-2 w-64 panel p-3 text-sm invisible group-hover:visible group-focus-within:visible">{text}</span></span>
