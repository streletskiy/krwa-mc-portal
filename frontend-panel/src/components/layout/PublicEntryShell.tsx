import type { ReactNode } from "react";
import { PlayerFrame } from "@/components/player/PlayerShell";
import type { AppliedBranding } from "@/lib/branding";

type PublicEntryShellProps = {
	branding: AppliedBranding;
	title: string;
	tagline: string;
	variant: "home" | "auth";
	children: ReactNode;
	headerActions?: ReactNode;
	footer?: ReactNode;
	hideLanguageOnMobile?: boolean;
};
export function PublicEntryShell({ children, variant }: PublicEntryShellProps) {
	return (
		<PlayerFrame>
			<div className={variant === "auth" ? "player-auth" : undefined}>
				{children}
			</div>
		</PlayerFrame>
	);
}
