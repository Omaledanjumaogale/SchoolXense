import type {LayoutServerLoad} from './$types';
import {publicCatalogue} from '$lib/server/catalogue';
export const load:LayoutServerLoad=async({url})=>{
 const kind=url.pathname==='/library'?'packs':url.pathname==='/tutors'?'offers':url.pathname==='/cohorts'?'cohorts':null;
 return {catalogue:kind?await publicCatalogue(kind).catch(()=>null):null};
};
