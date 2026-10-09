import {error} from '@sveltejs/kit';
import {locales,type Locale} from '$lib/locales';
import {buildMeta,SITE} from '$lib/seo';
import {buildPageGraph} from '$lib/schema/graph';
import {buildMotherSchema,buildOrganizationSchema,buildWebSiteSchema} from '$lib/schema/builders';
export const load=({params}:{params:{locale:string}})=>{if(!(params.locale in locales))error(404,'Language unavailable');const locale=params.locale as Locale,text=locales[locale];return {locale,text,alternates:Object.keys(locales).map(code=>({code,url:SITE+'/languages/'+code})),seo:buildMeta('/languages/'+locale,{title:text.title,description:text.intro,graph:buildPageGraph([buildMotherSchema(),buildOrganizationSchema(),buildWebSiteSchema(),{'@type':'WebPage',name:text.title,description:text.intro,inLanguage:locale,url:SITE+'/languages/'+locale}])})};};
