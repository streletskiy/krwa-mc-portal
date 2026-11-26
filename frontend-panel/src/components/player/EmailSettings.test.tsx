import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import "@/i18n";
import { useAuthStore } from "@/stores/authStore";
import { EmailSettings } from "./EmailSettings";

const api = vi.hoisted(() => ({
	requestEmailChange: vi.fn(),
	resendEmailChange: vi.fn(),
}));
vi.mock("@/services/authService", () => ({ authService: api }));
beforeEach(() => {
	vi.clearAllMocks();
	useAuthStore.setState({
		user: {
			id: 7,
			username: "test",
			email: "old@example.test",
			role: "user",
			status: "active",
		},
		refreshUser: vi.fn().mockResolvedValue(undefined),
	});
});
it("validates email and requests confirmation without changing the current address", async () => {
	api.requestEmailChange.mockResolvedValue(undefined);
	render(
		<MemoryRouter>
			<EmailSettings />
		</MemoryRouter>,
	);
	const input = screen.getByLabelText("New email");
	fireEvent.change(input, { target: { value: "invalid" } });
	expect(
		screen.getByRole("button", { name: "Send confirmation" }),
	).toBeDisabled();
	fireEvent.change(input, { target: { value: "new@example.test" } });
	fireEvent.click(screen.getByRole("button", { name: "Send confirmation" }));
	await waitFor(() =>
		expect(api.requestEmailChange).toHaveBeenCalledWith({
			new_email: "new@example.test",
		}),
	);
	expect(screen.getByText("old@example.test")).toBeVisible();
	await waitFor(() => expect(input).toHaveValue(""));
});
it("keeps the entered email when the server rejects the change", async () => {
	api.requestEmailChange.mockRejectedValue(new Error("Unavailable"));
	render(
		<MemoryRouter>
			<EmailSettings />
		</MemoryRouter>,
	);
	fireEvent.change(screen.getByLabelText("New email"), {
		target: { value: "new@example.test" },
	});
	fireEvent.click(screen.getByRole("button", { name: "Send confirmation" }));
	await screen.findByRole("status");
	expect(screen.getByLabelText("New email")).toHaveValue("new@example.test");
});
