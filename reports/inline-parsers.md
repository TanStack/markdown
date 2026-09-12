# Inline source parser proposal

Baseline: `eb6ef72496aa2c5b2916a1545064307041529024`. Runtime: `v26.7.0`.

This new extension API adds core dispatch code. The proposed measured ceilings below replace the previous exact ceilings; accepting the API therefore also requires accepting this explicit size increase. Standalone existing extensions are unchanged. No runtime dependency is added.

| Entry | Gzip before | Gzip after | Delta |
| --- | ---: | ---: | ---: |
| parser only | 4975 | 5283 | +308 |
| html renderer no highlighter | 6807 | 7116 | +309 |
| react adapter | 6722 | 7026 | +304 |
| octane adapter | 6727 | 7033 | +306 |

CommonMark accounting: 403 → 403; no established matches lost.

The existing revision comparison warms both implementations and alternates their execution over nine rounds. These are local Node measurements with the extension disabled, not browser performance claims.

| Fixture | Parse + render before (ms) | After (ms) | Ratio |
| --- | ---: | ---: | ---: |
| ai-response.md (parseRender) | 0.01933 | 0.01951 | 1.01× |
| ai-response.md (streaming) | 0.22550 | 0.23448 | 1.04× |
| code-heavy.md (parseRender) | 0.01066 | 0.01088 | 1.02× |
| malformed.md (parseRender) | 0.00374 | 0.00383 | 1.02× |
| prose-heavy.md (parseRender) | 0.01852 | 0.01860 | 1.00× |
| small-doc.md (parseRender) | 0.01291 | 0.01298 | 1.01× |
| tables-lists.md (parseRender) | 0.02851 | 0.02877 | 1.01× |
| long-prose (parseRender) | 0.01856 | 0.01857 | 1.00× |
| unmatched-brackets (parseRender) | 0.03279 | 0.03293 | 1.00× |

Reproduce:

```sh
pnpm exec tsx scripts/compare-revision.mjs eb6ef72496aa2c5b2916a1545064307041529024
pnpm run verify
```

The comparison writes full paired samples to `artifacts/audit-comparison.json`. Hook-specific tests cover ordinary-text dispatch, literal markers, escape and code precedence, source ownership, shared scan/depth limits, invalid consumption, link context, AST serialization, and HTML/React/Octane parity.
