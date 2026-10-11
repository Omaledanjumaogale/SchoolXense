import {afterEach,expect,test,vi} from 'vitest';
import {convexTest} from 'convex-test';
import schema from '../../convex/schema';
import {api,internal} from '../../convex/_generated/api';
import {validPushEndpoint} from '../../convex/push';
import {transactionLocales,transactionText} from '../../src/lib/i18n/transactions';
import {validateAccountCatalog} from '../../src/lib/i18n/account';
vi.mock('../../convex/auth',()=>({authComponent:{safeGetAuthUser:async(ctx:any)=>{const i=await ctx.auth.getUserIdentity();return i?{_id:i.subject,emailVerified:true}:null;}}}));
vi.mock('../../convex/rateLimits',()=>({rateLimiter:{limit:vi.fn()}}));
vi.mock('../../convex/components',()=>({workflows:{start:vi.fn()}}));
const modules=import.meta.glob('../../convex/**/*.ts');
afterEach(()=>vi.unstubAllEnvs());
async function fixture(){const t=convexTest(schema,modules);const ids=await t.run(async ctx=>{const add=(authId:string)=>ctx.db.insert('users',{authId,name:authId,email:authId+'@example.com',isMinor:false,profileComplete:true,state:'Lagos',lga:'Ikeja',whatsapp:'+2348012345678',ninLast4:'1234',dailyMinutes:15,referralCode:authId,creditsDays:0,streak:0,status:'active'});return {owner:await add('owner'),other:await add('other')};});return {t,...ids,a:t.withIdentity({subject:'owner',issuer:'test'}),b:t.withIdentity({subject:'other',issuer:'test'})};}
test('checkout claim is owner-only, provider-bound and cannot initialize twice',async()=>{
 vi.stubEnv('PAYMENTS_ENABLED','true');vi.stubEnv('KORAPAY_ENABLED','true');vi.stubEnv('FLW_ENABLED','true');const f=await fixture();const paymentId=await f.a.mutation(api.checkout.order,{kind:'subscription',refId:'plus_month'});
 await expect(f.b.mutation(internal.gateways.claim,{paymentId,gateway:'korapay'})).rejects.toThrow('FORBIDDEN');
 await f.a.mutation(internal.gateways.claim,{paymentId,gateway:'korapay'});
 await expect(f.a.mutation(internal.gateways.claim,{paymentId,gateway:'korapay'})).rejects.toThrow('reconciliation');
 await expect(f.a.mutation(internal.gateways.claim,{paymentId,gateway:'flutterwave'})).rejects.toThrow('another provider');
});
test('preview cannot start live checkout even when a payment flag is mistakenly enabled',async()=>{
 vi.stubEnv('PAYMENTS_ENABLED','true');vi.stubEnv('KORAPAY_ENABLED','true');vi.stubEnv('APP_ENV','preview');const f=await fixture();const paymentId=await f.a.mutation(api.checkout.order,{kind:'subscription',refId:'plus_month'});
 await expect(f.a.mutation(internal.gateways.claim,{paymentId,gateway:'korapay'})).rejects.toThrow('GATEWAY_UNAVAILABLE');
});
test('settlement rejects the wrong gateway, amount and reused provider reference',async()=>{
 const f=await fixture();const paymentId=await f.a.mutation(api.checkout.order,{kind:'subscription',refId:'plus_month'});await f.t.run(ctx=>ctx.db.patch(paymentId,{gateway:'korapay'}));const p=await f.t.run(ctx=>ctx.db.get(paymentId));
 const args={txRef:p!.txRef,flwTxId:'korapay:'+p!.txRef,amountKobo:200000n,currency:'NGN'};
 await expect(f.t.mutation(internal.money.settlePayment,args)).rejects.toThrow('PAYMENT_GATEWAY_MISMATCH');
 await expect(f.t.mutation(internal.money.settlePayment,{...args,gateway:'korapay',amountKobo:1n})).rejects.toThrow('AMOUNT_OR_CURRENCY_MISMATCH');
 await f.t.mutation(internal.money.settlePayment,{...args,gateway:'korapay'});const before=await f.t.run(ctx=>ctx.db.query('ledgerEntries').collect());
 await f.t.mutation(internal.money.settlePayment,{...args,gateway:'korapay'});expect(await f.t.run(ctx=>ctx.db.query('ledgerEntries').collect())).toHaveLength(before.length);
 await expect(f.t.mutation(internal.money.settlePayment,{...args,txRef:'different',gateway:'korapay'})).rejects.toThrow('TRANSACTION_REFERENCE_MISMATCH');
});
test('push rejects private network endpoints and cross-account device takeover',async()=>{
 for(const url of ['http://fcm.googleapis.com/send','https://127.0.0.1','https://fcm.googleapis.com.evil.test','https://user:pass@fcm.googleapis.com'])expect(validPushEndpoint(url)).toBe(false);
 const f=await fixture(),args={endpoint:'https://fcm.googleapis.com/test',p256dh:'a'.repeat(87),auth:'b'.repeat(22),locale:'en'};
 await f.a.mutation(api.push.subscribe,args);await expect(f.b.mutation(api.push.subscribe,args)).rejects.toThrow('switching accounts');
 await f.b.mutation(api.push.unsubscribe,{endpoint:args.endpoint});expect((await f.t.run(ctx=>ctx.db.query('pushSubscriptions').first()))?.active).toBe(true);
 await f.a.mutation(api.push.unsubscribe,{endpoint:args.endpoint});expect((await f.t.run(ctx=>ctx.db.query('pushSubscriptions').first()))?.active).toBe(false);
});
test('email delivery records distinguish acceptance and terminal outcome; only staff see them',async()=>{
 const f=await fixture();await f.t.mutation(internal.emailDelivery.record,{providerId:'email_test',kind:'reset',recipientHash:'test-hash'});await f.t.mutation(internal.emailDelivery.record,{providerId:'email_test',kind:'reset',recipientHash:'test-hash'});
 const records=await f.t.run(ctx=>ctx.db.query('emailDeliveries').collect());expect(records).toHaveLength(1);expect(records[0].status).toBe('accepted');
 await expect(f.a.query(api.emailDelivery.queue,{})).rejects.toThrow('FORBIDDEN');await f.t.mutation(internal.emailDelivery.outcome,{id:records[0]._id,status:'bounced'});expect(await f.t.query(internal.emailDelivery.pending,{})).toHaveLength(0);
});
test('all advertised transactional locales have complete message keys',()=>{expect(validateAccountCatalog()).toBe(true);const keys=Object.keys(transactionText('en')).sort();for(const locale of transactionLocales){const text=transactionText(locale);expect(Object.keys(text).sort()).toEqual(keys);expect(Object.values(text).every(x=>typeof x==='string'&&x.length>0)).toBe(true);}expect(transactionText('unknown')).toEqual(transactionText('en'));});
