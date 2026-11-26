import { describe, expect, it } from "vitest";
import { resources } from "@/i18n/resources";

function flattenStrings(
	value: unknown,
	prefix = "",
	result = new Map<string, string>(),
) {
	if (typeof value === "string") {
		result.set(prefix, value);
		return result;
	}
	if (value && typeof value === "object") {
		for (const [key, nested] of Object.entries(value)) {
			flattenStrings(nested, prefix ? `${prefix}.${key}` : key, result);
		}
	}
	return result;
}

function interpolationTokens(value: string) {
	return [...value.matchAll(/\{\{.*?\}\}/g)].map(([token]) => token).sort();
}

describe("translation resources", () => {
	it("keeps the Russian dictionary complete and interpolation-safe", () => {
		const english = flattenStrings(resources["en-US"].frontend);
		const russian = flattenStrings(resources["ru-RU"].frontend);

		expect([...russian.keys()].sort()).toEqual([...english.keys()].sort());
		for (const [key, source] of english) {
			expect(interpolationTokens(russian.get(key) ?? ""), key).toEqual(
				interpolationTokens(source),
			);
		}
	});
});
