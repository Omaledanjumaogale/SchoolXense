import { mutation, query } from './_generated/server';
import { v, ConvexError } from 'convex/values';
import { resolve, audit } from './lib/access';
const args = { key: v.string(), kind: v.union(v.literal('image'),v.literal('document')), contentType: v.string(), size: v.number() };
export const register = mutation({ args, handler: async (ctx, a) => {
 const { user } = await resolve(ctx, a.kind === 'image' ? {role:'staff'} : {});
 if (!a.key.startsWith(`uploads/${user._id}/`) || !Number.isSafeInteger(a.size) || a.size <= 0 || a.size > 10485760) throw new ConvexError('Invalid file.');
 const prior = await ctx.db.query('mediaFiles').withIndex('by_key',q=>q.eq('key',a.key)).unique();
 if (prior) { if (prior.ownerId !== user._id) throw new ConvexError('FORBIDDEN'); return prior._id; }
 const id = await ctx.db.insert('mediaFiles', { ...a, ownerId: user._id, createdAt: Date.now() });
 await audit(ctx,user._id,'media.upload',id,a.kind); return id;
}});
export const get = query({ args:{key:v.string()}, handler: async(ctx,{key})=>{
 const {user}=await resolve(ctx);
 const file=await ctx.db.query('mediaFiles').withIndex('by_key',q=>q.eq('key',key)).unique();
 if(!file || file.ownerId!==user._id) throw new ConvexError('FORBIDDEN'); return file;
}});
export const purchasedDocument=query({args:{key:v.string()},handler:async(ctx,{key})=>{const {user}=await resolve(ctx);const file=await ctx.db.query('mediaFiles').withIndex('by_key',q=>q.eq('key',key)).unique();if(!file||file.kind!=='document')throw new ConvexError('FORBIDDEN');if(file.ownerId===user._id||await ctx.db.query('roles').withIndex('by_user_role',q=>q.eq('userId',user._id).eq('role','staff')).unique())return file;const pack=await ctx.db.query('packs').filter(q=>q.eq(q.field('mediaKey'),key)).first();if(!pack||!await ctx.db.query('purchases').withIndex('by_user',q=>q.eq('userId',user._id)).filter(q=>q.eq(q.field('packId'),pack._id)).first())throw new ConvexError('FORBIDDEN');return file;}});
