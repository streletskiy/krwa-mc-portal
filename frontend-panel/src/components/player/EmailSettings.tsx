import { type FormEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	clearContactVerificationRedirectSearch,
	getContactVerificationRedirectState,
} from "@/lib/contactVerificationRedirect";
import { emailSchema } from "@/lib/validation";
import { authService } from "@/services/authService";
import { formatUnknownError } from "@/services/http";
import { useAuthStore } from "@/stores/authStore";
export function EmailSettings() {
	const { t } = useTranslation();
	const user = useAuthStore((s) => s.user);
	const refreshUser = useAuthStore((s) => s.refreshUser);
	const [email, setEmail] = useState("");
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState("");
	const lock = useRef(false);
	const location = useLocation();
	const navigate = useNavigate();
	useEffect(() => {
		const result = getContactVerificationRedirectState(location.search);
		if (!result) return;
		if (result.status === "email-changed") {
			setMessage(t("personalSettings.emailChangeConfirmed"));
			void refreshUser();
		}
		navigate(
			{
				pathname: "/account",
				search: clearContactVerificationRedirectSearch(location.search),
			},
			{ replace: true },
		);
	}, [location.search, navigate, refreshUser, t]);
	async function save(event?: FormEvent) {
		event?.preventDefault();
		if (lock.current || (event && !emailSchema.safeParse(email).success))
			return;
		lock.current = true;
		setBusy(true);
		setMessage("");
		try {
			if (event)
				await authService.requestEmailChange({ new_email: email.trim() });
			else await authService.resendEmailChange();
			await refreshUser();
			setEmail("");
			setMessage(t("personalSettings.emailChangeRequested"));
		} catch (error) {
			setMessage(formatUnknownError(error));
		} finally {
			lock.current = false;
			setBusy(false);
		}
	}
	return (
		<form onSubmit={save} className="grid gap-3 border-t border-border pt-6">
			<h2 className="font-semibold">{t("simplePlayer.emailSettings")}</h2>
			<p className="break-all text-sm text-muted-foreground">{user?.email}</p>
			<label htmlFor="new-email" className="text-sm">
				{t("personalSettings.newEmail")}
			</label>
			<Input
				id="new-email"
				type="email"
				autoComplete="email"
				value={email}
				onChange={(event) => setEmail(event.target.value)}
				disabled={busy}
			/>
			<Button
				type="submit"
				className="w-fit"
				disabled={
					busy ||
					!emailSchema.safeParse(email).success ||
					email.trim().toLowerCase() === user?.email.toLowerCase()
				}
			>
				{t("personalSettings.emailChangeSubmit")}
			</Button>
			{user?.pending_email && (
				<div className="grid gap-2 text-sm">
					<p>
						{t("personalSettings.emailChangePendingHint", {
							email: user.pending_email,
						})}
					</p>
					<Button
						variant="ghost"
						className="w-fit"
						disabled={busy}
						onClick={() => void save()}
					>
						{t("personalSettings.emailChangeResend")}
					</Button>
				</div>
			)}
			{message && (
				<p role="status" className="text-sm">
					{message}
				</p>
			)}
		</form>
	);
}
