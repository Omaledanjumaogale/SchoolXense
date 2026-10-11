import {ConvexHttpClient} from 'convex/browser';
import {error} from '@sveltejs/kit';
import {api} from '$convex/_generated/api';
import {CONVEX_URL,DEMO_MODE} from '$lib/config';
import {buildMeta,SITE} from '$lib/seo';
import {buildPageGraph} from '$lib/schema/graph';
import {buildOrganizationSchema,buildMotherSchema,buildBreadcrumbSchema} from '$lib/schema/builders';
export const load=async({params}:{params:{slug:string}})=>{
 if(DEMO_MODE)return {};
 const tutor=await new ConvexHttpClient(CONVEX_URL).query(api.portal.publicTutor,{slug:params.slug});
 if(!tutor)error(404,'Published tutor not found');
 const path='/tutors/'+encodeURIComponent(params.slug);
 return {tutor,seo:buildMeta(path,{title:tutor.name+' · SchoolXense tutor',description:tutor.headline??'Explore published tutoring offers from '+tutor.name,graph:buildPageGraph([buildMotherSchema(),buildOrganizationSchema(),buildBreadcrumbSchema(path),{'@type':'ProfilePage',url:SITE+path,mainEntity:{'@type':'Person',name:tutor.name,description:tutor.bio,knowsLanguage:tutor.languages}}])})};
};
