import {expect,test,vi} from 'vitest';
import {convexTest} from 'convex-test';
import schema from '../../convex/schema';
import {api} from '../../convex/_generated/api';
vi.mock('../../convex/auth',()=>({authComponent:{safeGetAuthUser:async()=>null}}));
const modules=import.meta.glob('../../convex/**/*.ts');
test('discovery paginates published resources and public responses exclude private download keys',async()=>{
 const t=convexTest(schema,modules);
 await t.run(async ctx=>{
  const authorId=await ctx.db.insert('users',{name:'Author',email:'private@example.test',isMinor:false,dailyMinutes:15,referralCode:'PRIVATE',creditsDays:0,streak:0,status:'active'});
  for(let i=0;i<56;i++)await ctx.db.insert('packs',{authorId,slug:'resource-'+i,title:'Resource '+i,subject:'Physics',exam:'jamb',kind:'notes',price:10000n,pages:10,status:i===55?'draft':'live',preview:['Public preview'],version:1,mediaKey:'private/key.pdf',rating:0,sales:0});
 });
 const first=await t.query(api.portal.discovery,{kind:'packs',paginationOpts:{numItems:30,cursor:null}});
 const second=await t.query(api.portal.discovery,{kind:'packs',paginationOpts:{numItems:30,cursor:first.continueCursor}});
 expect(first.isDone).toBe(false);expect(second.isDone).toBe(true);
 expect([...first.page,...second.page]).toHaveLength(55);
 expect([...first.page,...second.page].every(x=>!x.path.endsWith('resource-55'))).toBe(true);
 const pack=await t.query(api.portal.publicPack,{slug:'resource-0'});
 expect(pack).not.toHaveProperty('mediaKey');expect(pack).not.toHaveProperty('fileId');
 const catalogue=await t.query(api.portal.catalogue,{kind:'packs'});
 expect(catalogue.every(x=>!('mediaKey' in x)&&!('fileId' in x))).toBe(true);
 expect(await t.query(api.portal.publicPack,{slug:'resource-55'})).toBeNull();
});
test('public tutor pages require an active backend tutor role and hide identity and referral records',async()=>{
 const t=convexTest(schema,modules);
 const id=await t.run(async ctx=>{
  const id=await ctx.db.insert('users',{name:'Tutor',slug:'tutor',email:'private@example.test',isMinor:false,dailyMinutes:15,referralCode:'PRIVATE',creditsDays:0,streak:0,status:'active'});
  await ctx.db.insert('offers',{tutorId:id,kind:'tutoring',title:'Physics tuition',subjects:['Physics'],topics:[],levels:[],languages:['English'],price:10000n,availability:[],module:'secondary',active:true,minorsApproved:false,rating:0,reviews:0,completion:0,sessions:0});return id;
 });
 expect(await t.query(api.portal.publicTutor,{slug:'tutor'})).toBeNull();
 await t.run(ctx=>ctx.db.insert('roles',{userId:id,role:'tutor',grantedAt:Date.now()}));
 const result=await t.query(api.portal.publicTutor,{slug:'tutor'});
 expect(result?.name).toBe('Tutor');expect(result).not.toHaveProperty('email');expect(result).not.toHaveProperty('referralCode');
 await t.run(ctx=>ctx.db.patch(id,{status:'suspended'}));
 expect(await t.query(api.portal.publicTutor,{slug:'tutor'})).toBeNull();
 expect((await t.query(api.portal.discovery,{kind:'offers',paginationOpts:{numItems:30,cursor:null}})).page).toEqual([]);
});
