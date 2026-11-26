import type { IconName } from "@/components/ui/icon";
import { hasOperatorScope } from "@/lib/operatorScopes";
import { portalUrl } from "@/lib/portalLinks";
import { accountPaths, adminPaths, publicPaths } from "@/routes/routePaths";
import type { OperatorScope } from "@/types/api";

export type ShellScope = "account" | "admin";

export type ShellNavItem = {
	to: string;
	labelKey: string;
	icon: IconName;
	end?: boolean;
	reloadDocument?: boolean;
	operatorScope?: OperatorScope;
	preload?: () => Promise<unknown>;
};

export type ShellNavSection = {
	id: "account" | "admin" | "operations" | "system";
	labelKey: string;
	items: ShellNavItem[];
};

export const accountNavItems: ShellNavItem[] = [
	{
		to: accountPaths.home,
		labelKey: "nav.account",
		icon: "Gauge",
		end: true,
		preload: () => import("@/pages/account/AccountOverviewPage"),
	},
	{
		to: accountPaths.profiles,
		labelKey: "nav.profiles",
		icon: "User",
		preload: () => import("@/pages/account/MinecraftProfilesPage"),
	},
	{
		to: accountPaths.wardrobe,
		labelKey: "nav.wardrobe",
		icon: "FileImage",
		preload: () => import("@/pages/account/TextureWardrobePage"),
	},
	{
		to: publicPaths.textureLibrary,
		labelKey: "nav.textureLibrary",
		icon: "Images",
		preload: () => import("@/pages/PublicTextureLibraryPage"),
	},
	{
		to: accountPaths.audit,
		labelKey: "nav.accountAudit",
		icon: "ClipboardText",
		preload: () => import("@/pages/account/AccountAuditPage"),
	},
];

export const personalSettingsNavItem: ShellNavItem = {
	to: accountPaths.settings,
	labelKey: "nav.personalSettings",
	icon: "Gear",
	preload: () => import("@/pages/account/AccountSettingsPage"),
};

export const adminNavItems: ShellNavItem[] = [
	{
		to: adminPaths.overview,
		labelKey: "admin.nav.overview",
		icon: "Gauge",
		end: true,
		operatorScope: "overview",
		preload: () => import("@/pages/admin/AdminOverviewPage"),
	},
	{
		to: adminPaths.users,
		labelKey: "admin.nav.users",
		icon: "User",
		operatorScope: "users",
		preload: () => import("@/pages/admin/AdminUsersPage"),
	},
	{
		to: adminPaths.externalAuth,
		labelKey: "admin.nav.externalAuth",
		icon: "SignIn",
		operatorScope: "external_auth",
		preload: () => import("@/pages/admin/AdminExternalAuthPage"),
	},
	{
		to: adminPaths.yggdrasilForwarding,
		labelKey: "admin.nav.yggdrasilForwarding",
		icon: "Shuffle",
		operatorScope: "settings",
		preload: () => import("@/pages/admin/AdminYggdrasilForwardingPage"),
	},
	{
		to: adminPaths.textureLibrary,
		labelKey: "admin.nav.textureLibrary",
		icon: "Images",
		operatorScope: "texture_library",
		preload: () => import("@/pages/admin/AdminTextureLibraryTexturesPage"),
	},
	{
		to: adminPaths.audit,
		labelKey: "admin.nav.audit",
		icon: "ClipboardText",
		operatorScope: "audit",
		preload: () => import("@/pages/admin/AdminAuditPage"),
	},
	{
		to: adminPaths.tasks,
		labelKey: "admin.nav.tasks",
		icon: "Queue",
		operatorScope: "tasks",
		preload: () => import("@/pages/admin/AdminTasksPage"),
	},
	{
		to: adminPaths.settings,
		labelKey: "admin.nav.settings",
		icon: "Gear",
		operatorScope: "settings",
		preload: () => import("@/pages/admin/AdminSettingsPage"),
	},
	{
		to: adminPaths.about,
		labelKey: "admin.nav.about",
		icon: "Info",
		operatorScope: "overview",
		preload: () => import("@/pages/admin/AdminAboutPage"),
	},
];

export function getShellNavSections({
	isAdmin,
	adminWorkspace = false,
	operatorScopes,
	textureLibraryEnabled = true,
}: {
	isAdmin: boolean;
	adminWorkspace?: boolean;
	operatorScopes: readonly OperatorScope[];
	textureLibraryEnabled?: boolean;
}): ShellNavSection[] {
	const visibleAccountItems = accountNavItems.filter(
		(item) => item.to !== publicPaths.textureLibrary || textureLibraryEnabled,
	);
	const sections: ShellNavSection[] = [
		{
			id: "account",
			labelKey: "shell.sections.account",
			items: [...visibleAccountItems, personalSettingsNavItem],
		},
	];

	const visibleAdminItems = adminNavItems.filter(
		(item) =>
			isAdmin ||
			(item.operatorScope &&
				hasOperatorScope(operatorScopes, item.operatorScope)),
	);
	const worldAdminUrl = isAdmin && portalUrl("world-admin-url");
	if (worldAdminUrl) {
		visibleAdminItems.splice(1, 0, {
			to: worldAdminUrl,
			labelKey: "admin.overview.quick.offlineWorlds",
			icon: "ClipboardText",
			reloadDocument: true,
		});
	}

	if (visibleAdminItems.length > 0) {
		if (adminWorkspace) {
			const operations = new Set([
				adminPaths.audit,
				adminPaths.tasks,
			] as string[]);
			const system = new Set([
				adminPaths.settings,
				adminPaths.about,
				adminPaths.externalAuth,
				adminPaths.yggdrasilForwarding,
			] as string[]);
			const groups: ShellNavSection[] = [
				{
					id: "admin",
					labelKey: "shell.sections.admin",
					items: visibleAdminItems.filter(
						(item) => !operations.has(item.to) && !system.has(item.to),
					),
				},
				{
					id: "operations",
					labelKey: "workspace.operations",
					items: visibleAdminItems.filter((item) => operations.has(item.to)),
				},
				{
					id: "system",
					labelKey: "workspace.system",
					items: visibleAdminItems.filter((item) => system.has(item.to)),
				},
			];
			return [...groups.filter((group) => group.items.length), ...sections];
		}
		sections.push({
			id: "admin",
			labelKey: "shell.sections.admin",
			items: visibleAdminItems,
		});
	}

	return sections;
}
