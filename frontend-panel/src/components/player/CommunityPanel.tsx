import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/icon";

export type Community = {
	updatedAt: string;
	servers: {
		id: string;
		name: string;
		description: string;
		minecraftVersion: string;
		packVersion: string;
		mods: { name: string; version: string }[];
		status: { state: "online" | "unavailable"; online?: number; max?: number };
	}[];
	downloads: { platform: string; version: string; url: string }[];
};

export function CommunityPanel({
	showDownloads = true,
	url = "/community.json",
}: {
	showDownloads?: boolean;
	url?: string;
}) {
	const { t } = useTranslation();
	const [data, setData] = useState<Community | null>(null);
	const [failed, setFailed] = useState(false);
	const [retry, setRetry] = useState(0);
	// biome-ignore lint/correctness/useExhaustiveDependencies: Retry explicitly restarts polling after a failed request.
	useEffect(() => {
		const controller = new AbortController();
		let timer: ReturnType<typeof setTimeout>;
		async function update() {
			try {
				const response = await fetch(url, {
					signal: controller.signal,
					cache: "no-store",
				});
				if (!response.ok) throw new Error("Unavailable");
				const next = (await response.json()) as Community;
				if (!Array.isArray(next.servers) || !Array.isArray(next.downloads))
					throw new Error("Invalid catalog");
				setData(next);
				setFailed(false);
			} catch {
				if (!controller.signal.aborted) setFailed(true);
			}
			if (!controller.signal.aborted) timer = setTimeout(update, 30000);
		}
		void update();
		return () => {
			controller.abort();
			clearTimeout(timer);
		};
	}, [retry, url]);
	return (
		<section className="player-community" aria-labelledby="community-title">
			<div className="player-section-heading">
				<div>
					<h2 id="community-title">{t("player.servers")}</h2>
				</div>
			</div>
			{failed && (
				<div role="status" className="player-notice">
					{t("player.statusUnavailable")}{" "}
					<button type="button" onClick={() => setRetry((r) => r + 1)}>
						{t("player.retry")}
					</button>
				</div>
			)}
			{!data && !failed && (
				<p role="status" className="player-loading">
					{t("player.loading")}
				</p>
			)}
			{data?.servers.length === 0 && (
				<p className="player-loading">{t("player.emptyServers")}</p>
			)}
			{data?.servers.map((server) => (
				<article className="player-server" key={server.id}>
					<div className="player-server-heading">
						<div className="player-server-symbol">
							<Icon name="Wrench" className="size-6" />
						</div>
						<div className="min-w-0 flex-1">
							<h3>{server.name}</h3>
							<p className="player-muted">
								Minecraft {server.minecraftVersion} · {t("player.pack")}{" "}
								{server.packVersion}
							</p>
						</div>
						<span
							className={`player-status ${!failed && server.status.state === "online" ? "is-online" : ""}`}
						>
							<i />
							{!failed && server.status.state === "online"
								? t("player.online", {
										count: server.status.online,
										max: server.status.max,
									})
								: t("player.unknown")}
						</span>
					</div>
					<p className="player-server-description">{server.description}</p>
					<details className="player-mods">
						<summary>
							{t("player.mods", { count: server.mods.length })}
							<Icon name="CaretDown" className="size-4" />
						</summary>
						<ul>
							{server.mods.map((mod) => (
								<li key={`${mod.name}:${mod.version}`}>
									<span>{mod.name}</span>
									<span>{mod.version}</span>
								</li>
							))}
						</ul>
						<p className="player-muted text-xs">{t("player.modsHint")}</p>
					</details>
				</article>
			))}
			{showDownloads && (
				<div className="player-downloads">
					<div>
						<h3>{t("player.launcher")}</h3>
						<p className="player-muted">{t("player.launcherHint")}</p>
					</div>
					<div className="flex flex-wrap gap-2">
						{data?.downloads
							.filter((d) => /^\/download\/(windows|linux|macos)$/.test(d.url))
							.map((d) => (
								<a
									className="player-button player-button-secondary"
									key={d.platform}
									href={d.url}
								>
									<Icon name="Download" className="size-4" />
									{d.platform}
									<span className="player-muted text-xs">{d.version}</span>
								</a>
							))}
					</div>
				</div>
			)}
		</section>
	);
}
