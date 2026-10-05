import type { Role } from '$hive/types';

export interface NavItem { href: string; label: string; icon: string; match?: string }
export interface NavGroup { label: string; items: NavItem[] }

/** Five-tab BottomNav per role (Implementation Plan § Navigation rules). */
export const BOTTOM: Record<Role, NavItem[]> = {
	learner: [
		{ href: '/home', label: 'Home', icon: 'home' },
		{ href: '/practice', label: 'Practice', icon: 'target', match: '/practice|/review|/attempt' },
		{ href: '/book', label: 'Help', icon: 'lifebuoy', match: '/book|/sessions|/cohorts' },
		{ href: '/library', label: 'Library', icon: 'book' },
		{ href: '/settings', label: 'Me', icon: 'user', match: '/settings|/certificates|/record' }
	],
	tutor: [
		{ href: '/earn', label: 'Earn', icon: 'coins' },
		{ href: '/requests', label: 'Requests', icon: 'inbox', match: '/requests|/sessions' },
		{ href: '/studio', label: 'Studio', icon: 'pen' },
		{ href: '/wallet', label: 'Wallet', icon: 'wallet', match: '/wallet|/payouts' },
		{ href: '/settings', label: 'Me', icon: 'user' }
	],
	creator: [
		{ href: '/studio', label: 'Studio', icon: 'pen' },
		{ href: '/packs', label: 'Packs', icon: 'book' },
		{ href: '/tasks', label: 'Tasks', icon: 'kanban' },
		{ href: '/wallet', label: 'Wallet', icon: 'wallet' },
		{ href: '/settings', label: 'Me', icon: 'user' }
	],
	teamlead: [
		{ href: '/teams', label: 'Teams', icon: 'users' },
		{ href: '/contracts', label: 'Contracts', icon: 'file' },
		{ href: '/tasks', label: 'Tasks', icon: 'kanban' },
		{ href: '/wallet', label: 'Wallet', icon: 'wallet' },
		{ href: '/settings', label: 'Me', icon: 'user' }
	],
	ambassador: [
		{ href: '/referrals', label: 'Referrals', icon: 'megaphone' },
		{ href: '/earn', label: 'Earn', icon: 'coins' },
		{ href: '/wallet', label: 'Wallet', icon: 'wallet' },
		{ href: '/record', label: 'Record', icon: 'badge' },
		{ href: '/settings', label: 'Me', icon: 'user' }
	],
	guardian: [
		{ href: '/family', label: 'Family', icon: 'heart' },
		{ href: '/notifications', label: 'Alerts', icon: 'bell' },
		{ href: '/pricing', label: 'Plans', icon: 'card' },
		{ href: '/safety', label: 'Safety', icon: 'shield' },
		{ href: '/settings', label: 'Me', icon: 'user' }
	],
	instadmin: [
		{ href: '/inst/greenfield/overview', label: 'Overview', icon: 'chart' },
		{ href: '/inst/greenfield/learners', label: 'Learners', icon: 'users' },
		{ href: '/inst/greenfield/exams', label: 'Exams', icon: 'file' },
		{ href: '/inst/greenfield/invoices', label: 'Invoices', icon: 'receipt' },
		{ href: '/inst/greenfield/settings', label: 'Settings', icon: 'settings' }
	],
	staff: [
		{ href: '/ops', label: 'Ops', icon: 'activity' },
		{ href: '/ops/trust', label: 'Trust', icon: 'shield' },
		{ href: '/ops/payouts', label: 'Payouts', icon: 'bank' },
		{ href: '/ops/flags', label: 'Flags', icon: 'toggle' },
		{ href: '/ops/audit', label: 'Audit', icon: 'list' }
	]
};

