import { type FormEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AuthPasswordField } from "@/components/auth/AuthFormPrimitives";
import { Button } from "@/components/ui/button";
import { passwordChangeSchema } from "@/lib/validation";
import { formatUnknownError } from "@/services/http";
import { useAuthStore } from "@/stores/authStore";

const empty = { currentPassword: "", newPassword: "", confirmPassword: "" };
export function PasswordSettings() {
	const { t } = useTranslation();
	const changePassword = useAuthStore((s) => s.changePassword);
	const [values, setValues] = useState(empty);
	const [visible, setVisible] = useState(false);
	const [busy, setBusy] = useState(false);
	const lock = useRef(false);
	const [message, setMessage] = useState("");
	async function submit(event: FormEvent) {
		event.preventDefault();
		if (lock.current) return;
		const parsed = passwordChangeSchema.safeParse(values);
		if (!parsed.success) {
			setMessage(t(parsed.error.issues[0].message));
			return;
		}
		lock.current = true;
		setBusy(true);
		setMessage("");
		try {
			await changePassword(values.currentPassword, values.newPassword);
			setValues(empty);
			setVisible(false);
			setMessage(t("player.passwordChanged"));
		} catch (error) {
			setMessage(formatUnknownError(error));
		} finally {
			lock.current = false;
			setBusy(false);
		}
	}
	return (
		<form
			onSubmit={submit}
			className="grid gap-4 border-t border-border pt-6"
			aria-label={t("player.changePassword")}
		>
			<h3>{t("player.changePassword")}</h3>
			<p className="text-sm text-muted-foreground">
				{t("player.passwordHint")}
			</p>
			{(["currentPassword", "newPassword", "confirmPassword"] as const).map(
				(key) => (
					<AuthPasswordField
						key={key}
						id={`player-${key}`}
						label={t(`player.${key}`)}
						value={values[key]}
						onChange={(value) => {
							setValues((v) => ({ ...v, [key]: value }));
							setMessage("");
						}}
						autoComplete={
							key === "currentPassword" ? "current-password" : "new-password"
						}
						placeholder=""
						showPassword={visible}
						onToggleShowPassword={
							key === "currentPassword"
								? () => setVisible((v) => !v)
								: undefined
						}
						disabled={busy}
					/>
				),
			)}
			<Button
				type="submit"
				disabled={
					busy ||
					!values.currentPassword ||
					!values.newPassword ||
					!values.confirmPassword
				}
				className="w-fit"
			>
				{t(busy ? "player.savingPassword" : "player.changePassword")}
			</Button>
			{message && (
				<p role="status" className="text-sm">
					{message}
				</p>
			)}
		</form>
	);
}
