import { describe, expect, test, vi } from 'vitest';
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
 const id=await ctx.db.insert('users',{authId,name:authId,email:authId+'@example.test',isMinor:minor,dailyMinutes:15,referralCode:authId,creditsDays:0,streak:0,status:'active'});
 await ctx.db.insert('roles',{userId:id,role:'learner',grantedAt:Date.now()});return id;
});}
const identity=(subject:string,verified=true)=>({subject,email:subject+'@example.test',name:subject,emailVerified:verified});
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
