import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { convexTest } from 'convex-test';
import schema from '../../convex/schema';
import { api, internal } from '../../convex/_generated/api';
import { validateQuestions, parseQuestions } from '../../src/lib/ai-validation';
import { nigeria } from '../../src/lib/data/nigeria';
import { residence } from '../../convex/lib/profileValidation';
vi.mock('../../convex/auth',()=>({authComponent:{safeGetAuthUser:async(ctx:any)=>{
 const identity=await ctx.auth.getUserIdentity();return identity?{_id:identity.subject,emailVerified:identity.emailVerified,email:identity.email,name:identity.name}:null;
}}}));
const modules=import.meta.glob('../../convex/**/*.ts');
async function account(t:ReturnType<typeof convexTest>,authId:string,minor=false){return t.run(async ctx=>{
 const id=await ctx.db.insert('users',{authId,name:authId,email:authId+'@example.test',profileComplete:true,isMinor:minor,dailyMinutes:15,referralCode:authId,creditsDays:0,streak:0,status:'active'});
 await ctx.db.insert('roles',{userId:id,role:'learner',grantedAt:Date.now()});return id;
});}
const identity=(subject:string,verified=true)=>({subject,email:subject+'@example.test',name:subject,emailVerified:verified});
async function paid(t:ReturnType<typeof convexTest>,userId:any,until=Date.now()+86400000,planId='plus_month'){
 return t.run(async ctx=>{const amount=planId==='exam_pass'?1000000n:200000n;const paymentId=await ctx.db.insert('payments',{userId,txRef:crypto.randomUUID(),amount,currency:'NGN',purpose:'subscription',refId:`${planId}:${userId}`,status:'successful',fulfilledAt:Date.now(),createdAt:Date.now()});const id=await ctx.db.insert('subscriptions',{userId,paidBy:userId,planId,until,startedAt:Date.now()-1000,status:'active',sourcePaymentId:paymentId});return{id,paymentId};});
}
describe('Server subscription and signup enforcement',()=>{
 beforeEach(()=>vi.useFakeTimers({toFake:['setTimeout','clearTimeout']}));
 afterEach(()=>vi.useRealTimers());
 test('legacy reconciliation only links SchoolXense receipts and preserves unrelated records',async()=>{
 const t=convexTest(schema,modules),alice=await account(t,'alice'),bob=await account(t,'bob');const records=await t.run(async ctx=>{const ids=[];for(const [userId,prefix] of [[alice,'SX-'],[bob,'EWIN-']] as const){await ctx.db.insert('payments',{userId,txRef:prefix+crypto.randomUUID(),amount:200000n,currency:'NGN',purpose:'subscription',refId:`plus_month:${userId}`,status:'successful',fulfilledAt:Date.now(),createdAt:Date.now()});ids.push(await ctx.db.insert('subscriptions',{userId,paidBy:userId,planId:'plus_month',until:Date.now()+86400000}));}return ids;});expect(await t.mutation(internal.subscriptions.reconcileLegacy,{})).toEqual({linked:1,unverified:1});expect((await t.run(ctx=>ctx.db.get(records[0])))?.sourcePaymentId).toBeTruthy();expect((await t.run(ctx=>ctx.db.get(records[1])))?.sourcePaymentId).toBeUndefined();expect(await t.run(ctx=>ctx.db.query('subscriptions').collect())).toHaveLength(2);
 });
 test('only a linked guardian can buy for a child and settlement grants the child access',async()=>{
 const t=convexTest(schema,modules),guardian=await account(t,'parent'),child=await account(t,'child',true),other=await account(t,'other');await t.run(async ctx=>{await ctx.db.insert('roles',{userId:guardian,role:'guardian',grantedAt:Date.now()});await ctx.db.insert('guardianLinks',{guardianId:guardian,childId:child,spendingLimit:0n,createdAt:Date.now()});});await expect(t.withIdentity(identity('other')).mutation(api.checkout.order,{kind:'subscription',refId:'plus_month',beneficiaryId:child})).rejects.toThrow('FORBIDDEN');const order=await t.withIdentity(identity('parent')).mutation(api.checkout.order,{kind:'subscription',refId:'plus_month',beneficiaryId:child});await t.run(ctx=>ctx.db.patch(order,{status:'successful'}));await t.mutation(internal.money.afterPayment,{paymentId:order});expect((await t.withIdentity(identity('child')).query(api.subscriptions.current,{})).active).toBe(true);expect((await t.withIdentity(identity('parent')).query(api.subscriptions.current,{})).active).toBe(false);expect(await t.withIdentity(identity('child')).query(api.practice.reviewDue,{})).toEqual([]);
 });
 test('expiry updates live state and an old scheduled timer cannot expire a renewed plan',async()=>{
 const t=convexTest(schema,modules),id=await account(t,'alice'),s=await paid(t,id);const original=await t.run(ctx=>ctx.db.get(s.id));await t.mutation(internal.subscriptions.expire,{id:s.id,expectedUntil:original!.until-1000});expect((await t.run(ctx=>ctx.db.get(s.id)))?.status).toBe('active');const expiredAt=Date.now()-1;await t.run(ctx=>ctx.db.patch(s.id,{until:expiredAt}));await t.mutation(internal.subscriptions.expire,{id:s.id,expectedUntil:original!.until});expect((await t.run(ctx=>ctx.db.get(s.id)))?.status).toBe('active');await t.mutation(internal.subscriptions.expire,{id:s.id,expectedUntil:expiredAt});expect((await t.run(ctx=>ctx.db.get(s.id)))?.status).toBe('expired');
 });
 test('expiry blocks an existing mock even through idempotent start and next-item calls',async()=>{
 const t=convexTest(schema,modules),id=await account(t,'alice');await paid(t,id,Date.now()-1);const attemptId=await t.run(ctx=>ctx.db.insert('attempts',{userId:id,exam:'jamb',subject:'physics',mode:'mock',target:20,startedAt:Date.now(),clientId:'saved-mock'}));const a=t.withIdentity(identity('alice'));await expect(a.query(api.practice.nextItem,{attemptId})).rejects.toThrow('SUBSCRIPTION_REQUIRED');await expect(a.mutation(api.practice.start,{exam:'jamb',subject:'physics',mode:'mock',clientId:'saved-mock'})).rejects.toThrow('SUBSCRIPTION_REQUIRED');
 });
 test('hosted exams reject expired institution licences even for existing members',async()=>{
 const t=convexTest(schema,modules),id=await account(t,'alice');const hostedExamId=await t.run(async ctx=>{const tenantId=await ctx.db.insert('tenants',{slug:'school',name:'School',kind:'school',state:'Lagos',subdomain:'school'});await ctx.db.insert('tenantMembers',{tenantId,userId:id,kind:'learner'});await ctx.db.insert('licences',{tenantId,seats:20,modules:['secondary'],startsAt:0,endsAt:Date.now()-1,priceKobo:100n});return ctx.db.insert('hostedExams',{tenantId,title:'Mock',exam:'jamb',subject:'physics',date:Date.now(),seats:20,durationMin:30,status:'live',questionIds:[]});});await expect(t.withIdentity(identity('alice')).mutation(api.practice.start,{exam:'jamb',subject:'physics',mode:'mock',hostedExamId})).rejects.toThrow('LICENCE_REQUIRED');
 });
 test('incomplete signup cannot checkout or invoke paid workspace operations',async()=>{
 const t=convexTest(schema,modules),id=await account(t,'alice');await t.run(ctx=>ctx.db.patch(id,{profileComplete:false}));await paid(t,id);
 const a=t.withIdentity(identity('alice'));await expect(a.mutation(api.checkout.order,{kind:'subscription',refId:'plus_month'})).rejects.toThrow('PROFILE_INCOMPLETE');await expect(a.mutation(api.portal.createTeam,{name:'Team A',blurb:'Our team'})).rejects.toThrow('PROFILE_INCOMPLETE');
 });
 test('stale earning role does not grant expired paid access and wallet stays readable',async()=>{
 const t=convexTest(schema,modules),id=await account(t,'alice');await paid(t,id,Date.now()-1);await t.run(ctx=>ctx.db.insert('roles',{userId:id,role:'creator',grantedAt:Date.now()}));const a=t.withIdentity(identity('alice'));
 await expect(a.query(api.portal.workspace,{domain:'studio'})).rejects.toThrow('SUBSCRIPTION_REQUIRED');await expect(a.mutation(api.practice.start,{exam:'jamb',subject:'physics',mode:'mock'})).rejects.toThrow('SUBSCRIPTION_REQUIRED');expect(await a.query(api.money.myWallet,{})).toEqual({available:0n,entries:[]});
 });
 test('tier without settled payment, wrong ownership and refunded payment never grant access',async()=>{
 const t=convexTest(schema,modules),id=await account(t,'alice'),other=await account(t,'bob');const a=t.withIdentity(identity('alice'));
 const s=await t.run(ctx=>ctx.db.insert('subscriptions',{userId:id,paidBy:id,planId:'plus_month',until:Date.now()+86400000}));await expect(a.query(api.practice.reviewDue,{})).rejects.toThrow('SUBSCRIPTION_REQUIRED');await t.run(ctx=>ctx.db.delete(s));const records=await paid(t,id);
 await t.run(ctx=>ctx.db.patch(records.paymentId,{userId:other}));await expect(a.query(api.practice.reviewDue,{})).rejects.toThrow('SUBSCRIPTION_REQUIRED');await t.run(ctx=>ctx.db.patch(records.paymentId,{userId:id,status:'refunded'}));await expect(a.query(api.practice.reviewDue,{})).rejects.toThrow('SUBSCRIPTION_REQUIRED');
 });
 test('catalog controls capabilities; exam pass cannot unlock creator workspace',async()=>{
 const t=convexTest(schema,modules),id=await account(t,'alice');await paid(t,id,Date.now()+86400000,'exam_pass');await t.run(ctx=>ctx.db.insert('roles',{userId:id,role:'creator',grantedAt:Date.now()}));const a=t.withIdentity(identity('alice'));expect(await a.query(api.practice.reviewDue,{})).toEqual([]);await expect(a.query(api.portal.workspace,{domain:'studio'})).rejects.toThrow('SUBSCRIPTION_REQUIRED');
 });
 test('cancellation preserves purchased period, resume is audited, expiry removes access',async()=>{
 const t=convexTest(schema,modules),id=await account(t,'alice'),s=await paid(t,id),a=t.withIdentity(identity('alice'));await a.mutation(api.subscriptions.cancel,{});expect((await a.query(api.subscriptions.current,{})).cancelAtPeriodEnd).toBe(true);expect(await a.query(api.practice.reviewDue,{})).toEqual([]);await a.mutation(api.subscriptions.resume,{});expect((await a.query(api.subscriptions.current,{})).cancelAtPeriodEnd).toBe(false);await t.run(ctx=>ctx.db.patch(s.id,{until:Date.now()-1}));await expect(a.query(api.practice.reviewDue,{})).rejects.toThrow('SUBSCRIPTION_REQUIRED');expect((await a.query(api.portal.workspace,{domain:'wallet'})).payments).toHaveLength(1);
 });
 test('paid account cannot invoke admin actions; trusted staff bypasses plan, learner profile and earning role gates',async()=>{
 const t=convexTest(schema,modules),id=await account(t,'alice');await paid(t,id);const a=t.withIdentity(identity('alice'));await expect(a.query(api.admin.health,{})).rejects.toThrow('FORBIDDEN');await expect(a.mutation(api.portal.setEnquiryStatus,{id:await t.run(ctx=>ctx.db.insert('enquiries',{name:'Example',email:'example@example.test',topic:'School',message:'Please share details',status:'new',createdAt:Date.now()})),status:'closed'})).rejects.toThrow('FORBIDDEN');await t.run(async ctx=>{for(const s of await ctx.db.query('subscriptions').collect())await ctx.db.delete(s._id);await ctx.db.insert('roles',{userId:id,role:'staff',grantedAt:Date.now()});await ctx.db.patch(id,{profileComplete:false});});expect(await a.query(api.practice.reviewDue,{})).toEqual([]);expect(await a.mutation(api.portal.createTeam,{name:'Admin team',blurb:'Support learning'})).toBeTruthy();expect((await a.query(api.admin.health,{})).database.status).toBe('connected');
 });
 test('fulfilment grants only settled owner access and renewal is idempotent',async()=>{
 const t=convexTest(schema,modules),id=await account(t,'alice'),a=t.withIdentity(identity('alice'));const order=await a.mutation(api.checkout.order,{kind:'subscription',refId:'plus_month'});await t.mutation(internal.money.afterPayment,{paymentId:order});expect((await a.query(api.subscriptions.current,{})).active).toBe(false);await t.run(ctx=>ctx.db.patch(order,{status:'successful'}));await t.mutation(internal.money.afterPayment,{paymentId:order});const before=await a.query(api.subscriptions.current,{});expect(before.active).toBe(true);await t.mutation(internal.money.afterPayment,{paymentId:order});expect((await a.query(api.subscriptions.current,{})).until).toBe(before.until);
 });
});
describe('Production access and authoritative orders',()=>{
 test('anonymous and unverified identities cannot create orders',async()=>{
 const t=convexTest(schema,modules);await account(t,'alice');
 await expect(t.mutation(api.checkout.order,{kind:'subscription',refId:'plus_month'})).rejects.toThrow('UNAUTHENTICATED');
 await expect(t.withIdentity(identity('alice',false)).mutation(api.checkout.order,{kind:'subscription',refId:'plus_month'})).rejects.toThrow('UNAUTHENTICATED');
 });
 test('amount is derived from the saved booking and only its owner can read it',async()=>{
 const t=convexTest(schema,modules);const alice=await account(t,'alice'),bob=await account(t,'bob');
 const booking=await t.run(async ctx=>{const offer=await ctx.db.insert('offers',{tutorId:bob,kind:'tutoring',title:'Physics support',subjects:['physics'],topics:[],levels:[],languages:['English'],price:123400n,availability:[],module:'tutors',active:true,minorsApproved:false,rating:0,reviews:0,completion:0,sessions:0});return ctx.db.insert('bookings',{offerId:offer,learnerId:alice,tutorId:bob,topic:'Forces',slot:'2027-01-01',minutes:45,price:123400n,status:'pending_payment'});});
 const a=t.withIdentity(identity('alice'));const order=await a.mutation(api.checkout.order,{kind:'booking',refId:booking});
 expect((await a.query(api.checkout.get,{paymentId:order})).payment.amount).toBe(123400n);
 expect(await a.mutation(api.checkout.order,{kind:'booking',refId:booking})).toBe(order);
 await expect(t.withIdentity(identity('bob')).query(api.checkout.get,{paymentId:order})).rejects.toThrow('FORBIDDEN');
 });
 test('a role in one institution does not allow another tenant workspace',async()=>{
 const t=convexTest(schema,modules);const alice=await account(t,'alice');
 const tenants=await t.run(async ctx=>{const a=await ctx.db.insert('tenants',{slug:'a',name:'A',kind:'school',state:'Lagos',subdomain:'a'});const b=await ctx.db.insert('tenants',{slug:'b',name:'B',kind:'school',state:'Lagos',subdomain:'b'});await ctx.db.insert('tenantMembers',{tenantId:a,userId:alice,kind:'staff'});return[a,b];});
 const a=t.withIdentity(identity('alice'));await expect(a.query(api.portal.workspace,{domain:'inst',tenantId:tenants[1]})).rejects.toThrow('TENANT_FORBIDDEN');
 expect((await a.query(api.portal.workspace,{domain:'inst',tenantId:tenants[0]})).tenant?.name).toBe('A');
 await expect(a.query(api.portal.workspace,{domain:'ops'})).rejects.toThrow('FORBIDDEN');
 });
 test('settlement rejects underpayment and currency mismatch',async()=>{
 const t=convexTest(schema,modules);const alice=await account(t,'alice');await t.run(ctx=>ctx.db.insert('payments',{userId:alice,txRef:'SX-guard',amount:100000n,currency:'NGN',purpose:'subscription',status:'pending',createdAt:Date.now()}));
 await expect(t.mutation(internal.money.settlePayment,{txRef:'SX-guard',flwTxId:'123',amountKobo:99999n,currency:'NGN'})).rejects.toThrow('AMOUNT_OR_CURRENCY_MISMATCH');
 await expect(t.mutation(internal.money.settlePayment,{txRef:'SX-guard',flwTxId:'123',amountKobo:100000n,currency:'USD'})).rejects.toThrow('AMOUNT_OR_CURRENCY_MISMATCH');
 });
 test('paused accounts cannot mutate',async()=>{const t=convexTest(schema,modules);const id=await account(t,'alice');await t.run(ctx=>ctx.db.patch(id,{status:'paused'}));await expect(t.withIdentity(identity('alice')).mutation(api.checkout.order,{kind:'subscription',refId:'plus_month'})).rejects.toThrow('ACCOUNT_RESTRICTED');});
});
describe('Generated content validation',()=>{
 const q={topic:'Forces',stem:'What is the SI unit of force?',options:['Newton','Joule','Watt','Volt'],answer:0,explanation:'Force is measured in newtons.'};
 test('accepts structured drafts and fenced JSON',()=>{expect(parseQuestions('```json\n'+JSON.stringify([q])+'\n```',1)).toEqual([q]);});
 test('rejects malformed answer keys, duplicate options and excess output',()=>{expect(()=>validateQuestions([{...q,answer:9}])).toThrow();expect(()=>validateQuestions([{...q,options:['A','A','B','C']}])).toThrow();expect(()=>validateQuestions([q,q],1)).toThrow();expect(()=>parseQuestions('not json',1)).toThrow();});
});
describe('Profiles and administrative review',()=>{
 test('certificate verification uses persisted records and excludes private identity',async()=>{const t=convexTest(schema,modules),id=await account(t,'learner');await t.run(ctx=>ctx.db.insert('certificates',{userId:id,title:'Physics mock',pct:80,grade:'A1',code:'SX-C-1234567890ABCDE',module:'secondary',issuedAt:Date.now()}));const result=await t.query(api.portal.verifyCertificate,{code:'sx-c-1234567890abcde'});expect(result?.holder).toBe('learner');expect(result).not.toHaveProperty('email');expect(await t.query(api.portal.verifyCertificate,{code:'SX-C-NOTFOUND'})).toBeNull();});
 test('contains all state/FCT and LGA entries and validates the dependent selection',()=>{
 expect(Object.keys(nigeria)).toHaveLength(37);expect(Object.values(nigeria).flat()).toHaveLength(774);
 expect(residence('Lagos','Ikeja','08012345678').whatsapp).toBe('+2348012345678');
 expect(()=>residence('Lagos','Aba North','08012345678')).toThrow();expect(()=>residence('Lagos','Ikeja','123')).toThrow();
 });
 test('health and queue decisions require staff, retain an audit and reject stale decisions',async()=>{
 const t=convexTest(schema,modules);const owner=await account(t,'owner'),learner=await account(t,'learner');
 await t.run(ctx=>ctx.db.insert('roles',{userId:owner,role:'staff',grantedAt:Date.now()}));
 const id=await t.run(ctx=>ctx.db.insert('supportTickets',{userId:learner,subject:'Account help',body:'Please help recover my access.',status:'open',priority:'normal'}));
 await expect(t.withIdentity(identity('learner')).query(api.admin.health,{})).rejects.toThrow('FORBIDDEN');
 const staff=t.withIdentity(identity('owner'));expect((await staff.query(api.admin.health,{})).database.status).toBe('connected');
 await staff.mutation(api.admin.queueDecision,{kind:'support',id,status:'under_review',expectedStatus:'open',note:'Reviewing the account access evidence.'});
 await expect(staff.mutation(api.admin.queueDecision,{kind:'support',id,status:'resolved',expectedStatus:'open',note:'The verified owner can now sign in.'})).rejects.toThrow('changed');
 expect((await t.run(ctx=>ctx.db.get(id)))?.status).toBe('under_review');expect((await t.run(ctx=>ctx.db.query('auditLog').collect()))).toHaveLength(1);
 });
 test('identity encryption is private and never included in profile responses',async()=>{
 const t=convexTest(schema,modules);await account(t,'alice');vi.stubEnv('NIN_ENCRYPTION_KEY','a'.repeat(64));
 await t.action(internal.identity.register,{authId:'alice',state:'Lagos',lga:'Ikeja',whatsapp:'08012345678',nin:'12345678901'});
 const profile=await t.withIdentity(identity('alice')).query(api.portal.profile,{});expect(profile?.ninLast4).toBe('8901');expect(JSON.stringify(profile)).not.toContain('12345678901');expect(profile).not.toHaveProperty('ciphertext');
 const saved=await t.run(ctx=>ctx.db.query('privateIdentities').first());expect(saved?.ciphertext).not.toContain('12345678901');vi.unstubAllEnvs();
 });
 test('institution staff cannot change another tenant assessment or assign expired seats',async()=>{
 const t=convexTest(schema,modules),id=await account(t,'teacher'),learner=await account(t,'learner');
 const records=await t.run(async ctx=>{await ctx.db.insert('roles',{userId:id,role:'instadmin',grantedAt:Date.now()});const a=await ctx.db.insert('tenants',{slug:'a',name:'A',kind:'school',state:'Lagos',subdomain:'a'}),b=await ctx.db.insert('tenants',{slug:'b',name:'B',kind:'school',state:'Lagos',subdomain:'b'});await ctx.db.insert('tenantMembers',{tenantId:a,userId:id,kind:'staff'});await ctx.db.insert('licences',{tenantId:a,seats:30,modules:['secondary'],startsAt:0,endsAt:Date.now()-1,priceKobo:0n});const exam=await ctx.db.insert('hostedExams',{tenantId:b,title:'B assessment',exam:'jamb',subject:'physics',date:0,seats:10,durationMin:30,status:'scheduled',questionIds:[]});return {a,b,exam};});
 const staff=t.withIdentity(identity('teacher'));await expect(staff.mutation(api.institutions.assignSeat,{tenantId:records.a,userId:learner})).rejects.toThrow('NO_SEATS');await expect(staff.mutation(api.institutions.examStatus,{tenantId:records.a,id:records.exam,status:'live'})).rejects.toThrow('TENANT_FORBIDDEN');
 });
});
