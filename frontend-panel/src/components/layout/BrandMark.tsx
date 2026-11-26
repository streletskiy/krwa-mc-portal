import type { AppliedBranding } from "@/lib/branding";

import { useThemeStore } from "@/stores/themeStore";

type BrandMarkProps = {
	branding: AppliedBranding;
	className?: string;
	wordmarkClassName?: string;
};

export function BrandMark({
	branding,
	className,
	wordmarkClassName,
}: BrandMarkProps) {
	const dark = useThemeStore((state) => state.mode === "dark");
	const wordmark =
		(dark ? branding.wordmarkDarkUrl : branding.wordmarkLightUrl) ||
		branding.wordmarkDarkUrl ||
		branding.wordmarkLightUrl;
	if (wordmark) {
		return (
			<img
				src={wordmark}
				alt={branding.title}
				className={wordmarkClassName ?? "h-9 max-w-44 object-contain"}
			/>
		);
	}

	return (
		<img
			src={branding.faviconUrl}
			alt={branding.title}
			className={className ?? "size-10 shrink-0 object-contain"}
		/>
	);
}
