import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const merge = require("../../vendor/deepmerge/index.cjs");

describe("build configuration merging", () => {
	it("does not inherit attacker-controlled values from an own __proto__ key", () => {
		for (const attacker of [
			JSON.parse('{"__proto__":{"injected":true}}'),
			Object.assign(
				Object.create(null),
				JSON.parse('{"__proto__":{"injected":true}}'),
			),
		]) {
			for (const result of [
				merge(attacker, {}),
				merge({}, attacker),
				merge({ nested: attacker }, {}),
			]) {
				const checked = result.nested ?? result;
				expect(Object.getPrototypeOf(checked)).toBe(Object.prototype);
				expect(checked.injected).toBeUndefined();
			}
		}
		expect(({} as Record<string, unknown>).injected).toBeUndefined();
	});

	it("preserves nested configuration and Rollup's custom array merge", () => {
		expect(
			merge(
				{ nested: { first: true }, list: [1] },
				{ nested: { second: true }, list: [2] },
			),
		).toEqual({ nested: { first: true, second: true }, list: [1, 2] });
		expect(
			merge(
				{ list: [1] },
				{ list: [2] },
				{ arrayMerge: (_target: number[], source: number[]) => source },
			),
		).toEqual({ list: [2] });
	});
});
