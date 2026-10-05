/**
 * withAccess() — every Convex function declares the role and tenant it needs.
 * Permissions are checked here, never only in the UI. Tenant isolation is tested in CI.
 */
import { customMutation, customQuery, customAction } from 'convex-helpers/server/customFunctions';
import { mutation, query, action, type QueryCtx } from '../_generated/server';
import { authComponent } from '../auth';
import { ConvexError,v } from 'convex/values';
import type { Id, Doc } from '../_generated/dataModel';

export type Role = 'learner' | 'guardian' | 'tutor' | 'creator' | 'teamlead' | 'ambassador' | 'instadmin' | 'staff';
type Need = { role?: Role; anyRole?: Role[]; tenantArg?: 'tenantId'; adultOnly?: boolean };

export async function hasRole(ctx: QueryCtx, userId: Id<'users'>, role: Role) {
	const row = await ctx.db.query('roles').withIndex('by_user_role', (q) => q.eq('userId', userId).eq('role', role)).unique();
	return !!row;
}

export async function isTenantMember(ctx: QueryCtx, userId: Id<'users'>, tenantId: Id<'tenants'>) {
	if (await hasRole(ctx, userId, 'staff')) return true;
	const m = await ctx.db.query('tenantMembers').withIndex('by_tenant_user', (q) => q.eq('tenantId', tenantId).eq('userId', userId)).unique();
	return !!m && m.kind === 'staff';
}

export async function resolve(ctx: QueryCtx, need: Need = {}, args: Record<string, unknown> = {}): Promise<{ user: Doc<'users'> }> {
	const identity = await authComponent.safeGetAuthUser(ctx);
	if (!identity?.emailVerified) throw new ConvexError('UNAUTHENTICATED');
	const user = await ctx.db.query('users').withIndex('by_authId', q => q.eq('authId', identity._id)).unique();
	if (!user) throw new ConvexError('UNAUTHENTICATED');
	const userId = user._id;
	if (user.status !== 'active') throw new ConvexError('ACCOUNT_RESTRICTED');
	if (need.adultOnly && user.isMinor) throw new ConvexError('ADULTS_ONLY');
	if (need.role && !(await hasRole(ctx, userId, need.role))) throw new ConvexError('FORBIDDEN');
	if (need.anyRole) {
		const ok = await Promise.all(need.anyRole.map((r) => hasRole(ctx, userId, r)));
		if (!ok.some(Boolean)) throw new ConvexError('FORBIDDEN');
	}
	if (need.tenantArg && !(await isTenantMember(ctx, userId, args[need.tenantArg] as Id<'tenants'>))) throw new ConvexError('TENANT_FORBIDDEN');
	return { user };
}

export const withAccess = (need: Need = {}) => ({
	query: customQuery(query, { args: {tenantId:v.optional(v.id('tenants'))}, input: async (ctx, args) => ({ ctx: await resolve(ctx, need, args), args }) }),
	mutation: customMutation(mutation, { args: {tenantId:v.optional(v.id('tenants'))}, input: async (ctx, args) => ({ ctx: await resolve(ctx, need, args), args }) }),
	action: customAction(action, { args: {}, input: async (ctx) => { const identity = await authComponent.safeGetAuthUser(ctx); if (!identity?.emailVerified) throw new ConvexError('UNAUTHENTICATED'); return { ctx: { authId: identity._id }, args: {} }; } })
});

export async function audit(ctx: { db: { insert: (t: 'auditLog', d: Omit<Doc<'auditLog'>, '_id' | '_creationTime'>) => Promise<unknown> } }, actorId: Id<'users'> | undefined, action: string, target: string, meta?: string) {
	await ctx.db.insert('auditLog', { actorId, action, target, meta, at: Date.now() });
}
