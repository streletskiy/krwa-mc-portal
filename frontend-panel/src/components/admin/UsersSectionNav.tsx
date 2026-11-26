import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { adminPaths } from "@/routes/routePaths";

export type UsersSection = "users" | "invitations";

export function UsersSectionNav({ active }: { active: UsersSection }) {
	const { t } = useTranslation();
	return (
		<nav className="workspace-subnav" aria-label={t("admin.nav.users")}>
			<Button
				type="button"
				variant="ghost"
				aria-current={active === "users" ? "page" : undefined}
				size="sm"
				render={<Link to={adminPaths.users} />}
			>
				<Icon name="User" className="size-4" />
				{t("admin.users.userList")}
			</Button>
			<Button
				type="button"
				variant="ghost"
				aria-current={active === "invitations" ? "page" : undefined}
				size="sm"
				render={<Link to={adminPaths.userInvitations} />}
			>
				<Icon name="EnvelopeSimple" className="size-4" />
				{t("admin.users.invitationRecords")}
			</Button>
		</nav>
	);
}
