# Compatibility Within the Audited Budget

This pass starts from the working tree produced by the [first September 11 audit](./audit-2026-09-11.md), not the larger published 0.0.13 build. The source snapshot is `/private/tmp/markdown-compat-baseline.Ql4J5n/src`. No dependencies, public options, package versions, or bundle ceilings were increased.

## What Changed

- Tight outer lists stay tight when a nested list is loose. Paragraph separation at the item's own level still makes it loose, and task labels remain inline with their checkboxes.
- Indented fences remove the opening fence's indentation from their code. Blank lines inside list code blocks are preserved instead of collapsed.
- Empty link destinations remain links. Inline and reference destinations share parsing for quoted and parenthesized titles, reject malformed destinations, and unescape ASCII punctuation before protocol screening.
- Inner Markdown links disable their outer opener, including links inside emphasis. Linked images still work, and image descriptions do not create nested anchors or invisible footnote references.
- Footnotes ending in code, lists, blockquotes, or no blocks receive back-links. Existing reference IDs and AST structure are preserved.
- Callouts stop at unquoted blank lines, so they do not consume a following callout or hide paragraph separation in a containing list. Quoted blank lines remain inside a callout.
- Comment attributes preserve prototype-shaped names as data. Matched comment bodies are copied once; unmatched bodies no longer accumulate an unused line array.
- React and Octane list rendering avoids rest-array copies and per-block `flatMap` arrays. Shared footnote helpers, simpler underscore checks, and consolidated block checks recover bytes without changing their supported behavior.
- Native searches reject missing closing delimiters before a character-by-character balance scan. These searches still charge the shared work budget.

## Size

Every one of the 22 measured import shapes is smaller or unchanged in minified, gzip, and Brotli bytes. This includes narrow imports and complete namespace imports of all 12 public entry points. Framework runtimes are externalized.

| Entry | Gzip Before | Gzip After | Brotli Before | Brotli After |
| --- | ---: | ---: | ---: | ---: |
| Parser | 4,948 | 4,941 | 4,559 | 4,555 |
| HTML | 6,737 | 6,730 | 6,169 | 6,161 |
| React | 6,682 | 6,648 | 6,153 | 6,107 |
| Octane | 6,681 | 6,649 | 6,145 | 6,108 |
| React with streaming | 6,868 | 6,835 | 6,316 | 6,282 |
| Docs preset | 2,334 | 2,292 | 2,121 | 2,073 |
| Callouts | 372 | 335 | 329 | 278 |
| Streaming | 311 | 311 | 253 | 253 |
| Tabs | 1,232 | 1,221 | 1,094 | 1,082 |

The permanent tests enforce the starting values in all three formats. The [generated size report](./sizes.md) also includes full namespace imports.

## Performance

Two independent comparisons used Node 24.15.0, the same esbuild version, 1,000 warmup calls per path, and nine alternating timing samples. Normal-document parse-and-HTML times stayed within about 3% of the starting implementation. Streaming stayed within about 1%. React and Octane SSR showed no repeatable material slowdown; their small timing differences varied between runs.

Rendering 32,000 unmatched brackets improved from 0.647 to 0.048 ms in one warmed run and 0.674 to 0.054 ms in the other, roughly 12-13 times faster. This is a synthetic stress case, not a typical-document speedup.

An earlier, lightly warmed run had isolated SSR outliers. The stronger warmup and independent repeat did not reproduce those slowdowns. Raw runs are retained alongside the source snapshot as `comparison-final-1.json`, `comparison-warm-1.json`, and `comparison-warm-2.json`. These measurements do not guarantee unchanged performance for every input or establish browser or allocation behavior.

## Compatibility And Verification

- CommonMark matches increased from 377 to 403 of 652, with no lost matches. All 403 are individually protected. These are normalized comparisons against [CommonMark 0.31.2](https://spec.commonmark.org/0.31.2/), not full conformance.
- All 203 tests pass. This pass adds 46 focused regression cases and a full-public-entry bundle test. Applicable rendering cases check HTML, React SSR, and Octane SSR.
- `pnpm run verify` passed, including tests, typechecking, build, docs, skills, conformance, sizes, benchmarks, and package dry run.
- Both full corpus audits passed: 10,517 external Markdown files across 20 pinned repositories and 6,308 TanStack Markdown files across 26 local repositories. The local audit still skips unavailable tracked paths. MDX is inventoried, not parsed.

Side-by-side output comparisons use the same files and Marked version for both parser revisions:

| Corpus | Profile | Changed Files | Gained Exact Matches | Lost Exact Matches | New Content Differences |
| --- | --- | ---: | ---: | ---: | ---: |
| External | Core | 418 | 107 | 0 | 0 |
| External | Docs extensions | 489 | 68 | 0 | 0 |
| TanStack | Core | 1 | 0 | 0 | 0 |
| TanStack | Docs extensions | 23 | 0 | 0 | 0 |

These are profile-specific comparisons, not counts of unique newly supported documents. Existing differences against Marked remain, including unsupported syntax and intentional extensions. A zero in the last column means the classifier found no newly introduced content-difference category, not proof of identical browser behavior.

## Remaining Work

- Balanced, fence-aware comment components and elimination of their repeated unmatched scans. This pass reduces allocation, not their worst-case complexity.
- Container-aware reference-definition collection, including fences opened on list-marker lines.
- Collision-free IDs when repeated footnote references overlap another footnote's normalized name. Existing IDs were not renamed to work around the collision.
- Further destination grammar, emphasis precedence, hard breaks, and quoted HTML handling.
- Inline Markdown in callout titles. A quote-separation prototype gained one CommonMark example but made an existing link-bearing custom title render literally. That change was removed, preserving the existing quote grouping until both behaviors can be handled together.
- Browser hydration, allocation profiling, and long-running streaming UI measurements. Node and SSR benchmarks do not establish these properties.

## Reproduce

```bash
pnpm run verify
node --import tsx scripts/audit-external-corpus.ts
node --import tsx scripts/audit-tanstack-corpus.ts
node --import tsx scripts/compare-revision.mjs /private/tmp/markdown-compat-baseline.Ql4J5n --corpus
```

The comparison command also accepts a Git revision. It writes sizes, compatibility gains, raw timing samples, and per-document changes to `artifacts/audit-comparison.json`. Run it without competing CPU-heavy work. No release, commit, or push was performed in this pass.
