import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePlayerSkin } from "@/components/player/PlayerAvatar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { TextureLibraryTextureAvatar } from "@/components/yggdrasil/TextureLibraryTextureAvatar";
import { cn } from "@/lib/utils";
import { formatUnknownError } from "@/services/http";
import { yggdrasilService } from "@/services/yggdrasilService";
import type {
	MinecraftTextureMetadata,
	MinecraftWardrobeTextureMetadata,
	YggdrasilProfile,
} from "@/types/api";

export default function PlayerCapePage() {
	const { t } = useTranslation();
	const [profile, setProfile] = useState<YggdrasilProfile | null>(null);
	const [capes, setCapes] = useState<MinecraftWardrobeTextureMetadata[]>([]);
	const [activeCape, setActiveCape] = useState<MinecraftTextureMetadata | null>(
		null,
	);
	const [loading, setLoading] = useState(true);
	const [busyId, setBusyId] = useState<number | "off" | null>(null);
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");

	const reload = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const profiles = await yggdrasilService.listProfiles();
			if (profiles.total !== 1 || profiles.items.length !== 1) {
				setProfile(null);
				setCapes([]);
				setError(t("simplePlayer.characterUnavailable"));
				return;
			}
			const current = profiles.items[0];
			const [wardrobe, textures] = await Promise.all([
				yggdrasilService.listWardrobeTextures({
					limit: 100,
					texture_type: "cape",
				}),
				yggdrasilService.listProfileTextures(current.id),
			]);
			setProfile(current);
			setCapes(wardrobe.items);
			const currentCape =
				textures.find(
					(texture) =>
						texture.texture_type === "cape" && texture.source === "bound",
				) ?? null;
			setActiveCape(currentCape);
			usePlayerSkin.getState().setCapeUrl(currentCape?.url ?? null);
		} catch (e) {
			setError(formatUnknownError(e));
		} finally {
			setLoading(false);
		}
	}, [t]);

	useEffect(() => {
		void reload();
	}, [reload]);

	async function applyCape(cape: MinecraftWardrobeTextureMetadata) {
		if (!profile || busyId !== null) return;
		setBusyId(cape.id);
		setError("");
		setNotice("");
		try {
			const applied = await yggdrasilService.bindProfileTexture({
				uuid: profile.id,
				textureType: "cape",
				textureId: cape.id,
			});
			setActiveCape(applied);
			usePlayerSkin.getState().setCapeUrl(applied.url);
			setNotice(t("simplePlayer.capeApplied"));
		} catch (e) {
			setError(formatUnknownError(e));
		} finally {
			setBusyId(null);
		}
	}

	async function disableCape() {
		if (!profile || busyId !== null) return;
		setBusyId("off");
		setError("");
		setNotice("");
		try {
			await yggdrasilService.unbindProfileTexture({
				uuid: profile.id,
				textureType: "cape",
			});
			setActiveCape(null);
			usePlayerSkin.getState().setCapeUrl(null);
			setNotice(t("simplePlayer.capeDisabled"));
		} catch (e) {
			setError(formatUnknownError(e));
		} finally {
			setBusyId(null);
		}
	}

	return (
		<section className="mt-8 border-t border-border/70 pt-8 dark:border-white/10">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h2 className="text-xl font-semibold">{t("simplePlayer.capes")}</h2>
					<p className="mt-2 text-sm text-muted-foreground">
						{t("simplePlayer.capesHint")}
					</p>
				</div>
				{activeCape ? (
					<Button
						type="button"
						variant="outline"
						disabled={busyId !== null}
						onClick={() => void disableCape()}
					>
						<Icon
							name={busyId === "off" ? "Spinner" : "EyeSlash"}
							className={busyId === "off" ? "size-4 animate-spin" : "size-4"}
						/>
						{t("simplePlayer.disableCape")}
					</Button>
				) : null}
			</div>

			{loading ? (
				<p role="status" className="mt-6 text-sm text-muted-foreground">
					{t("common.loading")}
				</p>
			) : capes.length === 0 ? (
				<div className="mt-6 rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
					{t("simplePlayer.noCapes")}
				</div>
			) : (
				<div data-testid="player-cape-list" className="mt-6 grid gap-3">
					{capes.map((cape) => {
						const active = activeCape?.texture_id === cape.id;
						return (
							<div
								key={cape.id}
								data-active={active ? "true" : "false"}
								className={cn(
									"flex min-w-0 items-center gap-3 rounded-lg border border-border/70 p-3 transition-colors dark:border-white/10",
									active &&
										"border-primary/60 bg-primary/5 ring-1 ring-primary/20 dark:border-primary/60",
								)}
							>
								<TextureLibraryTextureAvatar
									texture={cape}
									className="size-14"
								/>
								<div className="min-w-0 flex-1">
									<p className="truncate font-medium">
										{cape.display_name ?? cape.name}
									</p>
									<p
										className={cn(
											"mt-1 flex items-center gap-1 text-xs text-muted-foreground",
											active && "font-medium text-primary",
										)}
									>
										{active ? <Icon name="Check" className="size-3.5" /> : null}
										{active
											? t("simplePlayer.capeActive")
											: t("simplePlayer.capeAvailable")}
									</p>
								</div>
								<Button
									type="button"
									size="sm"
									variant={active ? "secondary" : "outline"}
									disabled={active || busyId !== null}
									onClick={() => void applyCape(cape)}
								>
									{busyId === cape.id ? (
										<Icon name="Spinner" className="size-4 animate-spin" />
									) : null}
									{t(
										active
											? "simplePlayer.selectedCape"
											: "simplePlayer.selectCape",
									)}
								</Button>
							</div>
						);
					})}
				</div>
			)}
			{error ? (
				<p role="alert" className="mt-4 text-sm text-destructive">
					{error}
				</p>
			) : null}
			{notice ? (
				<p role="status" className="mt-4 text-sm text-primary">
					{notice}
				</p>
			) : null}
		</section>
	);
}
