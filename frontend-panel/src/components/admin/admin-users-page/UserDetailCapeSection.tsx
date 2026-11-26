import { type ReactNode, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { TextureLibraryTextureAvatar } from "@/components/yggdrasil/TextureLibraryTextureAvatar";
import { handleApiError } from "@/hooks/useApiError";
import {
	adminMinecraftProfileService,
	adminTextureLibraryService,
	adminUserService,
} from "@/services/adminService";
import type {
	MinecraftWardrobeTextureMetadata,
	PublicTextureLibraryTextureMetadata,
} from "@/types/api";
import type { UserMinecraftProfileItem } from "./UserDetailMinecraftSection";

export function UserDetailCapeSection({
	profiles,
	userId,
}: {
	profiles: UserMinecraftProfileItem[];
	userId: number;
}) {
	const { t } = useTranslation();
	const [granted, setGranted] = useState<MinecraftWardrobeTextureMetadata[]>(
		[],
	);
	const [library, setLibrary] = useState<PublicTextureLibraryTextureMetadata[]>(
		[],
	);
	const [activeTextureId, setActiveTextureId] = useState<number | null>(null);
	const [loading, setLoading] = useState(true);
	const [busyId, setBusyId] = useState<number | null>(null);

	const profileId = profiles[0]?.id ?? null;
	const reload = useCallback(async () => {
		setLoading(true);
		try {
			const [grantedPage, libraryPage, textures] = await Promise.all([
				adminUserService.listCapes(userId),
				adminTextureLibraryService.listTextures({
					limit: 100,
					texture_type: "cape",
					published: true,
				}),
				profileId
					? adminMinecraftProfileService.listTextures(profileId)
					: Promise.resolve([]),
			]);
			setGranted(grantedPage.items);
			setLibrary(libraryPage.items);
			setActiveTextureId(
				textures.find(
					(texture) =>
						texture.texture_type === "cape" && texture.source === "bound",
				)?.texture_id ?? null,
			);
		} catch (error) {
			handleApiError(error);
		} finally {
			setLoading(false);
		}
	}, [profileId, userId]);

	useEffect(() => {
		void reload();
	}, [reload]);

	async function grant(cape: PublicTextureLibraryTextureMetadata) {
		setBusyId(cape.id);
		try {
			await adminUserService.grantCape(userId, cape.id);
			toast.success(t("admin.users.capes.granted"));
			await reload();
		} catch (error) {
			handleApiError(error);
		} finally {
			setBusyId(null);
		}
	}

	async function equip(cape: MinecraftWardrobeTextureMetadata) {
		if (!profileId) return;
		setBusyId(cape.id);
		try {
			await adminMinecraftProfileService.bindCape(profileId, cape.id);
			setActiveTextureId(cape.id);
			toast.success(t("admin.users.capes.equipped"));
		} catch (error) {
			handleApiError(error);
		} finally {
			setBusyId(null);
		}
	}

	async function revoke(cape: MinecraftWardrobeTextureMetadata) {
		setBusyId(cape.id);
		try {
			await adminUserService.revokeCape(userId, cape.id);
			if (activeTextureId === cape.id) setActiveTextureId(null);
			toast.success(t("admin.users.capes.revoked"));
			await reload();
		} catch (error) {
			handleApiError(error);
		} finally {
			setBusyId(null);
		}
	}

	const grantedHashes = new Set(granted.map((cape) => cape.hash));

	return (
		<section className="overflow-hidden rounded-lg border border-dashed border-border/70 bg-background/35 p-4 dark:border-white/10 dark:bg-input/5">
			<div className="flex items-start justify-between gap-3">
				<div>
					<h3 className="font-medium text-foreground">
						{t("admin.users.capes.section")}
					</h3>
					<p className="mt-1 text-sm leading-6 text-muted-foreground">
						{t("admin.users.capes.description")}
					</p>
				</div>
				<Button
					type="button"
					size="sm"
					variant="outline"
					disabled={loading}
					onClick={() => void reload()}
				>
					<Icon
						name={loading ? "Spinner" : "RefreshCw"}
						className={loading ? "size-4 animate-spin" : "size-4"}
					/>
					{t("common.refresh")}
				</Button>
			</div>

			<div className="mt-5 grid gap-5 xl:grid-cols-2">
				<CapeList
					title={t("admin.users.capes.grantedTitle")}
					empty={t("admin.users.capes.noneGranted")}
					items={granted}
					renderActions={(cape) => (
						<>
							<Button
								type="button"
								size="sm"
								variant={activeTextureId === cape.id ? "secondary" : "outline"}
								disabled={
									!profileId || busyId !== null || activeTextureId === cape.id
								}
								onClick={() => void equip(cape)}
							>
								{activeTextureId === cape.id
									? t("admin.users.capes.active")
									: t("admin.users.capes.equip")}
							</Button>
							<Button
								type="button"
								size="sm"
								variant="destructive"
								disabled={busyId !== null}
								onClick={() => void revoke(cape)}
							>
								{t("admin.users.capes.revoke")}
							</Button>
						</>
					)}
				/>
				<CapeList
					title={t("admin.users.capes.libraryTitle")}
					empty={t("admin.users.capes.libraryEmpty")}
					items={library.filter((cape) => !grantedHashes.has(cape.hash))}
					renderActions={(cape) => (
						<Button
							type="button"
							size="sm"
							variant="outline"
							disabled={busyId !== null}
							onClick={() => void grant(cape)}
						>
							{busyId === cape.id ? (
								<Icon name="Spinner" className="size-4 animate-spin" />
							) : null}
							{t("admin.users.capes.grant")}
						</Button>
					)}
				/>
			</div>
		</section>
	);
}

function CapeList<
	T extends
		| MinecraftWardrobeTextureMetadata
		| PublicTextureLibraryTextureMetadata,
>({
	empty,
	items,
	renderActions,
	title,
}: {
	empty: string;
	items: T[];
	renderActions: (cape: T) => ReactNode;
	title: string;
}) {
	return (
		<div>
			<h4 className="text-sm font-medium">{title}</h4>
			<div className="mt-3 grid gap-2">
				{items.length ? (
					items.map((cape) => (
						<div
							key={cape.id}
							className="flex min-w-0 flex-wrap items-center gap-3 rounded-lg border border-border/70 bg-background/55 p-3 dark:border-white/10"
						>
							<TextureLibraryTextureAvatar texture={cape} className="size-12" />
							<p className="min-w-28 flex-1 truncate text-sm font-medium">
								{cape.display_name ?? cape.name}
							</p>
							<div className="flex gap-2">{renderActions(cape)}</div>
						</div>
					))
				) : (
					<p className="text-sm text-muted-foreground">{empty}</p>
				)}
			</div>
		</div>
	);
}
