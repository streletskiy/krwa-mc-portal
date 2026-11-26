import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { usePlayerSkin } from "@/components/player/PlayerAvatar";
import "@/i18n";
import PlayerCapePage from "./PlayerCapePage";

const service = vi.hoisted(() => ({
	bindProfileTexture: vi.fn(),
	listProfiles: vi.fn(),
	listProfileTextures: vi.fn(),
	listWardrobeTextures: vi.fn(),
	unbindProfileTexture: vi.fn(),
}));

vi.mock("@/services/yggdrasilService", () => ({ yggdrasilService: service }));

beforeEach(() => {
	vi.clearAllMocks();
	usePlayerSkin.setState({ url: null, capeUrl: null });
	service.listProfiles.mockResolvedValue({
		total: 1,
		items: [{ id: "profile-uuid", name: "Player" }],
	});
	service.listProfileTextures.mockResolvedValue([]);
	service.listWardrobeTextures.mockResolvedValue({
		total: 1,
		items: [
			{
				id: 42,
				name: "Example Cape",
				display_name: "Example Cape",
				hash: "cape-hash",
				texture_type: "cape",
				texture_model: "default",
				visibility: "private",
				library_status: "private",
				library_review_note: null,
				library_submitted_at: null,
				library_reviewed_at: null,
				tags: [],
				width: 22,
				height: 17,
				file_size: 256,
				mime_type: "image/png",
				url: "/cape.png",
				preview_url: "/cape-preview.png",
				created_at: "2026-09-07T00:00:00Z",
				updated_at: "2026-09-07T00:00:00Z",
			},
		],
	});
});

it("lets a player select and disable a granted cape", async () => {
	service.bindProfileTexture.mockResolvedValue({
		texture_id: 42,
		texture_type: "cape",
		source: "bound",
		url: "/cape.png",
	});
	service.unbindProfileTexture.mockResolvedValue(undefined);
	render(<PlayerCapePage />);

	const useButton = await screen.findByRole("button", { name: "Use" });
	fireEvent.click(useButton);
	expect(service.bindProfileTexture).toHaveBeenCalledWith({
		uuid: "profile-uuid",
		textureType: "cape",
		textureId: 42,
	});
	await waitFor(() =>
		expect(usePlayerSkin.getState().capeUrl).toBe("/cape.png"),
	);

	const offButton = await screen.findByRole("button", {
		name: "Turn cape off",
	});
	fireEvent.click(offButton);
	expect(service.unbindProfileTexture).toHaveBeenCalledWith({
		uuid: "profile-uuid",
		textureType: "cape",
	});
	await waitFor(() => expect(usePlayerSkin.getState().capeUrl).toBeNull());
});

it("shows the selected cape clearly in a one-column list", async () => {
	service.listProfileTextures.mockResolvedValue([
		{
			texture_id: 42,
			texture_type: "cape",
			source: "bound",
			url: "/cape.png",
		},
	]);
	render(<PlayerCapePage />);

	const activeLabel = await screen.findByText("Currently active");
	expect(activeLabel.closest("[data-active]")).toHaveAttribute(
		"data-active",
		"true",
	);
	expect(screen.getByTestId("player-cape-list")).not.toHaveClass(
		"sm:grid-cols-2",
	);
	expect(usePlayerSkin.getState().capeUrl).toBe("/cape.png");
});

it("shows a clear empty state when no capes were granted", async () => {
	service.listWardrobeTextures.mockResolvedValue({ total: 0, items: [] });
	render(<PlayerCapePage />);
	expect(
		await screen.findByText("No capes have been granted to your account yet."),
	).toBeVisible();
});
