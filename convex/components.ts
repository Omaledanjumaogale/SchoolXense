import { TableAggregate } from '@convex-dev/aggregate';
import { WorkflowManager } from '@convex-dev/workflow';
import { Migrations } from '@convex-dev/migrations';
import { components, internal } from './_generated/api';
import type { DataModel, Id } from './_generated/dataModel';
import { v } from 'convex/values';
import schema from './schema';
export const attemptAggregate=new TableAggregate<{Namespace:Id<'users'>;Key:number;DataModel:DataModel;TableName:'attempts'}>(components.aggregate,{namespace:doc=>doc.userId,sortKey:doc=>doc.startedAt,sumValue:doc=>doc.pct??0});
export const workflows=new WorkflowManager(components.workflow);
export const fulfilPayment=workflows.define({args:{paymentId:v.id('payments')}}).handler(async(step,args):Promise<void>=>{
 await step.runMutation(internal.money.afterPayment,args);
});
const migrations=new Migrations(components.migrations,{schema});
export const namespaceSchoolXenseUsers=migrations.define({table:'users',migrateOne:async(ctx,user)=>{
 if(user.authId&&!user.ecosystemId)await ctx.db.patch(user._id,{ecosystemId:'schoolxense:'+user.authId});
}});
