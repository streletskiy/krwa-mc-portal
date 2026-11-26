import enAccount from "@/i18n/locales/en-US/account.json";
import enAdmin from "@/i18n/locales/en-US/admin.json";
import enAdminAudit from "@/i18n/locales/en-US/admin-audit.json";
import enAdminExternalAuth from "@/i18n/locales/en-US/admin-external-auth.json";
import enAdminTasks from "@/i18n/locales/en-US/admin-tasks.json";
import enAdminUsers from "@/i18n/locales/en-US/admin-users.json";
import enErrors from "@/i18n/locales/en-US/errors.json";
import enPublic from "@/i18n/locales/en-US/public.json";
import enPwa from "@/i18n/locales/en-US/pwa.json";
import enSettings from "@/i18n/locales/en-US/settings.json";
import enShell from "@/i18n/locales/en-US/shell.json";
import plPlayer from "@/i18n/locales/pl-PL/player.json";
import ruAccount from "@/i18n/locales/ru-RU/account.json";
import ruAdmin from "@/i18n/locales/ru-RU/admin.json";
import ruAdminAudit from "@/i18n/locales/ru-RU/admin-audit.json";
import ruAdminExternalAuth from "@/i18n/locales/ru-RU/admin-external-auth.json";
import ruAdminTasks from "@/i18n/locales/ru-RU/admin-tasks.json";
import ruAdminUsers from "@/i18n/locales/ru-RU/admin-users.json";
import ruErrors from "@/i18n/locales/ru-RU/errors.json";
import ruPublic from "@/i18n/locales/ru-RU/public.json";
import ruPwa from "@/i18n/locales/ru-RU/pwa.json";
import ruSettings from "@/i18n/locales/ru-RU/settings.json";
import ruShell from "@/i18n/locales/ru-RU/shell.json";

const enFrontend = {
	...enShell,
	...enPublic,
	...enAccount,
	...enErrors,
	...enPwa,
	...enAdmin,
	admin: {
		...enAdmin.admin,
		audit: enAdminAudit.admin.audit,
		externalAuth: enAdminExternalAuth.admin.externalAuth,
		tasks: enAdminTasks.admin.tasks,
		users: enAdminUsers.admin.users,
	},
	...enSettings,
};

const ruFrontend = {
	...ruShell,
	...ruPublic,
	...ruAccount,
	...ruErrors,
	...ruPwa,
	...ruAdmin,
	admin: {
		...ruAdmin.admin,
		audit: ruAdminAudit.admin.audit,
		externalAuth: ruAdminExternalAuth.admin.externalAuth,
		tasks: ruAdminTasks.admin.tasks,
		users: ruAdminUsers.admin.users,
	},
	...ruSettings,
};

export const resources = {
	"en-US": {
		frontend: enFrontend,
	},
	"ru-RU": {
		frontend: ruFrontend,
	},
	"pl-PL": {
		frontend: plPlayer,
	},
} as const;