export function sideNav(roles: Role[], active: Role, tenantId?: string): NavGroup[] {
	const g: NavGroup[] = [];
	if (active === 'staff') {
		g.push({ label: 'Operations', items: [
			{ href: '/ops', label: 'Overview', icon: 'activity' },
			{ href: '/ops/users', label: 'Users & roles', icon: 'users' },
			{ href: '/ops/trust', label: 'Trust & safety', icon: 'shield' },
			{ href: '/ops/payouts', label: 'Payouts', icon: 'bank' },
			{ href: '/ops/reconciliation', label: 'Reconciliation', icon: 'scale' },
			{ href: '/ops/content', label: 'Content & Studio', icon: 'layers' },
			{ href: '/ops/flags', label: 'Feature flags', icon: 'toggle' },
			{ href: '/ops/audit', label: 'Audit log', icon: 'list' },
			{ href: '/ops/support', label: 'Support', icon: 'headset' },
			{ href: '/ops/ui', label: 'Design system', icon: 'grid' }
		] });
		return g;
	}
	if (active === 'instadmin') {
		const t = tenantId ?? 'greenfield';
		g.push({ label: 'Institution', items: [
			{ href: `/inst/${t}/overview`, label: 'Overview', icon: 'chart' },
			{ href: `/inst/${t}/learners`, label: 'Learners & seats', icon: 'users' },
			{ href: `/inst/${t}/exams`, label: 'Hosted exams', icon: 'file', match: `/inst/${t}/exams` },
			{ href: `/inst/${t}/contracts`, label: 'Tutor contracts', icon: 'handoff' },
			{ href: `/inst/${t}/invoices`, label: 'Invoices', icon: 'receipt' },
			{ href: `/inst/${t}/branding`, label: 'Branding', icon: 'sparkles' },
			{ href: `/inst/${t}/settings`, label: 'Settings', icon: 'settings' }
		] });
		g.push({ label: 'Marketplace', items: [{ href: '/contracts', label: 'Contracts board', icon: 'file' }, { href: '/tutors', label: 'Find tutor teams', icon: 'users' }] });
		return g;
	}
	if (active === 'guardian') {
		g.push({ label: 'Family', items: [{ href: '/family', label: 'Overview', icon: 'heart', match: '/family' }, { href: '/notifications', label: 'Notifications', icon: 'bell' }, { href: '/threads', label: 'Session threads', icon: 'message' }] });
		g.push({ label: 'Help', items: [{ href: '/safety', label: 'Safety', icon: 'shield' }, { href: '/pricing', label: 'Plans', icon: 'card' }] });
		return g;
	}
	if (roles.includes('learner')) g.push({ label: 'Learn', items: [
		{ href: '/home', label: 'Today', icon: 'home' },
		{ href: '/practice', label: 'Practice & mocks', icon: 'target', match: '/practice|/attempt' },
		{ href: '/review', label: 'Review queue', icon: 'refresh' },
		{ href: '/plan', label: 'Study plan', icon: 'calendar' },
		{ href: '/book', label: 'Find help', icon: 'lifebuoy' },
		{ href: '/sessions', label: 'My sessions', icon: 'video', match: '/sessions' },
		{ href: '/cohorts', label: 'Cohorts', icon: 'users' },
		{ href: '/library', label: 'Library', icon: 'book' },
		{ href: '/certificates', label: 'Certificates', icon: 'badge' }
	] });
	const earn: NavItem[] = [];
	if (roles.some((r) => ['tutor', 'creator', 'teamlead', 'ambassador'].includes(r))) earn.push({ href: '/earn', label: 'Earnings', icon: 'coins' });
	if (roles.includes('tutor')) earn.push({ href: '/requests', label: 'Requests', icon: 'inbox' }, { href: '/offers', label: 'My offers', icon: 'layers' });
	if (roles.includes('creator')) earn.push({ href: '/studio', label: 'Studio', icon: 'pen' }, { href: '/packs', label: 'My packs', icon: 'book' });
	if (roles.includes('ambassador')) earn.push({ href: '/referrals', label: 'Referrals', icon: 'megaphone' });
	if (earn.length) earn.push({ href: '/wallet', label: 'Wallet', icon: 'wallet', match: '/wallet|/payouts' }, { href: '/record', label: 'Hive Record', icon: 'badge' });
	if (earn.length) g.push({ label: 'Earn', items: earn });
	if (roles.some((r) => ['tutor', 'creator', 'teamlead'].includes(r))) g.push({ label: 'Collaborate', items: [
		{ href: '/teams', label: 'Teams', icon: 'users', match: '/teams' },
		{ href: '/contracts', label: 'Contracts', icon: 'file', match: '/contracts' },
		{ href: '/tasks', label: 'Task board', icon: 'kanban' },
		{ href: '/threads', label: 'Threads', icon: 'message', match: '/threads' }
	] });
	if (roles.includes('tutor') || roles.includes('learner')) g.push({ label: 'Skills', items: [{ href: '/skills/hub', label: 'Hive Skills', icon: 'leaf' }] });
	return g;
}

export const ROLE_LABEL: Record<Role, string> = { learner: 'Learner', guardian: 'Guardian', tutor: 'Tutor', creator: 'Creator', teamlead: 'Team lead', ambassador: 'Ambassador', instadmin: 'Institution admin', staff: 'Operations' };
export const ROLE_HOME: Record<Role, string> = { learner: '/home', guardian: '/family', tutor: '/earn', creator: '/studio', teamlead: '/teams', ambassador: '/referrals', instadmin: '/inst/greenfield/overview', staff: '/ops' };
