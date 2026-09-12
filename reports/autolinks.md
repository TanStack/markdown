# Optional HTTP(S) autolinks

This proposal depends on the inline source parser API. It keeps automatic URL linking opt-in, addressing the core profile’s existing non-goal without changing default rendering. It intentionally does not promise full GFM autolink behavior.

The separate public extension bundle is 994 bytes minified, 632 bytes gzip, and 568 bytes Brotli. All 22 existing measured import shapes are byte-for-byte unchanged in size relative to the inline-parser commit. No runtime dependency or renderer-specific implementation is added.

The revision comparison retains all 403 established CommonMark matches with the extension disabled. The 45 extension tests cover URL punctuation, delimiters, source spelling, code/link exclusions, URL policy, malformed input, serialization, and HTML/React/Octane rendering.

These synthetic measurements use `v26.7.0`, seven alternating warmed rounds, and median milliseconds per render. Enabled and disabled profiles perform different work and can produce different HTML; this is an overhead measurement, not an equivalent-feature renderer comparison. Browser performance is unmeasured.

| Fixture | Core (ms) | Autolinks enabled (ms) |
| --- | ---: | ---: |
| plain comment | 0.00094 | 0.00305 |
| URL comment | 0.00211 | 0.00394 |
| punctuation | 0.00124 | 0.00319 |
| malformed 9000 chars | 0.00336 | 0.13189 |
| malformed 18000 chars | 0.00585 | 0.27066 |
| malformed 36000 chars | 0.01047 | 0.49776 |

The repeated malformed-prefix cases exercise increasing input sizes; the implementation consumes a failed HTTP(S) candidate as one text range instead of retrying every prefix in its suffix. These observations cover this fixture, not arbitrary extension code.

Reproduce:

```sh
pnpm exec tsx scripts/compare-revision.mjs b70affe --no-bench
pnpm exec tsx scripts/bench-autolinks.ts
pnpm run verify
```
