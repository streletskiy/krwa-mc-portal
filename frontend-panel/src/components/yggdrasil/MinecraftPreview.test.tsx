import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import "@/i18n";
import { MinecraftPreview } from "./MinecraftPreview";

const viewerMock = vi.hoisted(() => ({
	construct: vi.fn(),
	throwOnConstruct: false,
}));

vi.mock("skinview3d", () => ({
	SkinViewer: class {
		autoRotate = false;
		autoRotateSpeed = 0;
		controls = {
			enablePan: true,
			enableZoom: true,
			rotateSpeed: 0,
		};
		disposed = false;
		constructor() {
			viewerMock.construct();
			if (viewerMock.throwOnConstruct)
				throw new Error("Error creating WebGL context");
		}
		setSize() {}
		loadSkin() {
			return Promise.resolve();
		}
		loadCape() {
			return Promise.resolve();
		}
		dispose() {
			this.disposed = true;
		}
	},
	IdleAnimation: class {},
	WalkingAnimation: class {},
}));

beforeEach(() => {
	viewerMock.construct.mockClear();
	viewerMock.throwOnConstruct = false;
});

it("shows the default skin without requesting WebGL for a new account", () => {
	render(<MinecraftPreview label="Character" emptyTitle="Default skin" />);

	expect(viewerMock.construct).not.toHaveBeenCalled();
	expect(screen.getByText("Default skin")).toBeVisible();
	expect(
		document.querySelector('img[src="/static/skins/steve.png"]'),
	).not.toBeNull();
});

it("keeps the preview usable when WebGL creation fails", () => {
	viewerMock.throwOnConstruct = true;
	render(
		<MinecraftPreview
			label="Character"
			skinUrl="/textures/skin.png"
			previewUrl="/texture-previews/skin.png"
		/>,
	);

	expect(viewerMock.construct).toHaveBeenCalledTimes(1);
	expect(screen.getByText("2D preview")).toBeVisible();
	expect(screen.getByRole("img", { name: "Character" })).toHaveAttribute(
		"src",
		"/texture-previews/skin.png",
	);
});
