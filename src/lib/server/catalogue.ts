import {ConvexHttpClient} from 'convex/browser';
import {api} from '$convex/_generated/api';
import {CONVEX_URL} from '$lib/config';
export async function publicCatalogue(kind:'packs'|'offers'|'cohorts'){
 const client=new ConvexHttpClient(CONVEX_URL);
 return client.query(api.portal.catalogue,{kind});
}
export async function discoveryPaths(){
 const client=new ConvexHttpClient(CONVEX_URL),paths=new Set<string>();
 for(const kind of ['packs','offers','cohorts'] as const){
  let cursor:string|null=null;
  do{const result:{page:{path:string}[];isDone:boolean;continueCursor:string}=await client.query(api.portal.discovery,{kind,paginationOpts:{numItems:100,cursor}});for(const record of result.page)paths.add(record.path);cursor=result.isDone?null:result.continueCursor;}while(cursor);
 }
 return [...paths];
}
