import { expect, test } from "@playwright/test";

test.use({ serviceWorkers: "allow" });

test("installed site lets download navigations reach the file server", async ({
	page,
	context,
	request,
}) => {
	const check = await (await request.get("/api/v1/auth/check")).json();
	if (!check.data.initialized) {
		const setup = await request.post("/api/v1/auth/setup", {
			data: {
				username: "e2e_admin",
				email: "e2e_admin@example.test",
				password: "E2e-Admin-Passw0rd!",
			},
		});
		expect(setup.ok()).toBeTruthy();
	}
	for (const platform of ["windows", "linux"]) {
		await context.route(`**/download/${platform}`, (route) =>
			route.fulfill({
				status: 200,
				headers: {
					"Content-Type": "application/octet-stream",
					"Content-Disposition": `attachment; filename="launcher-${platform}.bin"`,
				},
				body: "download regression fixture",
			}),
		);
	}
	await page.goto("/");
	await page.evaluate(() => navigator.serviceWorker.ready);
	await page.reload();
	await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
	for (const platform of ["windows", "linux"]) {
		const link = page.locator(`a[href="/download/${platform}"]`).first();
		await expect(link).toBeVisible();
		const [download] = await Promise.all([
			page.waitForEvent("download"),
			link.click(),
		]);
		expect(download.suggestedFilename()).toBe(`launcher-${platform}.bin`);
		expect(await download.failure()).toBeNull();
	}
});
