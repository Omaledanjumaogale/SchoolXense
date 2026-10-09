import {HOME_FAQ} from '$lib/home-faq';
import {buildMeta} from '$lib/seo';
import {buildPageGraph} from '$lib/schema/graph';
import {buildFAQSchema,buildMotherSchema,buildOrganizationSchema,buildWebSiteSchema} from '$lib/schema/builders';
export const load=()=>({seo:buildMeta('/',{graph:buildPageGraph([buildMotherSchema(),buildOrganizationSchema(),buildWebSiteSchema(),buildFAQSchema(HOME_FAQ)])})});
