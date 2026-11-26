import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { adminPaths } from "@/routes/routePaths";

export type TextureLibrarySection = "textures" | "reviews" | "reports" | "tags";

export function TextureLibrarySectionNav({
	active,
}: {
	active: TextureLibrarySection;
}) {
	const { t } = useTranslation();
	return (
		<nav
			className="workspace-subnav"
			aria-label={t("admin.nav.textureLibrary")}
		>
			<Button
				type="button"
				variant="ghost"
				aria-current={active === "textures" ? "page" : undefined}
				size="sm"
				render={<Link to={adminPaths.textureLibrary} />}
			>
				<Icon name="Images" className="size-4" />
				{t("admin.textureLibraryTexturesPage.allTextures")}
			</Button>
			<Button
				type="button"
				variant="ghost"
				aria-current={active === "reviews" ? "page" : undefined}
				size="sm"
				render={<Link to={adminPaths.textureLibraryReviews} />}
			>
				<Icon name="ListChecks" className="size-4" />
				{t("admin.textureLibraryTexturesPage.reviewQueue")}
			</Button>
			<Button
				type="button"
				variant="ghost"
				aria-current={active === "reports" ? "page" : undefined}
				size="sm"
				render={<Link to={adminPaths.textureLibraryReports} />}
			>
				<Icon name="Flag" className="size-4" />
				{t("admin.textureLibraryReportsPage.reports")}
			</Button>
			<Button
				type="button"
				variant="ghost"
				aria-current={active === "tags" ? "page" : undefined}
				size="sm"
				render={<Link to={adminPaths.textureLibraryTags} />}
			>
				<Icon name="ListBullets" className="size-4" />
				{t("admin.textureLibraryTexturesPage.tags")}
			</Button>
		</nav>
	);
}
