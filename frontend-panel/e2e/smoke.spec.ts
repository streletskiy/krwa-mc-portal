import { expect, type Page, test } from "@playwright/test";

const adminUsername = "e2e_admin";
const adminPassword = "E2e-Admin-Passw0rd!";
const adminEmail = "e2e_admin@example.test";

async function ensureInitialized(page: Page) {
	await page.goto("/init");
	if (
		await page
			.getByRole("heading", { name: "Setup already complete" })
			.isVisible()
	) {
		return;
	}

	await page.getByLabel("Username").fill(adminUsername);
	await page.getByLabel("Email").fill(adminEmail);
	await page
		.getByRole("textbox", { exact: true, name: "Password" })
		.fill(adminPassword);
	await page.getByLabel("Confirm password").fill(adminPassword);
	await page.getByRole("button", { name: "Create admin" }).click();
	await expect(page).toHaveURL(/\/account$/);
	await page.getByRole("button", { name: adminUsername }).click();
	await page.getByRole("menuitem", { name: "Logout" }).click();
	await expect(page).toHaveURL(/\/$/);
}

async function loginAsAdmin(page: Page) {
	await ensureInitialized(page);
	await page.goto("/login");
	await page.getByLabel("Email or username").fill(adminUsername);
	await page
		.getByRole("textbox", { exact: true, name: "Password" })
		.fill(adminPassword);
	await page.getByRole("button", { name: "Login" }).click();
	await expect(page).toHaveURL(/\/account$/);
}

test("serves the player entry screen", async ({ page }) => {
	await ensureInitialized(page);

	await page.goto("/");
	await expect(page).toHaveURL(/\/$/);
	await expect(
		page.getByRole("heading", { name: "Build more. Play together." }),
	).toBeVisible();
	await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
	await expect(page.locator('a[href="/download/windows"]')).toHaveCount(1);
	await expect(page.locator('a[href="/download/linux"]')).toHaveCount(1);
	await expect(page.locator('a[href="/download/linux-deb"]')).toHaveCount(1);
	await expect(page.locator('a[href="/download/linux-arch"]')).toHaveCount(1);
	for (const width of [390, 768, 1280, 1440]) {
		await page.setViewportSize({ width, height: 900 });
		await expect
			.poll(() =>
				page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
			)
			.toBe(true);
	}
});

test("shows login as a standalone route and protects account routes", async ({
	page,
}) => {
	await ensureInitialized(page);

	await page.goto("/login");
	await expect(page).toHaveURL(/\/login$/);
	await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
	await expect(page.getByLabel("Email or username")).toBeVisible();
	await expect(
		page.getByRole("textbox", { exact: true, name: "Password" }),
	).toBeVisible();
	await page.getByRole("link", { name: "Register now" }).click();
	await expect(page).toHaveURL(/\/register$/);
	await expect(
		page.getByRole("heading", { name: "Create account" }),
	).toBeVisible();
	await expect(page.getByLabel("Confirm password")).toBeVisible();
	await page.getByRole("link", { name: "Login" }).click();
	await expect(page).toHaveURL(/\/login$/);

	await page.goto("/account");
	await expect(
		page.getByRole("heading", { name: "Login required" }),
	).toBeVisible();
	await expect(page.getByRole("link", { name: "Go to login" })).toHaveAttribute(
		"href",
		"/login",
	);
});

test("keeps the public entry usable on mobile", async ({ page }) => {
	await ensureInitialized(page);

	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/");

	await expect(
		page.getByRole("link", { name: "Create account" }).first(),
	).toBeVisible();
	await expect(
		page.getByRole("link", { name: /Windows/ }).first(),
	).toBeVisible();
});

