# TanStack Markdown - Skill Spec

TanStack Markdown is a synchronous parser and renderer for controlled blog and documentation content. It exposes a serializable AST, an HTML renderer, React and Octane adapters, and optional documentation extensions while deliberately limiting syntax and runtime dependencies.

## Domains

| Domain | Description | Skills |
| --- | --- | --- |
| Rendering Markdown content | Parse supported Markdown and render it through HTML or a framework adapter. | render-markdown, react-rendering, octane-rendering |
| Building documentation experiences | Add documentation syntax, metadata, and custom extension behavior. | docs-features, custom-extensions |
| Operating content pipelines | Keep production rendering secure, compatible, deterministic, and small. | production-pipelines |

## Skill Inventory

| Skill | Type | Domain | What it covers | Failure modes |
| --- | --- | --- | --- | ---: |
| Render Markdown | core | rendering-content | Parsing, HTML rendering, AST reuse, syntax profile | 4 |
| Render with React | framework | rendering-content | React nodes, SSR, component replacement | 3 |
| Render with Octane | framework | rendering-content | Octane descriptors, static SSR, component replacement | 3 |
| Build Docs Features | core | building-docs | Docs preset, callouts, headings, components, tabs, fence metadata | 4 |
| Write Custom Extensions | core | building-docs | Parser hooks, transforms, HTML hooks, portable custom nodes | 4 |
| Ship a Production Content Pipeline | lifecycle | operating-pipelines | Security, highlighting, compatibility, performance | 5 |

## Failure Mode Inventory

### Render Markdown (4 failure modes)

| # | Mistake | Priority | Source | Cross-skill? |
| ---: | --- | :---: | --- | --- |
| 1 | Assuming complete CommonMark or GFM behavior | HIGH | `docs/core-concepts/syntax-profile.md` | production-pipelines |
| 2 | Reparsing unchanged content on every render | MEDIUM | `docs/core-concepts/document-model.md` | production-pipelines |
| 3 | Applying parser options after parsing | HIGH | `docs/reference/html.md` | - |
| 4 | Using parseInline for document definitions | MEDIUM | `docs/reference/default-entry.md` | - |

### Render with React (3 failure modes)

| # | Mistake | Priority | Source | Cross-skill? |
| ---: | --- | :---: | --- | --- |
| 1 | Injecting rendered HTML instead of using React nodes | HIGH | `docs/guides/react.md` | production-pipelines |
| 2 | Mapping AST node names instead of emitted tags | HIGH | `docs/guides/react.md` | - |
| 3 | Expecting HTML extension hooks in React output | HIGH | `docs/guides/extensions.md` | custom-extensions |

### Render with Octane (3 failure modes)

| # | Mistake | Priority | Source | Cross-skill? |
| ---: | --- | :---: | --- | --- |
| 1 | Treating the Octane adapter as an HTML-string renderer | HIGH | `docs/reference/octane.md` | - |
| 2 | Using a React component in the Octane component map | HIGH | `docs/guides/octane.md` | - |
| 3 | Ignoring Octane static-render return structure | MEDIUM | `docs/guides/octane.md` | - |

### Build Docs Features (4 failure modes)

| # | Mistake | Priority | Source | Cross-skill? |
| ---: | --- | :---: | --- | --- |
| 1 | Expecting the docs preset to provide interactive tabs | HIGH | `docs/guides/docs-preset.md` | - |
| 2 | Using unmatched comment component boundaries | HIGH | `src/extensions/comment-components.ts` | - |
| 3 | Feeding a tab transform the wrong content shape | MEDIUM | `docs/guides/docs-preset.md` | - |
| 4 | Assuming code metadata highlights code by itself | MEDIUM | `docs/core-concepts/syntax-profile.md` | production-pipelines |

### Write Custom Extensions (4 failure modes)

