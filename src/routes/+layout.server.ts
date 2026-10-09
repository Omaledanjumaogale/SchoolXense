import type {LayoutServerLoad} from './$types';
import {buildMeta,privatePath} from '$lib/seo';
import {buildOrganizationSchema,buildMotherSchema,buildWebSiteSchema,buildBreadcrumbSchema} from '$lib/schema/builders';
import {buildPageGraph} from '$lib/schema/graph';
export const load:LayoutServerLoad=({url})=>({seo:buildMeta(url.pathname,{graph:privatePath(url.pathname)?'':buildPageGraph([buildMotherSchema(),buildOrganizationSchema(),buildWebSiteSchema(),buildBreadcrumbSchema(url.pathname)])})});
