import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { devicePath, forgetDevice, rememberDevice } from "@/lib/deviceLogin";
import { getCsrfToken } from "@/services/csrf";
import { useAuthStore } from "@/stores/authStore";

type Profile = { id: string; name: string };
export default function DeviceLoginPage() {
	const { t } = useTranslation();
	const [params] = useSearchParams();
	const code = params.get("code") || "";
	const path = devicePath(code);
	const user = useAuthStore((s) => s.user);
	const [profiles, setProfiles] = useState<Profile[]>([]);
	const [selected, setSelected] = useState("");
	const [status, setStatus] = useState("loading");
	useEffect(() => {
		if (!path) {
			setStatus("expired");
			return;
		}
		const abort = new AbortController();
		const signal = abort.signal;
		setStatus("loading");
		fetch("/api/v1/launcher-device/confirm/" + code, {
			signal,
			cache: "no-store",
		})
			.then(async (response) => {
				if (response.status === 401 || user?.must_change_password) {
					rememberDevice(code);
					location.replace(
						user?.must_change_password
							? "/force-password-change"
							: "/login?returnTo=" + encodeURIComponent(path),
					);
					return;
				}
				if (!response.ok) {
					setStatus(response.status === 410 ? "expired" : "error");
					forgetDevice();
					return;
				}
				const data = await response.json();
				if (signal.aborted) return;
				setProfiles(data.profiles);
				setSelected(data.profiles[0]?.id || "");
				setStatus(data.profiles.length ? "confirm" : "noProfile");
			})
			.catch(() => {
				if (!signal.aborted) setStatus("error");
			});
		return () => abort.abort();
	}, [code, path, user?.must_change_password]);
	async function decide(approve: boolean) {
		setStatus("saving");
		try {
			const response = await fetch("/api/v1/launcher-device/decision", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-CSRF-Token": getCsrfToken() || "",
				},
				body: JSON.stringify({ code, profile: approve ? selected : null }),
			});
			if (response.status === 401) {
				rememberDevice(code);
				location.assign("/login?returnTo=" + encodeURIComponent(path));
				return;
			}
			setStatus(
				response.ok
					? approve
						? "approved"
						: "denied"
					: response.status === 410
						? "expired"
						: "error",
			);
			forgetDevice();
		} catch {
			setStatus("error");
		}
	}
	return (
		<main className="mx-auto grid max-w-md gap-5 p-6">
			<h1 className="text-2xl font-semibold">{t("device.title")}</h1>
			<p role="status">{t("device." + status)}</p>
			{status === "confirm" && (
				<>
					<strong className="font-mono text-3xl tracking-widest">
						{code.slice(-6).toUpperCase()}
					</strong>
					<label className="grid gap-2">
						{t("device.profile")}
						<select
							className="h-11 rounded-md border bg-background px-3"
							value={selected}
							onChange={(e) => setSelected(e.target.value)}
						>
							{profiles.map((p) => (
								<option key={p.id} value={p.id}>
									{p.name}
								</option>
							))}
						</select>
					</label>
					<div className="flex flex-wrap gap-2">
						<Button onClick={() => decide(true)}>{t("device.allow")}</Button>
						<Button variant="outline" onClick={() => decide(false)}>
							{t("device.reject")}
						</Button>
					</div>
				</>
			)}
			{status === "error" && (
				<Button variant="outline" onClick={() => location.reload()}>
					{t("device.retry")}
				</Button>
			)}
		</main>
	);
}
