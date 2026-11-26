import { useList } from "@refinedev/core";
import { useDeferredValue, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { AdminSurface } from "@/components/layout/AdminSurface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminUserPath } from "@/routes/routePaths";
import type { WorldRecord } from "@/services/worldAdmin";
import type { AdminUserInfo } from "@/types/api";

export function WorldActivities({ userId }: { userId?: number }) {
	const { t } = useTranslation();
	const { result, query } = useList<WorldRecord>({
		resource: userId ? "player-worlds" : "world-inbox",
		meta: { userId },
		pagination: { mode: "off" },
		queryOptions: { retry: false, staleTime: 15000 },
	});
	return (
		<AdminSurface className="workspace-list">
			<h2>{t(userId ? "workspace.playerWorlds" : "workspace.inbox")}</h2>
			{query.isLoading ? (
				<p role="status">{t("common.loading")}</p>
			) : query.isError ? (
				<div role="status">
					<p>{t("workspace.worldError")}</p>
					<Button variant="outline" onClick={() => void query.refetch()}>
						{t("common.refresh")}
					</Button>
				</div>
			) : result.data.length ? (
				<ul>
					{result.data.map((row) => (
						<li key={row.id}>
							<a href={row.href}>
								<span>
									<strong>{row.name}</strong>
									<small>
										{t(
											row.kind === "trip"
												? "workspace.trip"
												: "workspace.access",
										)}
										{row.scope
											? " · " +
												t(
													row.scope === "world"
														? "workspace.world"
														: "workspace.parcel",
												)
											: ""}
									</small>
								</span>
								<span>
									{t(`workspace.states.${row.state}`, {
										defaultValue: row.state,
									})}{" "}
									→
								</span>
							</a>
						</li>
					))}
				</ul>
			) : (
				<p>{t(userId ? "workspace.noTrips" : "workspace.clear")}</p>
			)}
		</AdminSurface>
	);
}
export function PlayerLookup() {
	const { t } = useTranslation();
	const [text, setText] = useState("");
	const keyword = useDeferredValue(text.trim());
	const { result, query } = useList<AdminUserInfo>({
		resource: "players",
		meta: { keyword },
		pagination: { mode: "off" },
		queryOptions: { retry: false, enabled: keyword.length > 0 },
	});
	return (
		<AdminSurface className="workspace-list">
			<h2>{t("workspace.findPlayer")}</h2>
			<Input
				type="search"
				aria-label={t("workspace.findPlayer")}
				placeholder={t("workspace.nickname")}
				value={text}
				onChange={(e) => setText(e.target.value)}
			/>
			{keyword &&
				(query.isError ? (
					<p role="status">{t("workspace.searchError")}</p>
				) : query.isLoading ? (
					<p role="status">{t("common.loading")}</p>
				) : result.data.length ? (
					<ul>
						{result.data.map((p) => (
							<li key={p.id}>
								<Link to={adminUserPath(p.id)}>
									{p.username}
									<span>→</span>
								</Link>
							</li>
						))}
					</ul>
				) : (
					<p>{t("workspace.noPlayers")}</p>
				))}
		</AdminSurface>
	);
}
