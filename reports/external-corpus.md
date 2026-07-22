# Representative external docs and blogs corpus

Generated: 2026-07-22T18:11:02.179Z

This report measures practical corpus behavior. Marked is a differential reference, not a correctness oracle. MDX is inventoried but not parsed.

- repositories or roots: 20
- Markdown documents: 10517
- MDX documents inventoried: 813
- source bytes: 87469380
- parse or determinism errors: 0
- content differences using only profile syntax: 2
- unexplained target docs/blog/README content differences using only profile syntax: 0
- audit time: 13442.4 ms

## Output comparison

| Result | Documents | Percent | Meaning |
| :--- | ---: | ---: | :--- |
| exact | 5296 | 50.4% | Normalized HTML matches Marked |
| serialization | 600 | 5.7% | Tag and text shape matches; attributes or serialization differ |
| structure | 1857 | 17.7% | Text matches; element structure differs |
| content | 2764 | 26.3% | Rendered text differs and requires triage |

## Repositories

| Repository | Revision | Dirty | Markdown | MDX | Exact | Serialization | Structure | Content | Errors |
| :--- | :--- | :---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| [vite](https://github.com/vitejs/vite) | [428bda3b](https://github.com/vitejs/vite/tree/428bda3b98886708006f4f2f409095f89d705df1) | no | 59 | 0 | 39 | 5 | 11 | 4 | 0 |
| [vue-docs](https://github.com/vuejs/docs) | [01e098a9](https://github.com/vuejs/docs/tree/01e098a967951ea92d09b100b8e7d82c7a3369a2) | no | 120 | 0 | 75 | 20 | 19 | 6 | 0 |
| [react-dev](https://github.com/reactjs/react.dev) | [7b6c3ceb](https://github.com/reactjs/react.dev/tree/7b6c3ceb9dd97249e9dce4a8a94e61aed6424698) | no | 227 | 0 | 149 | 12 | 46 | 20 | 0 |
| [rust-book](https://github.com/rust-lang/book) | [91754488](https://github.com/rust-lang/book/tree/917544888a55e4da7109bdba8c88c893c0da70f4) | no | 117 | 0 | 29 | 11 | 68 | 9 | 0 |
| [docusaurus](https://github.com/facebook/docusaurus) | [a0bc3221](https://github.com/facebook/docusaurus/tree/a0bc32214436d52a5ac9de9be1a515d872987366) | no | 7 | 123 | 2 | 0 | 4 | 1 | 0 |
| [astro-docs](https://github.com/withastro/docs) | [c316ac57](https://github.com/withastro/docs/tree/c316ac570277bd5abd36a237c97adad8cede0c1b) | no | 2 | 417 | 0 | 0 | 2 | 0 | 0 |
| [tailwind-site](https://github.com/tailwindlabs/tailwindcss.com) | [1e700c43](https://github.com/tailwindlabs/tailwindcss.com/tree/1e700c43f5f270a1a55c4a33e71f01952f24b8c2) | no | 1 | 262 | 1 | 0 | 0 | 0 | 0 |
| [svelte-dev](https://github.com/sveltejs/svelte.dev) | [2f9fc2a2](https://github.com/sveltejs/svelte.dev/tree/2f9fc2a2431dd74b25eb9b6ae5d9051b45635f57) | no | 349 | 0 | 185 | 19 | 52 | 93 | 0 |
| [overreacted](https://github.com/gaearon/overreacted.io) | [ac1ad4fe](https://github.com/gaearon/overreacted.io/tree/ac1ad4fe9168b350d3dc59ac0cbe0d53405702bf) | no | 59 | 0 | 40 | 1 | 13 | 5 | 0 |
| [github-docs](https://github.com/github/docs) | [f455adb9](https://github.com/github/docs/tree/f455adb9ecb48ec7212177af292758bb2f32c1d7) | no | 3723 | 0 | 2045 | 71 | 262 | 1345 | 0 |
| [node-docs](https://github.com/nodejs/node) | [2deb0a1b](https://github.com/nodejs/node/tree/2deb0a1b0f542c4b7fedc16dda1149c65e546f0d) | no | 80 | 0 | 14 | 1 | 39 | 26 | 0 |
| [kubernetes-docs](https://github.com/kubernetes/website) | [f2987ba1](https://github.com/kubernetes/website/tree/f2987ba1cceaa85fcd44cd1a221010d745d7335c) | no | 2430 | 0 | 1249 | 226 | 705 | 250 | 0 |
| [docker-docs](https://github.com/docker/docs) | [d19a384f](https://github.com/docker/docs/tree/d19a384f8dd3b16ab3a4b5f3885b398e76f8638c) | no | 754 | 0 | 271 | 24 | 72 | 387 | 0 |
| [laravel-docs](https://github.com/laravel/docs) | [ce4a1bf0](https://github.com/laravel/docs/tree/ce4a1bf093c2c09e3a029090136d6bea88b07d48) | no | 104 | 0 | 2 | 1 | 0 | 101 | 0 |
| [typescript-docs](https://github.com/microsoft/TypeScript-Website) | [c8170c35](https://github.com/microsoft/TypeScript-Website/tree/c8170c35bda4811c9516cbb69c39241ae4beb6d9) | no | 135 | 0 | 96 | 14 | 18 | 7 | 0 |
| [pnpm-site](https://github.com/pnpm/pnpm.io) | [ff58b983](https://github.com/pnpm/pnpm.io/tree/ff58b98362334807536e91e38ed66d0f14a87576) | no | 162 | 9 | 86 | 5 | 26 | 45 | 0 |
| [deno-docs](https://github.com/denoland/docs) | [bcefb75f](https://github.com/denoland/docs/tree/bcefb75f3e49e19af0ac9d79b436df346a3b477b) | no | 361 | 2 | 245 | 3 | 106 | 7 | 0 |
| [hugo-docs](https://github.com/gohugoio/hugoDocs) | [620696ab](https://github.com/gohugoio/hugoDocs/tree/620696ab3b07f66262e860e84b3793946d1660bc) | no | 993 | 0 | 625 | 80 | 73 | 215 | 0 |
| [rust-blog](https://github.com/rust-lang/blog.rust-lang.org) | [f35e1174](https://github.com/rust-lang/blog.rust-lang.org/tree/f35e1174d2c15be7b692863b874a8a0046722081) | no | 743 | 0 | 111 | 107 | 333 | 192 | 0 |
| [mdn-guides](https://github.com/mdn/content) | [3b763f8f](https://github.com/mdn/content/tree/3b763f8f076c053b7a44e261c3a19a1879bc11ff) | no | 91 | 0 | 32 | 0 | 8 | 51 | 0 |

## Content kinds

| Kind | Documents |
| :--- | ---: |
| blog | 935 |
| changes | 26 |
| docs | 8778 |
| fixture | 14 |
| other | 735 |
| readme | 29 |

## Syntax usage

| Feature | Support | Documents | Description |
| :--- | :--- | ---: | :--- |
| frontmatter | profile | 9118 | Leading YAML-style frontmatter |
| atx-heading | profile | 7353 | ATX heading |
| site-template | site-extension | 4932 | Liquid, JSX-comment, or site template directive |
| fenced-code | profile | 4770 | Fenced code block |
| blockquote | profile | 2474 | Block quote |
| callout | extension | 2074 | GitHub-style callout |
| raw-html | opt-in | 1986 | Raw HTML tag |
| literal-autolink | unsupported | 1984 | Bare URL outside explicit link syntax |
| nested-list | profile | 1521 | Nested list item |
| four-space-indent | review | 1481 | Four-space indentation, possibly indented code |
| reference-link | profile | 1178 | Reference link or image definition |
| code-metadata | profile | 984 | Metadata after a fenced-code language |
| table | profile | 859 | Pipe table |
| entity-reference | partial | 659 | Named or numeric HTML entity |
| angle-autolink | unsupported | 141 | Angle-bracket URL or email autolink |
| delimiter-edge | review | 105 | Malformed or legacy emphasis or code delimiter usage |
| fence-info-edge | review | 104 | Generated or nonstandard fenced-code info string |
| footnote | profile | 94 | Footnote reference or definition |
| tab-indentation | unsupported | 51 | Tab-indented content |
| hard-break | profile | 41 | Backslash hard line break |
| setext-heading | unsupported | 27 | Setext heading |
| combined-emphasis | profile | 18 | Combined strong and emphasis delimiters |
| strikethrough | profile | 14 | Strikethrough delimiter |
| ordered-paren-list | profile | 12 | Ordered list using a closing parenthesis |
| task-list | profile | 12 | Task list item |
| multiline-link | review | 12 | Link or image destination split across lines |
| section-marker | extension | 2 | TanStack section marker written as a reference definition |

## Highest-priority differences

These are triage leads, ordered by parser errors, content differences, structural differences, then file size.

| Repository | Path | Kind | Result | Features |
| :--- | :--- | :--- | :--- | :--- |
| kubernetes-docs | content/en/blog/_posts/2026/ingress-nginx-before-you-migrate.md | blog | content | atx-heading, fenced-code, footnote, frontmatter, reference-link |
| rust-blog | content/inside-rust/governance-update@0.md | docs | content | blockquote, footnote, hard-break, reference-link |
| overreacted | public/a-complete-guide-to-useeffect/index.md | other | structure | atx-heading, blockquote, code-metadata, fenced-code, frontmatter, nested-list |
| github-docs | content/site-policy/github-terms/github-marketplace-developer-agreement.md | docs | structure | atx-heading, frontmatter, nested-list |
| overreacted | public/a-lean-syntax-primer/index.md | other | structure | atx-heading, code-metadata, fenced-code, frontmatter |
| deno-docs | runtime/fundamentals/workspaces.md | other | structure | atx-heading, code-metadata, fenced-code, frontmatter, table |
| kubernetes-docs | content/en/blog/_posts/2020/deploying-external-openstack-cloud-provider-with-kubeadm.md | blog | structure | atx-heading, fenced-code, frontmatter, table |
| typescript-docs | packages/documentation/copy/en/release-notes/TypeScript 5.6.md | docs | structure | atx-heading, fenced-code, frontmatter |
| overreacted | public/why-do-hooks-rely-on-call-order/index.md | other | structure | atx-heading, code-metadata, fenced-code, frontmatter |
| docker-docs | content/manuals/desktop/previous-versions/2.x-mac.md | docs | structure | atx-heading, blockquote, frontmatter, nested-list |
| kubernetes-docs | content/en/blog/_posts/2025/gateway-api-v1-4/index.md | blog | structure | atx-heading, fenced-code, frontmatter |
| kubernetes-docs | content/en/blog/_posts/2020/two-phased-canary-rollout-with-gloo.md | blog | structure | atx-heading, fenced-code, frontmatter |
| github-docs | content/site-policy/github-terms/github-secret-scanning-partner-program-agreement.md | docs | structure | atx-heading, frontmatter |
| kubernetes-docs | content/en/blog/_posts/2020/wsl2-dockerdesktop-k8s.md | blog | structure | atx-heading, blockquote, fenced-code, frontmatter, nested-list, table |
| overreacted | public/how-does-react-tell-a-class-from-a-function/index.md | other | structure | code-metadata, fenced-code, frontmatter, table |
| docker-docs | STYLE.md | other | structure | atx-heading, blockquote, fenced-code, nested-list, table |
| pnpm-site | docs/pnpmfile.md | docs | structure | atx-heading, code-metadata, fenced-code, frontmatter, nested-list, reference-link, table |
| typescript-docs | packages/documentation/copy/en/release-notes/TypeScript 5.4.md | docs | structure | atx-heading, fenced-code, frontmatter |
| deno-docs | deploy/reference/databases.md | other | structure | atx-heading, fenced-code, frontmatter |
| deno-docs | runtime/test/index.md | fixture | structure | atx-heading, code-metadata, fenced-code, frontmatter |
| vite | docs/config/server-options.md | docs | structure | atx-heading, code-metadata, fenced-code, nested-list |
| overreacted | public/how-are-function-components-different-from-classes/index.md | other | structure | blockquote, code-metadata, fenced-code, frontmatter |
| deno-docs | runtime/fundamentals/debugging.md | other | structure | atx-heading, code-metadata, fenced-code, frontmatter |
| kubernetes-docs | content/en/blog/_posts/2016/statefulset-run-scale-stateful-applications-in-kubernetes.md | blog | structure | fenced-code, frontmatter |
| kubernetes-docs | content/en/blog/_posts/2021/kubernetes-release-1.22.md | blog | structure | atx-heading, frontmatter |
| deno-docs | deploy/privacy_policy.md | other | structure | frontmatter, hard-break |
| deno-docs | runtime/fundamentals/typescript.md | other | structure | atx-heading, code-metadata, fenced-code, frontmatter, table |
| kubernetes-docs | content/en/blog/_posts/2019/kubernetes-1-15-release-announcement.md | blog | structure | atx-heading, frontmatter, nested-list |
| kubernetes-docs | content/en/blog/_posts/2025/gateway-api-v1-3/index.md | blog | structure | atx-heading, fenced-code, frontmatter, nested-list |
| kubernetes-docs | content/en/blog/_posts/2017/using-ebpf-in-kubernetes.md | blog | structure | atx-heading, fenced-code, frontmatter, nested-list |
| docker-docs | content/manuals/build/policies/examples.md | docs | structure | atx-heading, fenced-code, frontmatter |
| rust-blog | content/Rust-1.87.0/index.md | docs | structure | atx-heading, fenced-code |
| rust-blog | content/State-of-Rust-Survey-2016/index.md | docs | structure | atx-heading, blockquote, reference-link |
| kubernetes-docs | content/en/blog/_posts/2016/stateful-applications-using-kubernetes-datera.md | blog | structure | fenced-code, frontmatter |
| overreacted | public/how-to-fix-any-bug/index.md | other | structure | atx-heading, fenced-code, frontmatter |
| github-docs | content/site-policy/other-site-policies/github-and-trade-controls.md | docs | structure | atx-heading, frontmatter |
| kubernetes-docs | content/en/blog/_posts/2018/kubevirt-crds-for-virtualization.md | blog | structure | atx-heading, fenced-code, frontmatter |
| deno-docs | runtime/fundamentals/http_server.md | other | structure | atx-heading, code-metadata, fenced-code, frontmatter |
| kubernetes-docs | content/en/blog/_posts/2017/multi-stage-canary-deployments-with-kubernetes-in-the-cloud-onprem.md | blog | structure | fenced-code, frontmatter |
| overreacted | public/the-math-is-haunted/index.md | other | structure | atx-heading, code-metadata, fenced-code, frontmatter |

## Interpretation policy

- Parser errors and nondeterminism are release blockers.
- Content differences in maintained TanStack docs require review and usually a regression fixture.
- Structural differences matter when they affect semantics, accessibility, styling, or hydration.
- Serializer and attribute differences are accepted when browser semantics are equivalent.
- Marked does not render footnotes; footnote-only content differences remain visible but are excluded from the unexplained target count.
- Unsupported syntax found only in external or specification corpora is evidence, not an automatic feature request.
- MDX requires an MDX compiler and is outside this package profile.
