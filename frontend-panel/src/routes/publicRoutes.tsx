import type { ReactNode } from "react";
import { Navigate, type RouteObject } from "react-router-dom";
import { lazyWithPreload } from "@/lib/lazyWithPreload";
import { publicPaths } from "@/routes/routePaths";
import { publicElement } from "@/routes/routeSuspense";
import { useAuthStore } from "@/stores/authStore";

const DeviceLoginPage = lazyWithPreload(
	() => import("@/pages/DeviceLoginPage"),
);
const PublicConnectPage = lazyWithPreload(
	() => import("@/pages/PublicConnectPage"),
);
const PublicTextureLibraryPage = lazyWithPreload(
	() => import("@/pages/PublicTextureLibraryPage"),
);
const PublicTextureDetailPage = lazyWithPreload(
	() => import("@/pages/PublicTextureDetailPage"),
);
const TermsPage = lazyWithPreload(() => import("@/pages/TermsPage"));
const PrivacyPage = lazyWithPreload(() => import("@/pages/PrivacyPage"));

function AdminLibrary({ children }: { children: ReactNode }) {
	const admin = useAuthStore((s) => s.user?.role === "admin");
	return admin ? children : <Navigate to="/" replace />;
}

export const publicRoutes = [
	{ path: publicPaths.device, element: publicElement(<DeviceLoginPage />) },
	{
		path: publicPaths.home,
		element: publicElement(<PublicConnectPage />),
	},
	{
		path: publicPaths.textureLibrary,
		element: publicElement(
			<AdminLibrary>
				<PublicTextureLibraryPage />
			</AdminLibrary>,
		),
	},
	{
		path: publicPaths.textureLibraryDetail,
		element: publicElement(
			<AdminLibrary>
				<PublicTextureDetailPage />
			</AdminLibrary>,
		),
	},
	{
		path: publicPaths.tos,
		element: publicElement(<TermsPage />),
	},
	{
		path: publicPaths.privacy,
		element: publicElement(<PrivacyPage />),
	},
] satisfies RouteObject[];
