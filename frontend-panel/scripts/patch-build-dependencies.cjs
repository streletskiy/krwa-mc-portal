// Redocly 1.x expects minimatch's former callable CommonJS export.
// Keep its OpenAPI generation API while using the patched upstream matcher.
const fs = require("node:fs");
const file = require.resolve("@redocly/openapi-core/lib/utils.js");
const source = fs.readFileSync(file, "utf8");
const before = 'const minimatch = require("minimatch");';
const after = 'const { minimatch } = require("minimatch");';
if (!source.includes(after)) {
	if (!source.includes(before)) {
		throw new Error("Review the Redocly minimatch adapter after updating it");
	}
	fs.writeFileSync(file, source.replace(before, after));
}
