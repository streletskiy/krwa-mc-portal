import { useEffect } from "react";
import { create } from "zustand";
import { MinecraftSkinAvatar } from "@/components/yggdrasil/MinecraftSkinAvatar";
import { yggdrasilService } from "@/services/yggdrasilService";

export const usePlayerSkin = create<{
	url: string | null;
	capeUrl: string | null;
	setUrl: (url: string | null) => void;
	setCapeUrl: (capeUrl: string | null) => void;
}>((set) => ({
	url: null,
	capeUrl: null,
	setUrl: (url) => set({ url }),
	setCapeUrl: (capeUrl) => set({ capeUrl }),
}));
export function PlayerAvatar({
	name,
	className,
}: {
	name: string;
	className?: string;
}) {
	const url = usePlayerSkin((s) => s.url);
	// biome-ignore lint/correctness/useExhaustiveDependencies: Switching accounts must reload the skin.
	useEffect(() => {
		let active = true;
		usePlayerSkin.getState().setUrl(null);
		usePlayerSkin.getState().setCapeUrl(null);
		void yggdrasilService
			.listProfiles()
			.then(async (page) => {
				const profile = page.items[0];
				if (!profile) return;
				const textures = await yggdrasilService.listProfileTextures(profile.id);
				if (active) {
					const appearance = usePlayerSkin.getState();
					appearance.setUrl(
						textures.find((v) => v.texture_type === "skin")?.url ?? null,
					);
					appearance.setCapeUrl(
						textures.find((v) => v.texture_type === "cape")?.url ?? null,
					);
				}
			})
			.catch(() => {
				/* Default avatar remains if the profile is unavailable. */
			});
		return () => {
			active = false;
		};
	}, [name]);
	return (
		<MinecraftSkinAvatar
			name={name}
			skinUrl={url ?? "/static/skins/steve.png"}
			className={className}
		/>
	);
}
