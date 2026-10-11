import type {LayoutServerLoad} from './$types';
import {buildMeta,privatePath,SITE} from '$lib/seo';
import {LANDINGS} from '$hive/landings';
import {GLOSSARY} from '$hive/catalogue';
import {buildOrganizationSchema,buildMotherSchema,buildWebSiteSchema,buildBreadcrumbSchema} from '$lib/schema/builders';
import {buildPageGraph} from '$lib/schema/graph';
export const load:LayoutServerLoad=({url})=>{
 const path=url.pathname,landing=LANDINGS[path.slice(1)],term=path.startsWith('/glossary/')?GLOSSARY[path.slice(10)]:undefined;
 const content=term?[{'@type':'DefinedTerm',name:term.term,description:term.def,url:SITE+path,inDefinedTermSet:SITE+'/glossary'}]:landing?[{'@type':'Service',name:landing.title,description:landing.lead,url:SITE+path,provider:{'@id':SITE+'/#organization'}}]:path==='/about'?[{'@type':'AboutPage',name:'About SchoolXense',url:SITE+path,about:{'@id':SITE+'/#organization'}}]:[];
 return {seo:buildMeta(path,{...(term?{title:term.term+' · SchoolXense glossary',description:term.def}:landing?{title:landing.title+' · SchoolXense',description:landing.lead}:{}),graph:privatePath(path)?'':buildPageGraph([buildMotherSchema(),buildOrganizationSchema(),buildWebSiteSchema(),buildBreadcrumbSchema(path),...content])})};
};
