# TanStack repository corpus

Generated: 2026-07-22T18:10:53.920Z

This report measures practical corpus behavior. Marked is a differential reference, not a correctness oracle. MDX is inventoried but not parsed.

- repositories or roots: 25
- Markdown documents: 4826
- MDX documents inventoried: 2
- source bytes: 18378547
- parse or determinism errors: 0
- content differences using only profile syntax: 30
- unexplained target docs/blog/README content differences using only profile syntax: 0
- audit time: 4740.7 ms

## Output comparison

| Result | Documents | Percent | Meaning |
| :--- | ---: | ---: | :--- |
| exact | 3582 | 74.2% | Normalized HTML matches Marked |
| serialization | 287 | 5.9% | Tag and text shape matches; attributes or serialization differ |
| structure | 667 | 13.8% | Text matches; element structure differs |
| content | 290 | 6.0% | Rendered text differs and requires triage |

## Repositories

| Repository | Revision | Dirty | Markdown | MDX | Exact | Serialization | Structure | Content | Errors |
| :--- | :--- | :---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| [ai](https://github.com/tanstack/ai) | [51c66147](https://github.com/tanstack/ai/tree/51c66147dd543e0cdd4f35e7970d52bb1cc43add) | yes | 323 | 0 | 242 | 23 | 58 | 0 | 0 |
| [bling](https://github.com/TanStack/bling) | [62703ba3](https://github.com/TanStack/bling/tree/62703ba3d204a0315ef6043d0f59c5b70c27e73d) | yes | 4 | 0 | 3 | 0 | 1 | 0 | 0 |
| [cli](https://github.com/TanStack/cli) | [8711a8b4](https://github.com/TanStack/cli/tree/8711a8b4428722a417960050871a014b3a9bc839) | yes | 111 | 2 | 79 | 0 | 23 | 9 | 0 |
| [config](https://github.com/tanstack/config) | [c7356fbf](https://github.com/tanstack/config/tree/c7356fbf42f988b1b690cc9cf57c55f14ddd3487) | no | 16 | 0 | 12 | 2 | 1 | 1 | 0 |
| [db](https://github.com/tanstack/db) | [f9b4f34b](https://github.com/tanstack/db/tree/f9b4f34b3eee273bbd956a1a9473fc6af6cad58f) | no | 547 | 0 | 354 | 14 | 173 | 6 | 0 |
| [form](https://github.com/TanStack/form) | [90118027](https://github.com/TanStack/form/tree/901180274c05ed3672fd280337499f7104fdd8cf) | no | 186 | 0 | 170 | 3 | 11 | 2 | 0 |
| [highlight](https://github.com/TanStack/highlight) | [a8ed3e6c](https://github.com/TanStack/highlight/tree/a8ed3e6c585165c9166e39afd1bd7d835a0ddf95) | no | 35 | 0 | 29 | 6 | 0 | 0 | 0 |
| [hotkeys](https://github.com/TanStack/hotkeys) | [6adcc3a1](https://github.com/TanStack/hotkeys/tree/6adcc3a1b0a28350eb421f6aeebcf0f94d177817) | no | 329 | 0 | 280 | 10 | 16 | 23 | 0 |
| [intent](https://github.com/tanstack/intent) | [e5745472](https://github.com/tanstack/intent/tree/e57454726b97f489336283d30ff7ae43e1817af4) | no | 24 | 0 | 10 | 3 | 10 | 1 | 0 |
| [markdown](https://github.com/TanStack/markdown) | [9bbe1220](https://github.com/TanStack/markdown/tree/9bbe1220c5b77ca89cadaa41d83f8172dfc1da82) | yes | 35 | 0 | 25 | 6 | 4 | 0 | 0 |
| [pacer](https://github.com/tanstack/pacer) | [556125d7](https://github.com/tanstack/pacer/tree/556125d73ff020b1f854bded14cb82e58581e3b6) | no | 334 | 0 | 301 | 1 | 13 | 19 | 0 |
| [preact](https://github.com/TanStack/preact) | [4dc9b508](https://github.com/TanStack/preact/tree/4dc9b508dd37544b858bfa52d28e12d219effdbb) | yes | 8 | 0 | 3 | 0 | 5 | 0 | 0 |
| [query](https://github.com/TanStack/query) | [f727aa9b](https://github.com/TanStack/query/tree/f727aa9bcef3b77b086888583ca04f6a19f6bcb9) | yes | 671 | 0 | 585 | 18 | 66 | 2 | 0 |
| [ranger](https://github.com/TanStack/ranger) | [5bdf4862](https://github.com/TanStack/ranger/tree/5bdf486292418cc6e71f72fa023ddb1295051f04) | no | 20 | 0 | 19 | 0 | 1 | 0 | 0 |
| [react-charts](https://github.com/TanStack/react-charts) | [e4b1c9c6](https://github.com/TanStack/react-charts/tree/e4b1c9c6306862847e2a9cfa91fcb3e42163c8d3) | no | 10 | 0 | 10 | 0 | 0 | 0 | 0 |
| [redact](https://github.com/TanStack/redact) | [e1620a13](https://github.com/TanStack/redact/tree/e1620a13aab8935c806238f117ba58559b7cd002) | no | 3 | 0 | 0 | 2 | 1 | 0 | 0 |
| [router](https://github.com/tanstack/router) | [6f882b7d](https://github.com/tanstack/router/tree/6f882b7dae8870e0f51791ec89015f75c74e4c9b) | no | 506 | 0 | 308 | 12 | 88 | 98 | 0 |
| [select](https://github.com/TanStack/select) | [1aa8f85f](https://github.com/TanStack/select/tree/1aa8f85f3312f7f891b8808f1b9688cae4a9ef2a) | yes | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| [start-evals](https://github.com/TanStack/start-evals) | [cb854d8c](https://github.com/TanStack/start-evals/tree/cb854d8c8a1a3754880913e99fbf2452c9ea1557) | yes | 741 | 0 | 474 | 134 | 103 | 30 | 0 |
| [start-rsc](https://github.com/tanstack/start-rsc) | [b5ef4abf](https://github.com/tanstack/start-rsc/tree/b5ef4abfe883d072b78e5cba24cc321b42faed10) | yes | 433 | 0 | 290 | 15 | 46 | 82 | 0 |
| [store](https://github.com/TanStack/store) | [88283a26](https://github.com/TanStack/store/tree/88283a2647a2fb2abb422cb15e3bdc4226853ac4) | no | 49 | 0 | 41 | 5 | 3 | 0 | 0 |
| [table](https://github.com/TanStack/table) | [965b55ec](https://github.com/TanStack/table/tree/965b55ec0bfb3983596d56835bc81a9e29b4ee72) | no | 167 | 0 | 152 | 4 | 11 | 0 | 0 |
| [tanstack.com](https://github.com/TanStack/tanstack.com) | [b0c08c86](https://github.com/TanStack/tanstack.com/tree/b0c08c86704b677ab5ed720a2ce27b51db4da1f9) | no | 80 | 0 | 58 | 10 | 7 | 5 | 0 |
| [virtual](https://github.com/TanStack/virtual) | [43ef13c5](https://github.com/TanStack/virtual/tree/43ef13c5002f64fa7a6f78cc3676670401370f83) | yes | 65 | 0 | 52 | 2 | 10 | 1 | 0 |
| [workflow](https://github.com/TanStack/workflow) | [70ced3cc](https://github.com/TanStack/workflow/tree/70ced3ccc78c1899a9f2ddfb6e9a2a6243ae973d) | yes | 128 | 0 | 84 | 17 | 16 | 11 | 0 |

## Content kinds

| Kind | Documents |
| :--- | ---: |
| blog | 62 |
| changes | 196 |
| docs | 2798 |
| fixture | 75 |
| other | 820 |
| readme | 875 |

## Syntax usage

| Feature | Support | Documents | Description |
| :--- | :--- | ---: | :--- |
| atx-heading | profile | 4453 | ATX heading |
| fenced-code | profile | 3060 | Fenced code block |
| frontmatter | profile | 2922 | Leading YAML-style frontmatter |
| raw-html | opt-in | 661 | Raw HTML tag |
| blockquote | profile | 498 | Block quote |
| nested-list | profile | 424 | Nested list item |
| literal-autolink | unsupported | 392 | Bare URL outside explicit link syntax |
| table | profile | 385 | Pipe table |
| callout | extension | 212 | GitHub-style callout |
| four-space-indent | review | 203 | Four-space indentation, possibly indented code |
| reference-link | profile | 165 | Reference link or image definition |
| section-marker | extension | 146 | TanStack section marker written as a reference definition |
| task-list | profile | 79 | Task list item |
| comment-component | extension | 60 | Comment-delimited docs component |
| tab-indentation | unsupported | 48 | Tab-indented content |
| delimiter-edge | review | 41 | Malformed or legacy emphasis or code delimiter usage |
| code-metadata | profile | 40 | Metadata after a fenced-code language |
| strikethrough | profile | 39 | Strikethrough delimiter |
| entity-reference | partial | 10 | Named or numeric HTML entity |
| site-template | site-extension | 9 | Liquid, JSX-comment, or site template directive |
| combined-emphasis | profile | 7 | Combined strong and emphasis delimiters |
| angle-autolink | unsupported | 4 | Angle-bracket URL or email autolink |
| fence-info-edge | review | 3 | Generated or nonstandard fenced-code info string |
| footnote | profile | 3 | Footnote reference or definition |
| setext-heading | unsupported | 2 | Setext heading |
| hard-break | profile | 2 | Backslash hard line break |
| multiline-link | review | 1 | Link or image destination split across lines |

## Highest-priority differences

These are triage leads, ordered by parser errors, content differences, structural differences, then file size.

| Repository | Path | Kind | Result | Features |
| :--- | :--- | :--- | :--- | :--- |
| start-evals | archive/legacy-harness/runs/2026-05-31T21-11-29-191Z-codex-context-v2-strict-baseline/executions/r2__codex-desktop-gpt-5__agent-native-framework-tools__server-boundary-secret__nextjs-app-router/transcript.md | other | content | atx-heading |
| start-evals | archive/legacy-harness/runs/2026-05-31T21-11-29-191Z-codex-context-v2-strict-baseline/executions/r1__codex-desktop-gpt-5__baseline__protected-settings__nextjs-app-router/transcript.md | other | content | atx-heading, nested-list |
| start-evals | archive/legacy-harness/runs/2026-05-31T21-11-29-191Z-codex-context-v2-strict-baseline/executions/r1__codex-desktop-gpt-5__agent-native-framework-tools__protected-settings__tanstack-start/transcript.md | other | content | atx-heading, nested-list |
| start-evals | archive/legacy-harness/runs/2026-05-31T21-11-29-191Z-codex-context-v2-strict-baseline/executions/r1__codex-desktop-gpt-5__agent-native-framework-tools__protected-settings__nextjs-app-router/transcript.md | other | content | atx-heading, nested-list |
| router | packages/eslint-plugin-start/no-client-code-in-server-component.md | other | content | atx-heading, fenced-code, nested-list |
| start-rsc | packages/eslint-plugin-start/no-client-code-in-server-component.md | other | content | atx-heading, fenced-code, nested-list |
| start-evals | archive/legacy-harness/runs/2026-05-31T21-11-29-191Z-codex-context-v2-strict-baseline/executions/r1__codex-desktop-gpt-5__official-docs__typed-search-dashboard__nextjs-app-router/transcript.md | other | content | atx-heading, nested-list |
| start-evals | archive/legacy-harness/runs/2026-06-08T05-58-21-915Z-evidence-debt-replace-codex-desktop-gpt-5__baseline-codex-desktop-gpt-5-baseline/executions/r1__codex-desktop-gpt-5__baseline__error-and-validation-flow__nextjs-app-router/transcript.md | other | content | atx-heading |
| start-evals | archive/legacy-harness/runs/2026-06-08T05-58-21-915Z-evidence-debt-replace-codex-desktop-gpt-5__baseline-codex-desktop-gpt-5-baseline/executions/r1__codex-desktop-gpt-5__baseline__server-boundary-secret__nextjs-app-router/transcript.md | other | content | atx-heading |
| start-evals | archive/legacy-harness/runs/2026-06-08T05-58-21-915Z-evidence-debt-replace-codex-desktop-gpt-5__baseline-codex-desktop-gpt-5-baseline/executions/r2__codex-desktop-gpt-5__baseline__server-boundary-secret__nextjs-app-router/transcript.md | other | content | atx-heading |
| start-evals | archive/legacy-harness/runs/2026-06-08T05-58-21-915Z-evidence-debt-replace-codex-desktop-gpt-5__baseline-codex-desktop-gpt-5-baseline/executions/r1__codex-desktop-gpt-5__baseline__error-and-validation-flow__tanstack-start/transcript.md | other | content | atx-heading |
| start-evals | archive/legacy-harness/runs/2026-06-06T03-49-20-675Z-publishable-second-topoff-codex-desktop-gpt-5-baseline-robust/executions/r1__codex-desktop-gpt-5__baseline__error-and-validation-flow__nextjs-app-router/transcript.md | other | content | atx-heading |
| start-evals | archive/legacy-harness/runs/2026-06-06T03-49-20-675Z-publishable-second-topoff-codex-desktop-gpt-5-baseline-robust/executions/r2__codex-desktop-gpt-5__baseline__error-and-validation-flow__nextjs-app-router/transcript.md | other | content | atx-heading |
| start-evals | archive/legacy-harness/runs/2026-06-08T05-58-21-915Z-evidence-debt-replace-codex-desktop-gpt-5__baseline-codex-desktop-gpt-5-baseline/executions/r1__codex-desktop-gpt-5__baseline__server-boundary-secret__tanstack-start/transcript.md | other | content | atx-heading |
| start-evals | archive/legacy-harness/runs/2026-06-08T05-58-21-915Z-evidence-debt-replace-codex-desktop-gpt-5__baseline-codex-desktop-gpt-5-baseline/executions/r2__codex-desktop-gpt-5__baseline__server-boundary-secret__tanstack-start/transcript.md | other | content | atx-heading |
| start-evals | archive/legacy-harness/runs/2026-06-08T05-58-21-915Z-evidence-debt-replace-codex-desktop-gpt-5__baseline-codex-desktop-gpt-5-baseline/executions/r1__codex-desktop-gpt-5__baseline__protected-settings__nextjs-app-router/transcript.md | other | content | atx-heading |
| start-evals | archive/legacy-harness/runs/2026-06-06T03-49-20-675Z-publishable-second-topoff-codex-desktop-gpt-5-baseline-robust/executions/r1__codex-desktop-gpt-5__baseline__server-boundary-secret__nextjs-app-router/transcript.md | other | content | atx-heading |
| start-evals | archive/legacy-harness/runs/2026-06-04T15-39-36-840Z-2026-06-04-codex-baseline-publishable-topoff-min/executions/r1__codex-desktop-gpt-5__baseline__error-and-validation-flow__nextjs-app-router/transcript.md | other | content | atx-heading |
| start-evals | archive/legacy-harness/runs/2026-06-06T03-49-20-675Z-publishable-second-topoff-codex-desktop-gpt-5-baseline-robust/executions/r1__codex-desktop-gpt-5__baseline__error-and-validation-flow__tanstack-start/transcript.md | other | content | atx-heading |
| start-evals | archive/legacy-harness/runs/2026-06-06T03-49-20-675Z-publishable-second-topoff-codex-desktop-gpt-5-baseline-robust/executions/r2__codex-desktop-gpt-5__baseline__error-and-validation-flow__tanstack-start/transcript.md | other | content | atx-heading |
| start-evals | archive/legacy-harness/runs/2026-06-08T05-58-21-915Z-evidence-debt-replace-codex-desktop-gpt-5__baseline-codex-desktop-gpt-5-baseline/executions/r1__codex-desktop-gpt-5__baseline__protected-settings__tanstack-start/transcript.md | other | content | atx-heading |
| start-evals | archive/legacy-harness/runs/2026-06-04T15-39-36-840Z-2026-06-04-codex-baseline-publishable-topoff-min/executions/r1__codex-desktop-gpt-5__baseline__server-boundary-secret__nextjs-app-router/transcript.md | other | content | atx-heading |
| start-evals | archive/legacy-harness/runs/2026-06-04T15-39-36-840Z-2026-06-04-codex-baseline-publishable-topoff-min/executions/r2__codex-desktop-gpt-5__baseline__server-boundary-secret__nextjs-app-router/transcript.md | other | content | atx-heading |
| start-evals | archive/legacy-harness/runs/2026-06-06T03-49-20-675Z-publishable-second-topoff-codex-desktop-gpt-5-baseline-robust/executions/r1__codex-desktop-gpt-5__baseline__server-boundary-secret__tanstack-start/transcript.md | other | content | atx-heading |
| start-evals | archive/legacy-harness/runs/2026-06-04T15-39-36-840Z-2026-06-04-codex-baseline-publishable-topoff-min/executions/r1__codex-desktop-gpt-5__baseline__error-and-validation-flow__tanstack-start/transcript.md | other | content | atx-heading |
| start-evals | archive/legacy-harness/runs/2026-06-04T15-39-36-840Z-2026-06-04-codex-baseline-publishable-topoff-min/executions/r1__codex-desktop-gpt-5__baseline__server-boundary-secret__tanstack-start/transcript.md | other | content | atx-heading |
| start-evals | archive/legacy-harness/runs/2026-06-04T15-39-36-840Z-2026-06-04-codex-baseline-publishable-topoff-min/executions/r2__codex-desktop-gpt-5__baseline__server-boundary-secret__tanstack-start/transcript.md | other | content | atx-heading |
| start-evals | archive/legacy-harness/runs/2026-06-04T15-39-36-840Z-2026-06-04-codex-baseline-publishable-topoff-min/executions/r1__codex-desktop-gpt-5__baseline__protected-settings__nextjs-app-router/transcript.md | other | content | atx-heading |
| start-evals | archive/legacy-harness/runs/2026-06-04T15-39-36-840Z-2026-06-04-codex-baseline-publishable-topoff-min/executions/r1__codex-desktop-gpt-5__baseline__protected-settings__tanstack-start/transcript.md | other | content | atx-heading |
| start-evals | archive/legacy-harness/runs/2026-05-31T21-11-29-191Z-codex-context-v2-strict-baseline/executions/r1__codex-desktop-gpt-5__official-docs__typed-search-dashboard__tanstack-start/transcript.md | other | content | atx-heading |
| db | packages/react-db/CHANGELOG.md | changes | structure | atx-heading, fenced-code, nested-list |
| db | packages/vue-db/CHANGELOG.md | changes | structure | atx-heading, fenced-code, nested-list |
| router | packages/react-start/CHANGELOG.md | changes | structure | atx-heading, nested-list |
| db | docs/collections/powersync-collection.md | docs | structure | atx-heading, fenced-code, frontmatter, table |
| router | packages/start-plugin-core/CHANGELOG.md | changes | structure | atx-heading, nested-list |
| router | packages/solid-start/CHANGELOG.md | changes | structure | atx-heading, nested-list |
| db | packages/trailbase-db-collection/CHANGELOG.md | changes | structure | atx-heading, fenced-code, nested-list |
| router | packages/vue-start/CHANGELOG.md | changes | structure | atx-heading, nested-list |
| db | docs/guides/collection-options-creator.md | docs | structure | atx-heading, fenced-code, frontmatter |
| db | packages/svelte-db/CHANGELOG.md | changes | structure | atx-heading, fenced-code, nested-list |

## Interpretation policy

- Parser errors and nondeterminism are release blockers.
- Content differences in maintained TanStack docs require review and usually a regression fixture.
- Structural differences matter when they affect semantics, accessibility, styling, or hydration.
- Serializer and attribute differences are accepted when browser semantics are equivalent.
- Marked does not render footnotes; footnote-only content differences remain visible but are excluded from the unexplained target count.
- Unsupported syntax found only in external or specification corpora is evidence, not an automatic feature request.
- MDX requires an MDX compiler and is outside this package profile.
