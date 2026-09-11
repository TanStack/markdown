# TanStack repository corpus

Generated: 2026-09-11T18:24:03.577Z

This report measures practical corpus behavior. Marked is a differential reference, not a correctness oracle. MDX is inventoried but not parsed.

- repositories or roots: 26
- Markdown documents: 6308
- MDX documents inventoried: 2
- source bytes: 32642258
- parse or determinism errors: 0
- content differences using only profile syntax: 0
- unexplained target docs/blog/README content differences using only profile syntax: 0
- audit time: 8920.8 ms

## Output comparison

| Result | Documents | Percent | Meaning |
| :--- | ---: | ---: | :--- |
| exact | 4996 | 79.2% | Normalized HTML matches Marked |
| serialization | 189 | 3.0% | Tag and text shape matches; attributes or serialization differ |
| structure | 753 | 11.9% | Text matches; element structure differs |
| content | 370 | 5.9% | Rendered text differs and requires triage |

## Repositories

| Repository | Revision | Dirty | Markdown | MDX | Exact | Serialization | Structure | Content | Errors |
| :--- | :--- | :---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| [ai](https://github.com/tanstack/ai) | [44a73e0e](https://github.com/tanstack/ai/tree/44a73e0e8790f478d853bf3d843c44f1f501762e) | no | 941 | 0 | 697 | 26 | 152 | 66 | 0 |
| [bling](https://github.com/TanStack/bling) | [62703ba3](https://github.com/TanStack/bling/tree/62703ba3d204a0315ef6043d0f59c5b70c27e73d) | yes | 4 | 0 | 3 | 0 | 1 | 0 | 0 |
| [charts](https://github.com/TanStack/charts) | [dc4bc708](https://github.com/TanStack/charts/tree/dc4bc708bac2e90d9669e8bf139dda97ad10603d) | yes | 205 | 0 | 187 | 5 | 12 | 1 | 0 |
| [cli](https://github.com/TanStack/cli) | [8711a8b4](https://github.com/TanStack/cli/tree/8711a8b4428722a417960050871a014b3a9bc839) | yes | 111 | 2 | 79 | 0 | 23 | 9 | 0 |
| [config](https://github.com/tanstack/config) | [c7356fbf](https://github.com/tanstack/config/tree/c7356fbf42f988b1b690cc9cf57c55f14ddd3487) | no | 16 | 0 | 12 | 2 | 1 | 1 | 0 |
| [db](https://github.com/tanstack/db) | [12cbc90a](https://github.com/tanstack/db/tree/12cbc90a32a121a858051b69798a602cc7ddc43a) | no | 606 | 0 | 395 | 14 | 190 | 7 | 0 |
| [form](https://github.com/TanStack/form) | [90118027](https://github.com/TanStack/form/tree/901180274c05ed3672fd280337499f7104fdd8cf) | no | 186 | 0 | 171 | 3 | 10 | 2 | 0 |
| [highlight](https://github.com/TanStack/highlight) | [8aab48b5](https://github.com/TanStack/highlight/tree/8aab48b5da618caae7c98728042dbe9cb38bb2d0) | no | 51 | 0 | 39 | 7 | 5 | 0 | 0 |
| [hotkeys](https://github.com/TanStack/hotkeys) | [6adcc3a1](https://github.com/TanStack/hotkeys/tree/6adcc3a1b0a28350eb421f6aeebcf0f94d177817) | no | 329 | 0 | 280 | 10 | 16 | 23 | 0 |
| [intent](https://github.com/tanstack/intent) | [e5745472](https://github.com/tanstack/intent/tree/e57454726b97f489336283d30ff7ae43e1817af4) | no | 24 | 0 | 10 | 3 | 10 | 1 | 0 |
| [markdown](https://github.com/TanStack/markdown) | [e56d191c](https://github.com/TanStack/markdown/tree/e56d191c0f3229b1d1a640b8c58245c788c6f644) | yes | 48 | 0 | 27 | 10 | 11 | 0 | 0 |
| [pacer](https://github.com/tanstack/pacer) | [556125d7](https://github.com/tanstack/pacer/tree/556125d73ff020b1f854bded14cb82e58581e3b6) | no | 334 | 0 | 301 | 1 | 13 | 19 | 0 |
| [preact](https://github.com/TanStack/preact) | [4dc9b508](https://github.com/TanStack/preact/tree/4dc9b508dd37544b858bfa52d28e12d219effdbb) | yes | 8 | 0 | 3 | 0 | 5 | 0 | 0 |
| [query](https://github.com/TanStack/query) | [8a930246](https://github.com/TanStack/query/tree/8a930246ee250db03e4d8472605e8525238f936f) | no | 671 | 0 | 585 | 18 | 66 | 2 | 0 |
| [ranger](https://github.com/TanStack/ranger) | [5bdf4862](https://github.com/TanStack/ranger/tree/5bdf486292418cc6e71f72fa023ddb1295051f04) | no | 20 | 0 | 19 | 0 | 1 | 0 | 0 |
| [react-charts](https://github.com/TanStack/react-charts) | [e4b1c9c6](https://github.com/TanStack/react-charts/tree/e4b1c9c6306862847e2a9cfa91fcb3e42163c8d3) | no | 10 | 0 | 10 | 0 | 0 | 0 | 0 |
| [redact](https://github.com/TanStack/redact) | [2e3c75c4](https://github.com/TanStack/redact/tree/2e3c75c483365d26ae326ec0fdae96fa5c690451) | yes | 5 | 0 | 2 | 3 | 0 | 0 | 0 |
| [router](https://github.com/tanstack/router) | [6f882b7d](https://github.com/tanstack/router/tree/6f882b7dae8870e0f51791ec89015f75c74e4c9b) | no | 506 | 0 | 308 | 12 | 89 | 97 | 0 |
| [select](https://github.com/TanStack/select) | [1aa8f85f](https://github.com/TanStack/select/tree/1aa8f85f3312f7f891b8808f1b9688cae4a9ef2a) | yes | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| [start-evals](https://github.com/TanStack/start-evals) | [e30b88fa](https://github.com/TanStack/start-evals/tree/e30b88faf4a5d3e017bccadc7fe2594710dfe1e0) | yes | 70 | 0 | 63 | 7 | 0 | 0 | 0 |
| [start-rsc](https://github.com/tanstack/start-rsc) | [b5ef4abf](https://github.com/tanstack/start-rsc/tree/b5ef4abfe883d072b78e5cba24cc321b42faed10) | yes | 433 | 0 | 290 | 15 | 47 | 81 | 0 |
| [store](https://github.com/TanStack/store) | [88283a26](https://github.com/TanStack/store/tree/88283a2647a2fb2abb422cb15e3bdc4226853ac4) | no | 49 | 0 | 41 | 5 | 3 | 0 | 0 |
| [table](https://github.com/TanStack/table) | [50feff85](https://github.com/TanStack/table/tree/50feff8584d48972329d2d2b5795e152cf522178) | no | 1384 | 0 | 1269 | 14 | 59 | 42 | 0 |
| [tanstack.com](https://github.com/TanStack/tanstack.com) | [84f0b9c4](https://github.com/TanStack/tanstack.com/tree/84f0b9c453ea741787a6162c13896c9492d97194) | no | 103 | 0 | 68 | 15 | 13 | 7 | 0 |
| [virtual](https://github.com/TanStack/virtual) | [43ef13c5](https://github.com/TanStack/virtual/tree/43ef13c5002f64fa7a6f78cc3676670401370f83) | yes | 65 | 0 | 52 | 2 | 10 | 1 | 0 |
| [workflow](https://github.com/TanStack/workflow) | [70ced3cc](https://github.com/TanStack/workflow/tree/70ced3ccc78c1899a9f2ddfb6e9a2a6243ae973d) | yes | 128 | 0 | 84 | 17 | 16 | 11 | 0 |

## Content kinds

| Kind | Documents |
| :--- | ---: |
| blog | 69 |
| changes | 263 |
| docs | 4590 |
| fixture | 115 |
| other | 438 |
| readme | 833 |

## Syntax usage

| Feature | Support | Documents | Description |
| :--- | :--- | ---: | :--- |
| atx-heading | profile | 5947 | ATX heading |
| fenced-code | profile | 5055 | Fenced code block |
| frontmatter | profile | 4898 | Leading YAML-style frontmatter |
| raw-html | opt-in | 1236 | Raw HTML tag |
| blockquote | profile | 851 | Block quote |
| table | profile | 647 | Pipe table |
| literal-autolink | unsupported | 516 | Bare URL outside explicit link syntax |
| nested-list | profile | 485 | Nested list item |
| four-space-indent | review | 316 | Four-space indentation, possibly indented code |
| callout | extension | 253 | GitHub-style callout |
| reference-link | profile | 165 | Reference link or image definition |
| code-metadata | profile | 151 | Metadata after a fenced-code language |
| section-marker | extension | 146 | TanStack section marker written as a reference definition |
| comment-component | extension | 131 | Comment-delimited docs component |
| delimiter-edge | review | 111 | Malformed or legacy emphasis or code delimiter usage |
| task-list | profile | 101 | Task list item |
| strikethrough | profile | 80 | Strikethrough delimiter |
| tab-indentation | unsupported | 49 | Tab-indented content |
| combined-emphasis | profile | 38 | Combined strong and emphasis delimiters |
| entity-reference | partial | 11 | Named or numeric HTML entity |
| angle-autolink | unsupported | 6 | Angle-bracket URL or email autolink |
| site-template | site-extension | 6 | Liquid, JSX-comment, or site template directive |
| fence-info-edge | review | 3 | Generated or nonstandard fenced-code info string |
| footnote | profile | 3 | Footnote reference or definition |
| hard-break | profile | 2 | Backslash hard line break |
| multiline-link | review | 1 | Link or image destination split across lines |

## Highest-priority differences

These are triage leads, ordered by parser errors, content differences, structural differences, then file size.

| Repository | Path | Kind | Result | Features |
| :--- | :--- | :--- | :--- | :--- |
| db | packages/react-db/CHANGELOG.md | changes | structure | atx-heading, fenced-code, nested-list |
| db | packages/vue-db/CHANGELOG.md | changes | structure | atx-heading, fenced-code, nested-list |
| router | packages/react-start/CHANGELOG.md | changes | structure | atx-heading, nested-list |
| db | docs/collections/powersync-collection.md | docs | structure | atx-heading, fenced-code, frontmatter, table |
| db | packages/svelte-db/CHANGELOG.md | changes | structure | atx-heading, fenced-code, nested-list |
| table | perf-skipped.md | other | structure | atx-heading, fenced-code, table |
| router | packages/start-plugin-core/CHANGELOG.md | changes | structure | atx-heading, nested-list |
| db | packages/solid-db/CHANGELOG.md | changes | structure | atx-heading, fenced-code, nested-list |
| db | packages/trailbase-db-collection/CHANGELOG.md | changes | structure | atx-heading, fenced-code, nested-list |
| router | packages/solid-start/CHANGELOG.md | changes | structure | atx-heading, nested-list |
| ai | docs/chat/connection-adapters.md | docs | structure | atx-heading, blockquote, code-metadata, fenced-code, frontmatter, table |
| router | packages/vue-start/CHANGELOG.md | changes | structure | atx-heading, nested-list |
| db | docs/guides/collection-options-creator.md | docs | structure | atx-heading, fenced-code, frontmatter |
| db | packages/angular-db/CHANGELOG.md | changes | structure | atx-heading, nested-list |
| virtual | docs/api/virtualizer.md | docs | structure | atx-heading, blockquote, fenced-code, frontmatter |
| query | docs/framework/react/guides/ssr.md | docs | structure | atx-heading, blockquote, fenced-code, frontmatter, nested-list |
| ai | packages/ai/skills/ai-core/adapter-configuration/SKILL.md | other | structure | atx-heading, blockquote, code-metadata, fenced-code, frontmatter, table |
| router | packages/react-start-rsc/CHANGELOG.md | changes | structure | atx-heading, nested-list |
| db | packages/rxdb-db-collection/CHANGELOG.md | changes | structure | atx-heading, nested-list |
| db | packages/offline-transactions/CHANGELOG.md | changes | structure | atx-heading, fenced-code, nested-list |
| router | packages/start-server-core/CHANGELOG.md | changes | structure | atx-heading, nested-list |
| router | docs/router/how-to/integrate-chakra-ui.md | docs | structure | atx-heading, fenced-code, frontmatter, task-list |
| start-rsc | docs/router/framework/react/how-to/integrate-chakra-ui.md | docs | structure | atx-heading, fenced-code, frontmatter, task-list |
| ai | examples/ts-vue-chat/CHANGELOG.md | changes | structure | atx-heading, nested-list |
| tanstack.com | .agents/skills/design-motion-principles/references/output-format.md | other | structure | atx-heading, fenced-code, table |
| table | docs/framework/react/guide/table-state.md | docs | structure | atx-heading, blockquote, fenced-code, frontmatter |
| router | packages/react-start-server/CHANGELOG.md | changes | structure | atx-heading, nested-list |
| start-rsc | docs/router/framework/react/how-to/use-environment-variables.md | docs | structure | atx-heading, fenced-code, frontmatter, task-list |
| router | docs/router/how-to/use-environment-variables.md | docs | structure | atx-heading, fenced-code, frontmatter, task-list |
| router | docs/router/how-to/integrate-framer-motion.md | docs | structure | atx-heading, fenced-code, frontmatter, task-list |
| start-rsc | docs/router/framework/react/how-to/integrate-framer-motion.md | docs | structure | atx-heading, fenced-code, frontmatter, task-list |
| router | packages/router-plugin/CHANGELOG.md | changes | structure | atx-heading, nested-list |
| router | packages/solid-start-server/CHANGELOG.md | changes | structure | atx-heading, nested-list |
| ai | docs/media/text-to-speech.md | docs | structure | atx-heading, blockquote, code-metadata, fenced-code, frontmatter, table |
| ai | examples/ts-svelte-chat/CHANGELOG.md | changes | structure | atx-heading, nested-list |
| ai | .agents/skills/pr-sweep/SKILL.md | other | structure | atx-heading, fenced-code, frontmatter, table |
| ai | .claude/skills/pr-sweep/SKILL.md | other | structure | atx-heading, fenced-code, frontmatter, table |
| ai | .grok/skills/pr-sweep/SKILL.md | other | structure | atx-heading, fenced-code, frontmatter, table |
| workflow | research/SRC_SKEW_AND_RESUMPTION.md | other | structure | atx-heading, blockquote, fenced-code, nested-list, table |
| db | packages/powersync-db-collection/CHANGELOG.md | changes | structure | atx-heading, fenced-code, nested-list |

## Interpretation policy

- Parser errors and nondeterminism are release blockers.
- Content differences in maintained TanStack docs require review and usually a regression fixture.
- Structural differences matter when they affect semantics, accessibility, styling, or hydration.
- Serializer and attribute differences are accepted when browser semantics are equivalent.
- Marked does not render footnotes; footnote-only content differences remain visible but are excluded from the unexplained target count.
- Unsupported syntax found only in external or specification corpora is evidence, not an automatic feature request.
- MDX requires an MDX compiler and is outside this package profile.
