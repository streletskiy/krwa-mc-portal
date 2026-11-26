const key = "portal-launcher-device";
export function devicePath(code: string | null) {
	return code && /^[0-9a-f]{32}$/.test(code) ? "/device?code=" + code : "";
}
export function pendingDevice() {
	try {
		const value = JSON.parse(sessionStorage.getItem(key) || "null");
		return value?.until > Date.now() ? devicePath(value.code) : "";
	} catch {
		return "";
	}
}
export function rememberDevice(code: string) {
	if (devicePath(code))
		sessionStorage.setItem(
			key,
			JSON.stringify({ code, until: Date.now() + 600000 }),
		);
}
export function forgetDevice() {
	sessionStorage.removeItem(key);
}
