import {LANDINGS} from './lib/hive/landings.ts';
import {defineParams} from '@sveltejs/kit/params';
export const params=defineParams({landing:(value:string)=>value in LANDINGS?value:undefined,legacy:(value:string)=>['paystack','seerbit','stripe'].includes(value)?value:undefined});
