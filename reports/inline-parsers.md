# Inline source parser candidate

Baseline: `1b7dc5410e2fd66f95e2eb557650403579fe530b`. Runtime: `v24.21.0`. This is an isolated inclusion proposal, not an approved 1.0 API decision.

The two original PR #19 commits retain Silouan Wright as author. Generated reports and size ceilings were rebased onto the current streaming implementation rather than restoring the older PR ceilings. No runtime dependency is added.

| Entry | Gzip before | Gzip after | Delta |
| --- | ---: | ---: | ---: |
| parser only | 4894 | 5196 | +302 |
| html renderer no highlighter | 6729 | 7027 | +298 |
| react adapter | 6676 | 6974 | +298 |
| octane adapter | 6644 | 6941 | +297 |
| react adapter with streaming extension | 6860 | 7157 | +297 |

CommonMark: 403 → 403, no established matches lost.

Paired measurements warm both implementations and alternate order across nine rounds, with the hook disabled. These are local Node measurements, not browser timing claims.

| Fixture/mode | Before ms | After ms | Ratio |
| --- | ---: | ---: | ---: |
| ai-response.md / parseRender | 0.02316 | 0.02122 | 0.92x |
| ai-response.md / streaming | 0.23267 | 0.25443 | 1.09x |
| code-heavy.md / parseRender | 0.01062 | 0.01115 | 1.05x |
| malformed.md / parseRender | 0.00336 | 0.00336 | 1.00x |
| prose-heavy.md / parseRender | 0.01874 | 0.01837 | 0.98x |
| small-doc.md / parseRender | 0.01303 | 0.01319 | 1.01x |
| tables-lists.md / parseRender | 0.03009 | 0.03114 | 1.03x |
| long-prose / parseRender | 0.02170 | 0.02177 | 1.00x |
| unmatched-brackets / parseRender | 0.04778 | 0.04811 | 1.01x |

All paired samples are in `artifacts/audit-comparison.json` (local artifact). Reproduce with Node 24:

```sh
pnpm exec tsx scripts/compare-revision.mjs 1b7dc5410e2fd66f95e2eb557650403579fe530b
pnpm run verify
```

The new tests cover callback ordering, literal markers including UTF-16 surrogate handling, escape/code precedence, image-alt exclusion, container boundaries, nested link handling, shared scan/depth limits, invalid lengths and HTML/React/Octane parity. Callbacks and returned ASTs are trusted; callback work and URL policy are application responsibilities.
