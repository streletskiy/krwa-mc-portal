import { beforeEach, describe, expect, it } from "vitest";
import { detectLanguage, persistLanguagePreference } from "@/i18n";
import { readStorageItem, STORAGE_KEYS } from "@/lib/storage";

describe("i18n language preference", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("uses a stored language preference before browser language", () => {
		localStorage.setItem(STORAGE_KEYS.languagePreference, "ru-RU");

		expect(detectLanguage()).toBe("ru-RU");
	});

	it("persists only supported language preferences", () => {
		expect(persistLanguagePreference("pl-PL")).toBe(true);
		expect(readStorageItem("local", STORAGE_KEYS.languagePreference)).toBe(
			"pl-PL",
		);
		expect(persistLanguagePreference("ru")).toBe(true);
		expect(readStorageItem("local", STORAGE_KEYS.languagePreference)).toBe(
			"ru-RU",
		);

		expect(persistLanguagePreference("fr-FR")).toBe(false);
		expect(persistLanguagePreference("zh-CN")).toBe(false);
		expect(readStorageItem("local", STORAGE_KEYS.languagePreference)).toBe(
			"ru-RU",
		);
	});
});
