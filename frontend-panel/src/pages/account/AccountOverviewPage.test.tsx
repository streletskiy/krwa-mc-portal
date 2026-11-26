import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import "@/i18n";
import { CommunityPanel } from "@/components/player/CommunityPanel";
import { useAuthStore } from "@/stores/authStore";

beforeEach(() => {
	vi.stubGlobal(
		"fetch",
		vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				servers: [
					{
						id: "create",
						name: "Example Create",
						minecraftVersion: "26.2",
						packVersion: "1",
						description: "Create",
						mods: [],
						status: { state: "online", online: 2, max: 20 },
					},
				],
				downloads: [
					{ platform: "Windows", version: "1", url: "/download/windows" },
					{ platform: "macOS", version: "1", url: "/download/macos" },
				],
			}),
		}),
	);
	useAuthStore.setState({
		user: {
			id: 7,
			username: "alex",
			email: "alex@example.test",
			role: "user",
			status: "active",
		},
		isAdmin: false,
	});
});
afterEach(() => vi.unstubAllGlobals());
it("shows player actions, real online counts and stable downloads without setup or admin information", async () => {
	render(
		<MemoryRouter>
			<CommunityPanel />
		</MemoryRouter>,
	);
	expect(await screen.findByText("Example Create")).toBeVisible();
	expect(screen.getByText("2 / 20 playing")).toBeVisible();
	expect(screen.getByRole("link", { name: /Windows/ })).toHaveAttribute(
		"href",
		"/download/windows",
	);
	expect(screen.getByRole("link", { name: /macOS/ })).toHaveAttribute(
		"href",
		"/download/macos",
	);
	expect(document.querySelector('a[href^="/admin"]')).toBeNull();
	expect(
		screen.queryByText(/API Root|authlib|javaagent|Yggdrasil/i),
	).not.toBeInTheDocument();
});
it("never shows an administrative dashboard in the player overview even for admins", async () => {
	useAuthStore.setState({ isAdmin: true });
	render(
		<MemoryRouter>
			<CommunityPanel />
		</MemoryRouter>,
	);
	expect(await screen.findByText("Example Create")).toBeVisible();
	expect(document.querySelector('a[href^="/admin"]')).toBeNull();
});
it("shows an unavailable state instead of a misleading online count on failure", async () => {
	vi.mocked(fetch).mockRejectedValue(new Error("offline"));
	render(
		<MemoryRouter>
			<CommunityPanel />
		</MemoryRouter>,
	);
	expect(await screen.findByText(/Could not refresh the status/)).toBeVisible();
	expect(screen.queryByText("0 / 20 playing")).not.toBeInTheDocument();
});
