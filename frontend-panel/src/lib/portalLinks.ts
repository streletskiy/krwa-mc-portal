type PortalSetting =
	| "hero-url"
	| "community-url"
	| "download-base"
	| "world-admin-url";

export function portalUrl(key: PortalSetting, fallback = "") {
	const value = document
		.querySelector<HTMLMetaElement>(`meta[name="portal-${key}"]`)
		?.content.trim();
	if (!value || value.startsWith("%PORTAL_")) return fallback;
	if (
		key === "world-admin-url" &&
		(value === "/admin/offline-worlds" ||
			value === location.origin + "/admin/offline-worlds")
	)
		return "/admin/worlds";
	if (/^\/(?!\/)/.test(value) && !value.includes("\\")) return value;
	try {
		const url = new URL(value);
		if (url.protocol === "https:" || url.protocol === "http:") return url.href;
	} catch {
		// Incomplete URLs leave this optional integration disabled.
	}
	return fallback;
}

export function worldLoginReturn() {
	const raw = new URLSearchParams(location.search).get("returnTo");
	const panel = portalUrl("world-admin-url");
	if (!raw || !panel || !raw.startsWith("/") || raw.startsWith("//")) return "";
	try {
		const url = new URL(raw, location.origin),
			configured = new URL(panel, location.origin);
		if (
			url.origin !== location.origin ||
			configured.origin !== location.origin ||
			url.pathname !== configured.pathname
		)
			return "";
		const allowed = new URLSearchParams();
		for (const key of ["player", "trip"]) {
			const id = url.searchParams.get(key);
			if (id && /^[a-f0-9]{32}$/i.test(id)) allowed.set(key, id);
		}
		return configured.pathname + (allowed.size ? `?${allowed.toString()}` : "");
	} catch {
		return "";
	}
}
