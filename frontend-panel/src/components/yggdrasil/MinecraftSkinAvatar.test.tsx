import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MinecraftSkinAvatar } from "./MinecraftSkinAvatar";

describe("MinecraftSkinAvatar", () => {
	it("keeps head UV coordinates aligned for legacy and modern skins, including HD", () => {
		const { container } = render(
			<MinecraftSkinAvatar name="Hair" skinUrl="/textures/hair.png" />,
		);
		const images = container.querySelectorAll("img");
		for (const [width, height, percent, translateY] of [
			[64, 32, "400%", "-25%"],
			[128, 64, "400%", "-25%"],
			[64, 64, "800%", "-12.5%"],
			[128, 128, "800%", "-12.5%"],
		] as const) {
			for (const [index, image] of [...images].entries()) {
				Object.defineProperties(image, {
					naturalWidth: { configurable: true, value: width },
					naturalHeight: { configurable: true, value: height },
				});
				fireEvent.load(image);
				expect(image).toHaveStyle({
					height: percent,
					transform: `translate(${index === 0 ? "-12.5%" : "-62.5%"}, ${translateY})`,
				});
			}
		}
	});

	it("renders the base head layer and a larger armor layer from a skin texture", () => {
		render(
			<MinecraftSkinAvatar
				name="Steve"
				skinUrl="/textures/steve.png"
				testId="skin-avatar"
				imageTestId="skin-avatar-image"
			/>,
		);

		const avatar = screen.getByTestId("skin-avatar");
		const layers = avatar.querySelectorAll(
			'[data-slot="minecraft-skin-avatar-layer"]',
		);
		expect(layers).toHaveLength(2);
		expect(layers[0]).toHaveClass("inset-[2px]");
		expect(layers[1]).toHaveClass("inset-0");

		const image = screen.getByTestId("skin-avatar-image");
		expect(image).toHaveAttribute("src", "/textures/steve.png");
		expect(image).toHaveAttribute("crossorigin", "anonymous");
		expect(image).toHaveAttribute("draggable", "false");
		expect(image).toHaveStyle({
			transform: "translate(-12.5%, -12.5%)",
		});
		expect(layers[1]?.querySelector("img")).toHaveStyle({
			transform: "translate(-62.5%, -12.5%)",
		});
	});

	it("renders a fallback icon when no skin URL is available", () => {
		render(<MinecraftSkinAvatar name="Steve" skinUrl={null} />);

		expect(screen.queryByRole("img")).not.toBeInTheDocument();
		expect(
			document.querySelector('[data-slot="minecraft-skin-avatar-layer"]'),
		).not.toBeInTheDocument();
	});

	it("falls back when the skin image fails to load", () => {
		render(
			<MinecraftSkinAvatar
				name="Steve"
				skinUrl="/textures/broken.png"
				imageTestId="skin-avatar-image"
			/>,
		);

		fireEvent.error(screen.getByTestId("skin-avatar-image"));

		expect(screen.queryByTestId("skin-avatar-image")).not.toBeInTheDocument();
		expect(
			document.querySelector('[data-slot="minecraft-skin-avatar-layer"]'),
		).not.toBeInTheDocument();
	});
});