| # | Mistake | Priority | Source | Cross-skill? |
| ---: | --- | :---: | --- | --- |
| 1 | Claiming a multi-line block without consuming it | HIGH | `docs/guides/extensions.md` | - |
| 2 | Ordering a general parser before a specific parser | HIGH | `docs/guides/extensions.md` | - |
| 3 | Using HTML hooks for cross-framework custom nodes | HIGH | `docs/guides/extensions.md` | react-rendering, octane-rendering |
| 4 | Changing the extension set between parse and render | MEDIUM | `docs/guides/extensions.md` | - |

### Ship a Production Content Pipeline (5 failure modes)

| # | Mistake | Priority | Source | Cross-skill? |
| ---: | --- | :---: | --- | --- |
| 1 | Enabling raw HTML for untrusted Markdown | CRITICAL | `docs/core-concepts/security.md` | react-rendering, octane-rendering |
| 2 | Returning a complete pre/code tree from a highlighter | HIGH | `docs/guides/syntax-highlighting.md` | - |
| 3 | Trusting arbitrary highlighter output | CRITICAL | `docs/core-concepts/security.md` | - |
| 4 | Bundling optional highlighting into the client path | MEDIUM | `docs/guides/performance.md` | - |
| 5 | Treating safe defaults as a complete sanitizer | CRITICAL | `docs/core-concepts/security.md` | - |

## Tensions

| Tension | Skills | Agent implication |
| --- | --- | --- |
| Compatibility breadth versus bundle budget | render-markdown <-> production-pipelines | Agents may add syntax without practical evidence or size accounting. |
| Rich trusted output versus untrusted-content safety | docs-features <-> custom-extensions <-> production-pipelines | Agents may enable a trusted boundary globally for presentation. |
| Parse-ahead performance versus option timing | render-markdown <-> custom-extensions <-> production-pipelines | Agents may apply parser behavior after caching the AST. |
| Renderer parity versus framework customization | react-rendering <-> octane-rendering <-> custom-extensions | Agents may assume framework mappings and HTML hooks share parity. |

## Cross-References

| From | To | Reason |
| --- | --- | --- |
| render-markdown | production-pipelines | Production adoption depends on compatibility, trust, and parse timing. |
| react-rendering | render-markdown | React accepts the same AST and parser options. |
| octane-rendering | render-markdown | Octane accepts the same AST and parser options. |
| docs-features | custom-extensions | Built-ins demonstrate extension and ComponentNode contracts. |
| custom-extensions | react-rendering | Portable custom nodes need React component mappings. |
| custom-extensions | octane-rendering | Portable custom nodes need Octane component mappings. |
| docs-features | production-pipelines | Docs metadata and highlighting introduce trust and bundle boundaries. |

## Subsystems & Reference Candidates

| Skill | Subsystems | Reference candidates |
| --- | --- | --- |
| render-markdown | - | AST node and option contracts |
| react-rendering | - | - |
| octane-rendering | - | - |
| docs-features | heading, file, package-manager, and bundler tab variants | Docs metadata contracts |
| custom-extensions | - | - |
| production-pipelines | - | - |

## Remaining Gaps

| Skill | Question | Status |
| --- | --- | :---: |
| react-rendering | How should React and Octane guidance be prioritized against real usage? | open |
| custom-extensions | Which extension contracts are intended to remain stable before 1.0? | open |
| production-pipelines | Which downstream AI mistakes recur beyond repository regressions? | open |

## Recommended Skill File Structure

- **Core skills:** render-markdown, docs-features, custom-extensions
- **Framework skills:** react-rendering, octane-rendering
- **Lifecycle skills:** production-pipelines
- **Composition skills:** none; React and Octane are first-party adapter skills rather than external seams
- **Reference files:** render-markdown AST reference; docs-features metadata reference

## Composition Opportunities

| Library | Integration points | Composition skill needed? |
| --- | --- | --- |
| React | Direct first-party renderer and component map | No; use react-rendering |
| Octane | Direct first-party renderer and component map | No; use octane-rendering |
| Syntax highlighters | CodeHighlighter callback returning trusted code contents | No; covered by production-pipelines |
