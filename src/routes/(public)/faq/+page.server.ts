import {FAQ} from '$lib/faq';
import {buildMeta} from '$lib/seo';
import {buildPageGraph} from '$lib/schema/graph';
import {buildFAQSchema,buildOrganizationSchema,buildMotherSchema,buildWebSiteSchema,buildBreadcrumbSchema} from '$lib/schema/builders';
export const load=()=>({seo:buildMeta('/faq',{graph:buildPageGraph([buildMotherSchema(),buildOrganizationSchema(),buildWebSiteSchema(),buildBreadcrumbSchema('/faq'),buildFAQSchema(FAQ)])})});
