import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { type APIRequestContext, expect, test } from "@playwright/test";

async function post(request: APIRequestContext, route: string, data: unknown) {
	const csrf = (await request.storageState()).cookies.find(
		(c) => c.name === "aster_csrf",
	)?.value;
	return request.post(`/api/v1${route}`, {
		data,
		headers: csrf ? { "X-CSRF-Token": csrf } : {},
	});
}

test("player registration, skin and password stay separate from administration", async ({
	page,
	request,
}) => {
	const check = await (await request.get("/api/v1/auth/check")).json();
	if (!check.data.initialized) {
		const setup = await post(request, "/auth/setup", {
			username: "e2e_admin",
			email: "e2e_admin@example.test",
			password: "E2e-Admin-Passw0rd!",
		});
		expect(setup.ok()).toBeTruthy();
	}
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
	await expect(page.getByRole("checkbox")).toBeChecked();
	await page.locator('button[type="submit"]').click();
	await expect(page).toHaveURL(/\/account$/);
	await expect(page.locator('a[href^="/admin"]')).toHaveCount(0);
	await expect(
		page.locator("button").filter({ hasText: /^Upload skin$/ }),
	).toBeVisible();
	await expect(
		page.getByLabel("Current password", { exact: true }),
	).toBeVisible();
	await expect(page.getByLabel("New email", { exact: true })).toBeVisible();
	await expect(
		page.getByText(/Passkeys|Linked accounts|Devices and sign-out/, {
			exact: true,
		}),
	).toHaveCount(0);

	for (const route of [
		"/overview",
		"/users",
		"/config",
		"/audit-logs",
		"/tasks",
		"/system-info",
	]) {
		expect((await page.request.get(`/api/v1/admin${route}`)).status()).toBe(
			403,
		);
	}
	await page.goto("/account/profiles");
	await expect(
		page.getByRole("button", { name: "Create profile", exact: true }),
	).toHaveCount(0);
	const before = await (
		await page.request.get("/api/v1/profiles/minecraft")
	).json();
	const rejected = await post(page.request, "/profiles/minecraft", {
		name: `p_${randomBytes(5).toString("hex")}`,
	});
	expect(rejected.status()).toBe(403);
	expect(
		await (await page.request.get("/api/v1/profiles/minecraft")).json(),
	).toEqual(before);
	const profile = before.data.items[0];
	const csrfHeaders = async () => ({
		"X-CSRF-Token":
			(await page.request.storageState()).cookies.find(
				(c) => c.name === "aster_csrf",
			)?.value ?? "",
	});
	const fixture = (name: string) =>
		path.resolve(
			`../crates/aster-texture-renderer/tests/fixtures/skins/${name}.png`,
		);
	const textures = async () =>
		(
			await (
				await page.request.get(
					`/api/v1/profiles/minecraft/${profile.id}/textures`,
				)
			).json()
		).data;
	for (const method of ["delete", "rename", "unbind"] as const) {
		const suffix =
			method === "rename"
				? "/name"
				: method === "unbind"
					? "/textures/skin"
					: "";
		const response = await page.request.fetch(
			`/api/v1/profiles/minecraft/${profile.id}${suffix}`,
			{
				method: method === "rename" ? "PUT" : "DELETE",
				data: method === "rename" ? { name: "changed_name" } : undefined,
				headers: await csrfHeaders(),
			},
		);
		expect(response.status()).toBe(403);
	}
	const capes = await page.request.get("/api/v1/wardrobe/textures");
	expect(capes.status()).toBe(200);
	expect((await capes.json()).data.items).toEqual([]);
	expect(
		(
			await page.request.put(
				`/api/v1/profiles/minecraft/${profile.id}/textures/skin`,
				{ data: { texture_id: 1 }, headers: await csrfHeaders() },
			)
		).status(),
	).toBe(403);
	expect(
		(
			await page.request.put(
				`/api/v1/profiles/minecraft/${"0".repeat(32)}/skin`,
				{
					multipart: {
						file: {
							name: "skin.png",
							mimeType: "image/png",
							buffer: readFileSync(fixture("blue")),
						},
					},
					headers: await csrfHeaders(),
				},
			)
		).status(),
	).toBe(403);
	await page.locator("#player-skin-file").setInputFiles(fixture("blue"));
	await expect(
		page.getByRole("status").filter({ hasText: "Skin updated." }),
	).toBeVisible();
	const firstSkin = await textures();
	expect(
		firstSkin.filter(
			(v: { texture_type: string }) => v.texture_type === "skin",
		),
	).toHaveLength(1);
	// Invalid content must not replace the currently applied skin.
	await page.locator("#player-skin-file").setInputFiles({
		name: "invalid.png",
		mimeType: "image/png",
		buffer: Buffer.from("not a png"),
	});
	await expect(page.getByRole("alert")).toBeVisible();
	expect(await textures()).toEqual(firstSkin);
	const badUpload = await page.request.put(
		`/api/v1/profiles/minecraft/${profile.id}/skin`,
		{
			multipart: {
				file: {
					name: "invalid.png",
					mimeType: "image/png",
					buffer: Buffer.from("not a png"),
				},
			},
			headers: await csrfHeaders(),
		},
	);
	expect(badUpload.status()).toBe(400);
	expect(await textures()).toEqual(firstSkin);
	// Selecting the same file again must still trigger a successful upload.
	await page.locator("#player-skin-file").setInputFiles(fixture("blue"));
	await expect(
		page.getByRole("status").filter({ hasText: "Skin updated." }),
	).toBeVisible();
	await page.locator("#player-skin-file").setInputFiles(fixture("alex"));
	await expect(
		page.getByRole("status").filter({ hasText: "Skin updated." }),
	).toBeVisible();
	const secondSkin = await textures();
	expect(secondSkin).toHaveLength(1);
	expect(secondSkin[0].texture_model).toBe("slim");
	expect(secondSkin[0].url).not.toBe(firstSkin[0].url);
	// Simultaneous uploads still leave one active skin and the same immutable UUID/name.
	const headers = await csrfHeaders();
	const competing = await Promise.all(
		["blue", "orange"].map((name) =>
			page.request.put(`/api/v1/profiles/minecraft/${profile.id}/skin`, {
				headers,
				multipart: {
					file: {
						name: "skin.png",
						mimeType: "image/png",
						buffer: readFileSync(fixture(name)),
					},
				},
			}),
		),
	);
	expect(competing.map((r) => r.status())).toEqual([200, 200]);
	expect(await textures()).toHaveLength(1);
	expect(
		await (await page.request.get("/api/v1/profiles/minecraft")).json(),
	).toEqual(before);
	await page.goto("/account/wardrobe");
	await expect(page).toHaveURL(/\/account\/profiles$/);
	await expect(page.locator("canvas")).toBeVisible();
	await page.waitForTimeout(500);
	await page.screenshot({
		path: "../tmp/minimal-skin-desktop.png",
		fullPage: true,
	});
	for (const width of [390, 768]) {
		await page.setViewportSize({ width, height: 844 });
		await expect(page.locator("#player-skin-file")).toBeAttached();
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= innerWidth,
			),
		).toBeTruthy();
		await page.screenshot({
			path: `../tmp/minimal-skin-${width}.png`,
			fullPage: true,
		});
	}
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto("/account/settings#security");
	await page.getByLabel("Current password", { exact: true }).fill(password);
	await page.getByLabel("New password", { exact: true }).fill(`${password}2`);
	await page
		.getByLabel("Repeat new password", { exact: true })
		.fill(`${password}2`);
	await page
		.getByRole("button", { name: "Change password", exact: true })
		.click();
	await expect(
		page.getByRole("status").filter({ hasText: "Password changed." }),
	).toBeVisible();
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/account");
	await expect(
		page.getByRole("heading", { name: "Account & password" }),
	).toBeVisible();
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= innerWidth,
		),
	).toBeTruthy();
});
