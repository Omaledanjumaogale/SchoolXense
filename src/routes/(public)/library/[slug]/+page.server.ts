import {ConvexHttpClient} from 'convex/browser';
import {error} from '@sveltejs/kit';
import {api} from '$convex/_generated/api';
import {CONVEX_URL,DEMO_MODE} from '$lib/config';
import {buildMeta,SITE} from '$lib/seo';
import {buildPageGraph} from '$lib/schema/graph';
import {buildOrganizationSchema,buildMotherSchema,buildWebSiteSchema,buildBreadcrumbSchema} from '$lib/schema/builders';
export const load=async({params}:{params:{slug:string}})=>{
 if(DEMO_MODE)return {};
 const pack=await new ConvexHttpClient(CONVEX_URL).query(api.portal.publicPack,{slug:params.slug});
 if(!pack)error(404,'Published resource not found');
 const path='/library/'+encodeURIComponent(params.slug);
 return {publicPack:pack,seo:buildMeta(path,{title:pack.title+' · SchoolXense Library',description:`${pack.subject} ${pack.exam} study resource by ${pack.authorName}. ${pack.pages} pages.`,graph:buildPageGraph([buildMotherSchema(),buildOrganizationSchema(),buildWebSiteSchema(),buildBreadcrumbSchema(path),{'@type':'CreativeWork',name:pack.title,url:SITE+path,description:pack.preview.join(' '),author:{'@type':'Person',name:pack.authorName},publisher:{'@id':SITE+'/#organization'},inLanguage:'en-NG',mainEntityOfPage:SITE+path}])})};
};
