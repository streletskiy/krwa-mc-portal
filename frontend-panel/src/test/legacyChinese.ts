// Historical upstream component tests only. Never imported by the shipped app.
import { i18next } from "@/i18n";
import zhAccount from "@/i18n/locales/zh-CN/account.json";
import zhAdmin from "@/i18n/locales/zh-CN/admin.json";
import zhAdminAudit from "@/i18n/locales/zh-CN/admin-audit.json";
import zhAdminExternalAuth from "@/i18n/locales/zh-CN/admin-external-auth.json";
import zhAdminTasks from "@/i18n/locales/zh-CN/admin-tasks.json";
import zhAdminUsers from "@/i18n/locales/zh-CN/admin-users.json";
import zhErrors from "@/i18n/locales/zh-CN/errors.json";
import zhPublic from "@/i18n/locales/zh-CN/public.json";
import zhPwa from "@/i18n/locales/zh-CN/pwa.json";
import zhSettings from "@/i18n/locales/zh-CN/settings.json";
import zhShell from "@/i18n/locales/zh-CN/shell.json";
import { resources as productionResources } from "@/i18n/resources";

const zhFrontend = {
	...zhShell,
	...zhPublic,
	...zhAccount,
	...zhErrors,
	...zhPwa,
	...zhAdmin,
	admin: {
		...zhAdmin.admin,
		audit: zhAdminAudit.admin.audit,
		externalAuth: zhAdminExternalAuth.admin.externalAuth,
		tasks: zhAdminTasks.admin.tasks,
		users: zhAdminUsers.admin.users,
	},
	...zhSettings,
};

i18next.addResourceBundle("zh-CN", "frontend", zhFrontend);
export const resources = {
	...productionResources,
	"zh-CN": { frontend: zhFrontend },
};
