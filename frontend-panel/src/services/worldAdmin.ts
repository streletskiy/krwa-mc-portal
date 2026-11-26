import { portalUrl } from "@/lib/portalLinks";
import { adminMinecraftProfileService } from "./adminService";

type Access = { uid: string; name: string; state: string; scope: string };
type Trip = { id: string; uid: string; name: string; state: string };
export type WorldRecord = {
	id: string;
	name: string;
	state: string;
	kind: "trip" | "access" | "profile";
	href: string;
	scope?: string;
};

function panelLink(player: string, trip?: string) {
	const url = new URL(portalUrl("world-admin-url"), window.location.href);
	url.searchParams.set("player", player);
	if (trip) url.searchParams.set("trip", trip);
	return url.href;
}

export function integratedWorlds() {
	const link = portalUrl("world-admin-url");
	return Boolean(
		link && new URL(link, window.location.href).origin === location.origin,
	);
}

async function worldRecords(
	params: URLSearchParams,
	signal?: AbortSignal,
): Promise<WorldRecord[]> {
	const res = await fetch(`/api/offline-worlds/admin?${params}`, {
		credentials: "same-origin",
		signal,
		headers: { Accept: "application/json" },
	});
	if (!res.ok) throw new Error(String(res.status));
	const data: { users: Access[]; trips: Trip[] } = await res.json();
	return [
		...data.trips.map(
			(t): WorldRecord => ({
				id: `trip-${t.id}`,
				kind: "trip",
				state: t.state,
				name: t.name,
				href: panelLink(t.uid, t.id),
			}),
		),
		...data.users.map(
			(u): WorldRecord => ({
				id: `access-${u.uid}`,
				kind: "access",
				state: u.state,
				name: u.name,
				scope: u.scope,
				href: panelLink(u.uid),
			}),
		),
	];
}

export async function worldInbox() {
	const rows = await worldRecords(new URLSearchParams({ inbox: "true" }));
	return rows.filter((r) =>
		r.kind === "trip" ? r.state === "review" : r.state === "pending",
	);
}

export async function playerWorlds(userId: number) {
	const rows: WorldRecord[] = [];
	let cursor: number | undefined;
	do {
		const page = await adminMinecraftProfileService.listByUserPage(userId, {
			limit: 50,
			after_id: cursor,
		});
		for (const p of page.items) {
			const uid = p.id.replaceAll("-", "").toLowerCase();
			const records = await worldRecords(new URLSearchParams({ profile: uid }));
			const own = records.filter(
				(r) => new URL(r.href).searchParams.get("player") === uid,
			);
			if (own.length) rows.push(...own);
			else
				rows.push({
					id: `profile-${uid}`,
					kind: "profile",
					state: "none",
					name: p.name,
					href: panelLink(uid),
				});
		}
		const next = page.next_cursor?.id;
		if (next === cursor) break;
		cursor = next;
	} while (cursor !== undefined);
	return rows;
}
