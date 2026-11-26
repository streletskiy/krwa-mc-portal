import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import "@/i18n";
import { useAuthStore } from "@/stores/authStore";
import { PasswordSettings } from "./PasswordSettings";

const change = vi.fn();
beforeEach(() => {
	change.mockReset();
	useAuthStore.setState({ changePassword: change });
});
function fill(confirm = "New-password-123!") {
	fireEvent.change(screen.getByLabelText("Current password"), {
		target: { value: "Old-password-123!" },
	});
	fireEvent.change(screen.getByLabelText("New password"), {
		target: { value: "New-password-123!" },
	});
	fireEvent.change(screen.getByLabelText("Repeat new password"), {
		target: { value: confirm },
	});
}
it("validates confirmation before sending credentials", () => {
	render(<PasswordSettings />);
	fill("does-not-match");
	fireEvent.click(screen.getByRole("button", { name: "Change password" }));
	expect(change).not.toHaveBeenCalled();
	expect(screen.getByRole("status")).toHaveTextContent(
		"Passwords do not match",
	);
});
it("clears sensitive fields after a successful password change", async () => {
	change.mockResolvedValue(undefined);
	render(<PasswordSettings />);
	fill();
	fireEvent.click(screen.getByRole("button", { name: "Change password" }));
	await waitFor(() =>
		expect(change).toHaveBeenCalledWith(
			"Old-password-123!",
			"New-password-123!",
		),
	);
	expect(await screen.findByText(/Password changed\./)).toBeVisible();
	expect(screen.getByLabelText("Current password")).toHaveValue("");
	expect(screen.getByLabelText("New password")).toHaveValue("");
});
