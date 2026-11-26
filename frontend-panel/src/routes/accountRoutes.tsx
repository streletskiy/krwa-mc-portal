import { Navigate, type RouteObject } from "react-router-dom";
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

function AdvancedWardrobe() {
	const admin = useAuthStore((s) => s.user?.role === "admin");
	return admin ? (
		<TextureWardrobePage />
	) : (
		<Navigate to={accountPaths.profiles} replace />
	);
}

export const accountRoutes = [
	{
		element: <PlayerShell />,
		children: [
			{ path: accountPaths.home, element: <AccountOverviewPage /> },
			{ path: accountPaths.profiles, element: <AccountOverviewPage /> },
			{ path: accountPaths.wardrobe, element: <AdvancedWardrobe /> },
			{ path: accountPaths.audit, element: <AccountAuditPage /> },
			{ path: accountPaths.settings, element: <AccountOverviewPage /> },
			{
				path: accountPaths.settingsSecurityCompat,
				element: <AccountOverviewPage />,
			},
		],
	},
] satisfies RouteObject[];
