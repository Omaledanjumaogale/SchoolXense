<script lang="ts">
 import {useQuery} from 'convex-svelte';import {useAuth} from '@mmailaender/convex-better-auth-svelte/svelte';import {api} from '$convex/_generated/api';import {ui} from '$ui/ui.svelte';
 const auth=useAuth(),workspace=useQuery(api.portal.workspace,()=>auth.isAuthenticated?{domain:'notifications'}:'skip');
 const seen=new Set<string>();let initialized=false;
 $effect(()=>{const rows=workspace.data&&'notifications' in workspace.data?workspace.data.notifications:[];if(!Array.isArray(rows))return;if(!initialized){for(const row of rows)seen.add(row._id);initialized=true;return;}for(const row of rows){if(!seen.has(row._id)&&!row.read){seen.add(row._id);ui.toast(row.title,'info',row.body);}}});
</script>
