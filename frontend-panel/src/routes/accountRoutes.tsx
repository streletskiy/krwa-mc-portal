import { useTranslation } from "react-i18next";
import type { RouteObject } from "react-router-dom";
import { PlayerShell } from "@/components/player/PlayerShell";
import { lazyWithPreload } from "@/lib/lazyWithPreload";
import { accountPaths } from "@/routes/routePaths";
import { useAuthStore } from "@/stores/authStore";

const AccountOverviewPage = lazyWithPreload(
	() => import("@/pages/account/AccountOverviewPage"),
);
const AccountAuditPage = lazyWithPreload(
	() => import("@/pages/account/AccountAuditPage"),
);
const TextureWardrobePage = lazyWithPreload(
	() => import("@/pages/account/TextureWardrobePage"),
);

const MinecraftProfilesPage = lazyWithPreload(
	() => import("@/pages/account/MinecraftProfilesPage"),
);
const AccountSettingsPage = lazyWithPreload(
	() => import("@/pages/account/AccountSettingsPage"),
);
const PlayerSkinPage = lazyWithPreload(
	() => import("@/pages/account/PlayerSkinPage"),
);
const PlayerCapePage = lazyWithPreload(
	() => import("@/pages/account/PlayerCapePage"),
);

function AccountProfiles() {
	const admin = useAuthStore((s) => s.isAdmin);
	return admin ? <MinecraftProfilesPage /> : <PlayerSkinPage />;
}
function AccountWardrobe() {
	const admin = useAuthStore((s) => s.isAdmin);
	const { t } = useTranslation();
	if (admin) return <TextureWardrobePage />;
	return (
		<section className="account-wardrobe py-8 sm:py-12">
			<h1 className="text-3xl font-semibold">{t("nav.wardrobe")}</h1>
			<div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
				<div className="account-panel" data-theme-surface="panel">
					<PlayerSkinPage embedded />
				</div>
				<div className="account-panel" data-theme-surface="panel">
					<PlayerCapePage />
				</div>
			</div>
		</section>
	);
}
export const accountRoutes = [
	{
		element: <PlayerShell />,
		children: [
			{ path: accountPaths.home, element: <AccountOverviewPage /> },
			{ path: accountPaths.profiles, element: <AccountProfiles /> },
			{ path: accountPaths.wardrobe, element: <AccountWardrobe /> },
			{ path: accountPaths.audit, element: <AccountAuditPage /> },
			{ path: accountPaths.settings, element: <AccountSettingsPage /> },
			{
				path: accountPaths.settingsSecurityCompat,
				element: <AccountSettingsPage />,
			},
		],
	},
] satisfies RouteObject[];
