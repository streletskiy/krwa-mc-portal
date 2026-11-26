# Temporary deepmerge security fork

Based on deepmerge 4.3.1 (MIT; see LICENSE). GHSA-gcqx-w48m-w2h4 has no
upstream patched release as of 2026-11-02. All three destination writes use
own data properties, so copying an own `__proto__` key cannot change the
returned object's prototype. Array and custom merge behavior is preserved.
Remove this fork when the upstream package or Rollup removes the vulnerable code.
