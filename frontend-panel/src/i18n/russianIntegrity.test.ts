import { describe, expect, it } from "vitest";
import { resources } from "./resources";

function flatten(value: unknown, prefix = ""): Record<string, string> {
	if (typeof value === "string") return { [prefix]: value };
	return Object.assign(
		{},
		...Object.entries(value as object).map(([key, child]) =>
			flatten(child, prefix ? `${prefix}.${key}` : key),
		),
	);
}

describe("Russian locale integrity", () => {
	it("covers every English message and preserves interpolation variables", () => {
		const en = flatten(resources["en-US"].frontend);
		const ru = flatten(resources["ru-RU"].frontend);
		expect(Object.keys(ru).sort()).toEqual(Object.keys(en).sort());
		const variables = (text: string) =>
			[...text.matchAll(/\{\{\s*([^},]+)(?:,[^}]+)?\s*\}\}/g)]
				.map((match) => match[1].trim())
				.sort();
		for (const [key, text] of Object.entries(en)) {
			expect(ru[key].trim(), key).not.toBe("");
			expect(variables(ru[key]), key).toEqual(variables(text));
		}
	});
});
