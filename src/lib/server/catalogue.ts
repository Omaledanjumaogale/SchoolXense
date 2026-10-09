import {ConvexHttpClient} from 'convex/browser';
import {api} from '$convex/_generated/api';
import {CONVEX_URL} from '$lib/config';
export async function publicCatalogue(kind:'packs'|'offers'|'cohorts'){
 const client=new ConvexHttpClient(CONVEX_URL);
 return client.query(api.portal.catalogue,{kind});
}
