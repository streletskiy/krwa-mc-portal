import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { usePlayerSkin } from "@/components/player/PlayerAvatar";
import "@/i18n";
import PlayerSkinPage from "./PlayerSkinPage";

const service = vi.hoisted(() => ({
	listProfiles: vi.fn(),
	listProfileTextures: vi.fn(),
}));
vi.mock("@/services/yggdrasilService", () => ({ yggdrasilService: service }));
vi.mock("@/components/yggdrasil/MinecraftPreviewPanel", () => ({
	MinecraftPreviewPanel: ({ capeUrl }: { capeUrl?: string }) => (
		<div data-testid="preview" data-cape-url={capeUrl} />
	),
}));
beforeEach(() => {
	vi.clearAllMocks();
	usePlayerSkin.setState({ url: null, capeUrl: null });
});

it.each([0, 2])(
	"requires administrator repair for %s legacy characters",
	async (total) => {
		service.listProfiles.mockResolvedValue({
			total,
			items: total
				? [
						{ id: "one", name: "one" },
						{ id: "two", name: "two" },
					]
				: [],
		});
		render(<PlayerSkinPage />);
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Contact an administrator",
		);
		expect(
			screen.queryByRole("button", { name: "Upload skin" }),
		).not.toBeInTheDocument();
		expect(service.listProfileTextures).not.toHaveBeenCalled();
		expect(document.querySelector('input[type="text"]')).toBeNull();
	},
);

it("offers only upload for one fixed character with a default skin", async () => {
	service.listProfiles.mockResolvedValue({
		total: 1,
		items: [{ id: "one", name: "FixedName" }],
	});
	service.listProfileTextures.mockResolvedValue([]);
	render(<PlayerSkinPage />);
	expect(
		await screen.findByRole("button", { name: "Upload skin" }),
	).toBeEnabled();
	expect(screen.getByText("FixedName")).toBeVisible();
	expect(screen.getByText(/cannot be changed/)).toBeVisible();
	expect(
		screen.queryByRole("button", { name: /Delete|Rename|Create|Cape/i }),
	).toBeNull();
	expect(document.querySelector("select")).toBeNull();
});

it("shows the active cape in the character preview", async () => {
	service.listProfiles.mockResolvedValue({
		total: 1,
		items: [{ id: "one", name: "CapePlayer" }],
	});
	service.listProfileTextures.mockResolvedValue([
		{
			texture_type: "skin",
			texture_model: "default",
			url: "/skin.png",
		},
		{
			texture_type: "cape",
			texture_model: "default",
			url: "/cape.png",
		},
	]);
	render(<PlayerSkinPage />);

	expect(await screen.findByTestId("preview")).toHaveAttribute(
		"data-cape-url",
		"/cape.png",
	);
});
