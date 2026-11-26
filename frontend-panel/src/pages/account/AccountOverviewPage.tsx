import { useTranslation } from "react-i18next";
import { EmailSettings } from "@/components/player/EmailSettings";
import { PasswordSettings } from "@/components/player/PasswordSettings";
import { PlayerAvatar } from "@/components/player/PlayerAvatar";
import { usePageTitle } from "@/hooks/usePageTitle";
import PlayerCapePage from "@/pages/account/PlayerCapePage";
import PlayerSkinPage from "@/pages/account/PlayerSkinPage";
import { useAuthStore } from "@/stores/authStore";
export default function AccountOverviewPage() {
	const { t } = useTranslation();
	const user = useAuthStore((s) => s.user);
	usePageTitle(t("player.openAccount"));
	return (
		<section className="account-workspace py-8 sm:py-12">
			<header className="mb-8 flex items-center gap-4">
				<PlayerAvatar
					name={user?.username ?? "Player"}
					className="size-16 rounded-xl"
				/>
				<div>
					<h1 className="text-3xl font-semibold">{t("player.openAccount")}</h1>
					<p className="mt-1 text-muted-foreground">{user?.username}</p>
				</div>
			</header>
			<div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
				<div className="account-panel" data-theme-surface="panel">
					<PlayerSkinPage embedded />
					<PlayerCapePage />
				</div>
				<div className="account-panel grid gap-6" data-theme-surface="panel">
					<div>
						<h2 className="text-xl font-semibold">{t("player.security")}</h2>
						<p className="mt-2 text-sm text-muted-foreground">
							{t("simplePlayer.loginHint")}
						</p>
					</div>
					<PasswordSettings />
					<EmailSettings />
				</div>
			</div>
		</section>
	);
}
