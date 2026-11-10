import {defineEnvVars} from '@sveltejs/kit/env';
const optional=(value:string|undefined)=>value;
export const variables=defineEnvVars({
 PUBLIC_CONVEX_URL:{public:true,static:true,schema:optional},
 PUBLIC_CONVEX_SITE_URL:{public:true,static:true,schema:optional},
 PUBLIC_CONVEX_HTTP_ACTIONS_URL:{public:true,static:true,schema:optional},
 PUBLIC_DEMO_MODE:{public:true,static:true,schema:optional},
 MEDIA_SIGNING_SECRET:{schema:optional}, INTERNAL_WEBHOOK_TOKEN:{schema:optional}, FLW_SECRET_HASH:{schema:optional},FLW_SECRET_KEY:{schema:optional},KORAPAY_SECRET_KEY:{schema:optional},PAYMENTS_ENABLED:{schema:optional}
});
