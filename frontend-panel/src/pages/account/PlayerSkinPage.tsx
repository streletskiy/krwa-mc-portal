import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { inferModelType } from "skinview-utils";
import { usePlayerSkin } from "@/components/player/PlayerAvatar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { MinecraftPreviewPanel } from "@/components/yggdrasil/MinecraftPreviewPanel";
import { usePageTitle } from "@/hooks/usePageTitle";
import { validateMinecraftTextureFile } from "@/lib/minecraftTextureValidation";
import { api, formatUnknownError } from "@/services/http";
import { yggdrasilService } from "@/services/yggdrasilService";
import { useFrontendConfigStore } from "@/stores/frontendConfigStore";
import type { MinecraftTextureMetadata, YggdrasilProfile } from "@/types/api";

export default function PlayerSkinPage({
	embedded = false,
}: {
	embedded?: boolean;
}) {
	const { t } = useTranslation();
	const policy = useFrontendConfigStore((s) => s.yggdrasil);
	const capeUrl = usePlayerSkin((s) => s.capeUrl);
	const [profile, setProfile] = useState<YggdrasilProfile | null>(null);
	const [skin, setSkin] = useState<MinecraftTextureMetadata | null>(null);
	const [loading, setLoading] = useState(true);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");
	const fileInput = useRef<HTMLInputElement>(null);
	const lock = useRef(false);
	usePageTitle(t(embedded ? "player.openAccount" : "player.skin"));
	const reload = useCallback(async () => {
		setLoading(true);
		setError("");
		setProfile(null);
		try {
			const page = await yggdrasilService.listProfiles();
			if (page.total !== 1 || page.items.length !== 1) {
				setError(t("simplePlayer.characterUnavailable"));
				return;
			}
			const current = page.items[0];
			const textures = await yggdrasilService.listProfileTextures(current.id);
			const currentSkin =
				textures.find((v) => v.texture_type === "skin") ?? null;
			const currentCape =
				textures.find((v) => v.texture_type === "cape") ?? null;
			setSkin(currentSkin);
			const appearance = usePlayerSkin.getState();
			appearance.setUrl(currentSkin?.url ?? null);
			appearance.setCapeUrl(currentCape?.url ?? null);
			setProfile(current);
		} catch (e) {
			setError(formatUnknownError(e));
		} finally {
			setLoading(false);
		}
	}, [t]);
	useEffect(() => {
		void reload();
	}, [reload]);
	async function upload(file: File | undefined) {
		if (!file || !profile || lock.current) return;
		lock.current = true;
		setBusy(true);
		setError("");
		setNotice("");
		let image: ImageBitmap | undefined;
		try {
			const valid = await validateMinecraftTextureFile(file, "skin", policy);
			if (!valid.ok) {
				setError(t(valid.key, valid.values));
				return;
			}
			image = await createImageBitmap(file);
			const canvas = document.createElement("canvas");
			canvas.width = image.width;
			canvas.height = image.height;
			canvas.getContext("2d")?.drawImage(image, 0, 0);
			const model =
				image.width === image.height * 2 ? "default" : inferModelType(canvas);
			const form = new FormData();
			form.append("model", model === "slim" ? "slim" : "");
			form.append("file", file);
			const applied = await api.put<MinecraftTextureMetadata, FormData>(
				`/profiles/minecraft/${profile.id}/skin`,
				form,
			);
			setSkin(applied);
			usePlayerSkin.getState().setUrl(applied.url);
			setNotice(t("simplePlayer.applied"));
		} catch (e) {
			setError(formatUnknownError(e));
		} finally {
			image?.close();
			lock.current = false;
			setBusy(false);
			if (fileInput.current) fileInput.current.value = "";
		}
	}
	return (
		<section className={embedded ? "account-skin" : "py-8 sm:py-12"}>
			<h2 className="text-xl font-semibold">{t("player.skin")}</h2>
			<p hidden={embedded} className="mt-3 max-w-xl text-muted-foreground">
				{t("simplePlayer.intro")}
			</p>
			{loading ? (
				<p role="status" className="mt-8">
					{t("common.loading")}
				</p>
			) : (
				<div
					className={
						embedded
							? "mt-6 grid gap-6"
							: "mt-8 grid items-start gap-8 md:grid-cols-2"
					}
				>
					<div className="space-y-6">
						{profile && (
							<>
								<div hidden={embedded}>
									<p className="text-sm text-muted-foreground">
										{t("login.minecraftNickname")}
									</p>
									<p className="mt-1 break-words text-2xl font-semibold">
										{profile.name}
									</p>
									<p className="mt-2 text-sm text-muted-foreground">
										{t("simplePlayer.fixedName")}
									</p>
								</div>
								<input
									ref={fileInput}
									id="player-skin-file"
									type="file"
									accept="image/png,.png"
									className="sr-only"
									disabled={busy}
									aria-label={t("player.uploadSkin")}
									onChange={(e) => void upload(e.currentTarget.files?.[0])}
								/>
								<Button
									disabled={busy}
									onClick={() => fileInput.current?.click()}
								>
									<Icon
										name={busy ? "Spinner" : "Upload"}
										className={busy ? "size-4 animate-spin" : "size-4"}
									/>
									{t(busy ? "simplePlayer.uploading" : "player.uploadSkin")}
								</Button>
								<p className="max-w-md text-sm text-muted-foreground">
									{t("simplePlayer.fileHint")}
								</p>
							</>
						)}
						{error && (
							<div role="alert" className="space-y-3">
								<p className="text-destructive">{error}</p>
								{!profile && (
									<Button variant="outline" onClick={() => void reload()}>
										{t("common.refresh")}
									</Button>
								)}
							</div>
						)}
						{notice && (
							<p role="status" className="text-primary">
								{notice}
							</p>
						)}
					</div>
					{profile && (
						<MinecraftPreviewPanel
							label={t("simplePlayer.characterPreview")}
							hideIdentity={embedded}
							frameClassName={embedded ? "h-[20rem]" : undefined}
							playerName={profile.name}
							skinUrl={skin?.url}
							previewUrl={skin?.preview_url}
							capeUrl={capeUrl ?? undefined}
							model={skin?.texture_model ?? "default"}
							idleLabel={t("profiles.motionIdle")}
							walkLabel={t("profiles.motionWalk")}
							emptyTitle={t("simplePlayer.defaultSkin")}
							emptyDescription={t("simplePlayer.defaultHint")}
							failedTitle={t("profiles.previewFailedTitle")}
							failedDescription={t("profiles.previewFailedDescription")}
						/>
					)}
				</div>
			)}
		</section>
	);
}
