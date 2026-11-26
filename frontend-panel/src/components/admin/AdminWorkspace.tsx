import {
	type BaseRecord,
	type DataProvider,
	type GetListParams,
	Refine,
} from "@refinedev/core";
import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { adminUserService } from "@/services/adminService";
import { playerWorlds, worldInbox } from "@/services/worldAdmin";

async function getList<T extends BaseRecord>({
	resource,
	meta,
}: GetListParams) {
	if (resource === "players") {
		const page = await adminUserService.list({
			keyword: meta?.keyword,
			limit: 5,
		});
		return { data: page.items as unknown as T[], total: page.total };
	}
	const data =
		resource === "world-inbox"
			? await worldInbox()
			: resource === "player-worlds"
				? await playerWorlds(meta?.userId)
				: undefined;
	if (!data) throw new Error("Unknown administrative resource");
	return { data: data as unknown as T[], total: data.length };
}
const readOnly = async () => {
	throw new Error("Unsupported resource operation");
};
const provider: DataProvider = {
	getApiUrl: () => "/api/v1/admin",
	getList,
	getOne: readOnly,
	create: readOnly,
	update: readOnly,
	deleteOne: readOnly,
};
const resources = ["players", "world-inbox", "player-worlds"].map((name) => ({
	name,
}));

export function AdminDataProvider({ children }: { children: ReactNode }) {
	return (
		<Refine
			dataProvider={provider}
			resources={resources}
			options={{ disableTelemetry: true }}
		>
			{children}
		</Refine>
	);
}

export default function AdminWorkspace() {
	return (
		<AdminDataProvider>
			<AppShell scope="admin" />
		</AdminDataProvider>
	);
}
