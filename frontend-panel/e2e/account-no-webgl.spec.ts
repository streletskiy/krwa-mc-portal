import { randomBytes } from "node:crypto";
import { expect, test } from "@playwright/test";

test("a new player can use the account when WebGL is unavailable", async ({
	page,
	request,
}) => {
	const check = await (await request.get("/api/v1/auth/check")).json();
	if (!check.data.initialized) {
		const csrf = (await request.storageState()).cookies.find(
			(cookie) => cookie.name === "aster_csrf",
		)?.value;
		const setup = await request.post("/api/v1/auth/setup", {
			headers: csrf ? { "X-CSRF-Token": csrf } : {},
			data: {
				username: "e2e_admin",
				email: "e2e_admin@example.test",
				password: "E2e-Admin-Passw0rd!",
			},
		});
		expect(setup.ok()).toBeTruthy();
	}

	await page.addInitScript(() => {
		const original = HTMLCanvasElement.prototype.getContext;
		HTMLCanvasElement.prototype.getContext = function (contextId, options) {
			if (String(contextId).includes("webgl")) return null;
			return Reflect.apply(original, this, [contextId, options]);
		} as typeof HTMLCanvasElement.prototype.getContext;
	});

	const username = `p_${randomBytes(5).toString("hex")}`;
	const password = `${randomBytes(20).toString("hex")}Aa1!`;
	await page.goto("/register");
	await page.getByLabel("Minecraft nickname", { exact: true }).fill(username);
	await page
		.getByLabel("Email", { exact: true })
		.fill(`${username}@example.test`);
	await page.getByLabel("Password", { exact: true }).fill(password);
	await page.getByLabel("Confirm password", { exact: true }).fill(password);
	await page
		.locator("label")
		.filter({ has: page.getByRole("checkbox") })
		.click();
	await page.locator('button[type="submit"]').click();

	await expect(page).toHaveURL(/\/account$/);
	await expect(page.getByText("2D preview")).toBeVisible();
	await expect(page.getByRole("img", { name: username })).toBeVisible();
	await expect(
		page.locator("button").filter({ hasText: /^Upload skin$/ }),
	).toBeVisible();
	await expect(
		page.getByLabel("Current password", { exact: true }),
	).toBeVisible();
	await expect(page.getByText("ERR_ROUTE_LOAD_FAILED")).toHaveCount(0);
});
