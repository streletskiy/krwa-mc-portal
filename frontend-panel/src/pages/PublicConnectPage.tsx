import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { BrandMark } from "@/components/layout/BrandMark";
import { CommunityPanel } from "@/components/player/CommunityPanel";
import { PlayerFrame } from "@/components/player/PlayerShell";
import { Icon } from "@/components/ui/icon";
import { usePageTitle } from "@/hooks/usePageTitle";
import { usePublicSession } from "@/hooks/usePublicSession";
import { portalUrl } from "@/lib/portalLinks";
import { useFrontendConfigStore } from "@/stores/frontendConfigStore";
export default function PublicConnectPage() {
	const { t } = useTranslation();
	const { isAuthenticated: authenticated } = usePublicSession();
	const branding = useFrontendConfigStore((state) => state.branding);
	const downloads = portalUrl("download-base").replace(/\/$/, "");
	const community = portalUrl("community-url");
	usePageTitle();
	return (
		<PlayerFrame>
			<section className="player-hero">
				<div className="player-hero-copy">
					{(branding.wordmarkDarkUrl || branding.wordmarkLightUrl) && (
						<BrandMark
							branding={branding}
							wordmarkClassName="player-hero-wordmark"
						/>
					)}
					<h1>{t("player.headline")}</h1>
					<p>{t("player.intro")}</p>
					<div className="mt-6 flex flex-wrap gap-3">
						<Link
							className="player-button"
							to={authenticated ? "/account" : "/register"}
						>
							{t(authenticated ? "player.openAccount" : "player.createAccount")}
							<Icon name="ArrowRight" className="size-4" />
						</Link>
					</div>
					{downloads && (
						<div className="player-start-downloads" id="download">
							<h2>{t("player.download")}</h2>
							<div>
								<a className="player-platform" href={`${downloads}/windows`}>
									<Icon name="Download" className="size-5" />
									<strong>Windows</strong>
									<span>10 / 11 · x64</span>
								</a>
								<a className="player-platform" href={`${downloads}/linux`}>
									<Icon name="Download" className="size-5" />
									<strong>Linux</strong>
									<span>AppImage · x64</span>
								</a>
								<a className="player-platform" href={`${downloads}/linux-deb`}>
									<Icon name="Download" className="size-5" />
									<strong>Linux</strong>
									<span>DEB · Debian/Ubuntu x64</span>
								</a>
								<a className="player-platform" href={`${downloads}/linux-arch`}>
									<Icon name="Download" className="size-5" />
									<strong>Steam Deck / Arch Linux</strong>
									<span>Pacman · x64</span>
								</a>
								<a className="player-platform" href={`${downloads}/macos`}>
									<Icon name="Download" className="size-5" />
									<strong>macOS</strong>
									<span>Intel + Apple Silicon</span>
								</a>
							</div>
							<p className="player-download-hint">
								{t("player.steamDeckHint")}
							</p>
						</div>
					)}
				</div>
				<img
					className="player-hero-art"
					src={portalUrl("hero-url", "/static/images/home.webp")}
					alt=""
					width="1080"
					height="608"
					fetchPriority="high"
				/>
			</section>
			{community && <CommunityPanel url={community} showDownloads={false} />}
		</PlayerFrame>
	);
}
