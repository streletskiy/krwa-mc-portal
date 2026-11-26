import { type ReactNode, Suspense, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { AuthUserMenu } from "@/components/common/AuthUserMenu";
import { LanguageMenu } from "@/components/common/LanguageMenu";
import { BrandMark } from "@/components/layout/BrandMark";
import { ThemeToggleButton } from "@/components/layout/ThemeToggleButton";
import { readStorageItem, STORAGE_KEYS } from "@/lib/storage";
import { accountPaths, publicPaths } from "@/routes/routePaths";
import { useAuthStore } from "@/stores/authStore";
import { useFrontendConfigStore } from "@/stores/frontendConfigStore";
import { useThemeStore } from "@/stores/themeStore";
import "./player.css";

export function PlayerFrame({
	children,
	account = false,
}: {
	children: ReactNode;
	account?: boolean;
}) {
	const { t } = useTranslation();
	const branding = useFrontendConfigStore((state) => state.branding);
	const user = useAuthStore((s) => s.user);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const logout = useAuthStore((s) => s.logout);
	const navigate = useNavigate();
	useEffect(() => {
		if (!readStorageItem("local", STORAGE_KEYS.themeMode))
			useThemeStore.getState().setMode("dark");
	}, []);
	return (
		<div className="player-shell" data-theme-surface="public-shell">
			<header className="player-header" data-theme-surface="chrome">
				<Link to="/" className="player-brand" aria-label={branding.title}>
					<BrandMark branding={branding} className="portal-icon" />
					{!(branding.wordmarkDarkUrl || branding.wordmarkLightUrl) && (
						<span className="truncate">{branding.title}</span>
					)}
				</Link>
				<div className="flex items-center gap-2">
					<ThemeToggleButton />
					<LanguageMenu compactOnMobile />
					{isAuthenticated && user ? (
						<AuthUserMenu
							user={user}
							scope={account ? "account" : "public"}
							onLogout={() => void logout().then(() => navigate("/"))}
						/>
					) : (
						<Link
							className="player-button player-button-secondary"
							to={publicPaths.login}
						>
							{t("player.signIn")}
						</Link>
					)}
				</div>
			</header>

			{account && (
				<nav
					aria-label={t("nav.account")}
					className="player-nav account-navigation"
				>
					{[
						[accountPaths.home, "nav.account"],
						[accountPaths.profiles, "nav.profiles"],
						[accountPaths.wardrobe, "nav.wardrobe"],
						[accountPaths.audit, "nav.accountAudit"],
						[accountPaths.settings, "nav.personalSettings"],
					].map(([to, label]) => (
						<NavLink key={to} to={to} end>
							{t(label)}
						</NavLink>
					))}
				</nav>
			)}
			<div
				className={
					account ? "player-content account-content" : "player-content"
				}
			>
				{children}
			</div>
			<footer className="player-footer">
				<span>
					{branding.title} · {t("player.footer")}
				</span>
				<div>
					<Link to={publicPaths.tos}>{t("nav.tos")}</Link>
					<Link to={publicPaths.privacy}>{t("nav.privacy")}</Link>
				</div>
			</footer>
		</div>
	);
}

export function PlayerShell() {
	return (
		<PlayerFrame account>
			<Suspense
				fallback={
					<div className="player-loading" role="status">
						…
					</div>
				}
			>
				<Outlet />
			</Suspense>
		</PlayerFrame>
	);
}
