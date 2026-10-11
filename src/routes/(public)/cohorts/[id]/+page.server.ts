import {ConvexHttpClient} from 'convex/browser';
import {error} from '@sveltejs/kit';
import {api} from '$convex/_generated/api';
import {CONVEX_URL} from '$lib/config';
import {buildMeta,SITE} from '$lib/seo';
import {buildPageGraph} from '$lib/schema/graph';
import {buildOrganizationSchema,buildMotherSchema,buildBreadcrumbSchema} from '$lib/schema/builders';
export const load=async({params}:{params:{id:string}})=>{
 const cohort=await new ConvexHttpClient(CONVEX_URL).query(api.portal.publicCohort,{id:params.id});
 if(!cohort)error(404,'Upcoming cohort not found');
 const path='/cohorts/'+cohort._id;
 return {cohort,seo:buildMeta(path,{title:cohort.title+' · SchoolXense cohort',description:cohort.description,graph:buildPageGraph([buildMotherSchema(),buildOrganizationSchema(),buildBreadcrumbSchema(path),{'@type':'Course',name:cohort.title,description:cohort.description,url:SITE+path,provider:{'@id':SITE+'/#organization'},hasCourseInstance:{'@type':'CourseInstance',courseMode:'online',startDate:new Date(cohort.startsAt).toISOString(),instructor:{'@type':'Person',name:cohort.hostName}}}])})};
};
