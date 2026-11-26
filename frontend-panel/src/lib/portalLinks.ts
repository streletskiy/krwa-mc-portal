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
	if (/^\/(?!\/)/.test(value) && !value.includes("\\")) return value;
	try {
		const url = new URL(value);
		if (url.protocol === "https:" || url.protocol === "http:") return url.href;
	} catch {
		// Incomplete URLs leave this optional integration disabled.
	}
	return fallback;
}