test("keeps app topbar compact across account and admin shells", async ({
	page,
}) => {
	await loginAsAdmin(page);

	await page.setViewportSize({ width: 390, height: 844 });
	await expect(page).toHaveURL(/\/account$/);
	const config = await page.request.get("/api/v1/public/frontend-config");
	expect(config.ok()).toBe(true);
	const { data } = await config.json();
	await expect(
		page.getByRole("banner").getByRole("link", { name: data.branding.title }),
	).toBeVisible();
	await expect(
		page.getByPlaceholder("Search players, UUIDs, sessions, or settings..."),
	).toHaveCount(0);
	await expect(page.getByText("⌘K")).toHaveCount(0);

	await page.setViewportSize({ width: 1440, height: 960 });
	await expect(
		page.getByPlaceholder("Search players, UUIDs, sessions, or settings..."),
	).toHaveCount(0);
	await expect(page.getByText("⌘K")).toHaveCount(0);

	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/admin/settings");
	await expect(page).toHaveURL(/\/admin\/settings$/);
	await expect(page.getByRole("banner").getByRole("link")).toBeVisible();
	await expect(
		page.getByPlaceholder("Search players, UUIDs, sessions, or settings..."),
	).toHaveCount(0);
	await expect(page.getByText("⌘K")).toHaveCount(0);
});

test("administrators can reach the configured world manager from their account and both navigation menus", async ({
	page,
}) => {
	await loginAsAdmin(page);
	await page.getByRole("button", { name: adminUsername }).click();
	await page.getByRole("menuitem", { name: "Admin", exact: true }).click();
	await expect(page).toHaveURL(/\/admin$/);

	const worldPath = "/api/offline-worlds/workspace";
	await page.route(
		(url) => url.pathname === worldPath,
		(route) =>
			route.fulfill({
				contentType: "text/html",
				body: "<h1>World manager</h1>",
			}),
	);
	for (const width of [1440, 390]) {
		await page.setViewportSize({ width, height: 900 });
		await page.goto("/admin/settings/site");
		if (width === 390)
			await page.getByRole("button", { name: "Open navigation" }).click();
		await page
			.getByRole("navigation")
			.getByRole("link", { name: "Offline worlds" })
			.click();
		await expect(
			page
				.frameLocator("iframe")
				.getByRole("heading", { name: "World manager" }),
		).toBeVisible();
	}
});

test("phone sign-in resumes the scanned device and issues one game session", async ({
	page,
	request,
}) => {
	await ensureInitialized(page);
	const username = "Phone" + Date.now().toString(36);
	const password = "E2e-Device-Passw0rd!";
	const created = await request.post("/api/v1/auth/register", {
		data: { username, email: username + "@example.test", password },
	});
	expect(created.ok()).toBe(true);
	const device = "/api/v1/launcher-device/";
	const start = await request.post(device + "start", {
		data: { client_token: "paired-deck" },
	});
	expect(start.ok()).toBe(true);
	const { code, secret } = await start.json();
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/device?code=" + code);
	await expect(page).toHaveURL(/\/login\?/);
	await page.getByLabel("Email or username").fill(username);
	await page
		.getByRole("textbox", { exact: true, name: "Password" })
		.fill(password);
	await page.getByRole("button", { name: "Login" }).click();
	await expect(page).toHaveURL(new RegExp("/device\\?code=" + code + "$"));
	await expect(
		page.getByText(code.slice(-6).toUpperCase(), { exact: true }),
	).toBeVisible();
	await page.getByRole("button", { name: "Approve sign-in" }).click();
	await expect(
		page.getByRole("status").filter({ hasText: "Approved." }),
	).toBeVisible();
	const poll = () => request.post(device + "poll", { data: { code, secret } });
	const result = await poll();
	expect(result.status()).toBe(200);
	const session = await result.json();
	expect(session.selectedProfile.name).toBe(username);
	expect(
		(
			await request.post("/api/yggdrasil/authserver/validate", {
				data: { accessToken: session.accessToken, clientToken: "paired-deck" },
			})
		).status(),
	).toBe(204);
	expect((await poll()).status()).toBe(410);
});
