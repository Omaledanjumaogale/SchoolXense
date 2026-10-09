<script lang="ts">let {name,role,url}:{name:string;role:string;url:string}=$props();</script>
<aside class="panel p-5" aria-label="Author"><a class="link font-semibold" href={url}>{name}</a><p class="muted mt-1">{role}</p></aside>
