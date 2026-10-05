import { ConvexError } from 'convex/values';
import { nigeria } from '../../src/lib/data/nigeria';
export function residence(state:string,lga:string,whatsapp:string){
 if(!nigeria[state]?.includes(lga))throw new ConvexError('Select a valid state and its LGA.');
 const contact=whatsapp.replace(/[\s()-]/g,'').replace(/^0(?=\d{10}$)/,'+234');
 if(!/^\+[1-9]\d{7,14}$/.test(contact))throw new ConvexError('Provide a valid WhatsApp number including country code.');
 return {state,lga,whatsapp:contact};
}
