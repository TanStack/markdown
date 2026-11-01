---
title: Version 1 compatibility
---

# Version 1 compatibility

Version 1 stabilizes the documented Markdown profile, public package entry points, options, AST nodes, renderer APIs, and extension contracts. It does not add full CommonMark, GFM, MDX, or HTML sanitization. Review the [syntax profile](../core-concepts/syntax-profile.md) before migrating content.

## Compatibility promise

Within 1.x, existing documented calls and valid AST documents remain supported. Removing an export, requiring a new option or AST field, changing the meaning of a documented option, or adding a variant to a public discriminated node union requires a major release. New optional fields and options may be added in minor releases. Consumers should preserve unknown optional fields when storing or forwarding documents.

Rendering preserves documented semantics, escaping, and default security boundaries. Byte-for-byte HTML, attribute order, implementation details, and undocumented malformed-input behavior are not stable serialization contracts. Bug and security fixes may change output in patches. Intentional changes to supported syntax semantics or the default heading ID algorithm require a major release. Use explicit application-owned heading IDs when external links must remain permanent.

The AST is plain JSON data, not a versioned interchange protocol. Existing valid 1.x ASTs remain readable by later 1.x renderers. Store the producing package version alongside persisted documents if you need reproducible output, and rebuild caches to adopt parser fixes. Never treat untrusted JSON as a validated AST. See [security](../core-concepts/security.md).

Extensions and custom URL transforms are trusted synchronous application code. Their documented ordering and callback inputs follow semver; runtime budgets do not limit arbitrary callback work. A custom URL return value and extension-created nodes must already satisfy your application's security policy.

## Supported environments

The package is ESM-only. Release checks cover Node.js 22 and 24, React 18.0 and 19, and Octane 0.1.12. The framework-independent parser and HTML renderer need no React or Octane runtime. Browser checks cover current Playwright Chromium, Firefox, and WebKit with React rendering and hydration. A supported browser needs modern JavaScript, including ES2022 features. Other ESM runtimes may work but are not a tested support promise.

The React peer range allows newer compatible React releases; automated testing of the minimum 18.0 and current 19 releases is the compatibility baseline. Octane remains an optional adapter for the explicitly tested release, not a promise about future pre-1.0 Octane changes. Octane 0.1.12 requires React 19 when both frameworks are installed; React 18 applications should omit the optional Octane dependency.

## Upgrading from 0.0.16

Update `@tanstack/markdown` to `^1.0.0`. Existing parser, renderer, and docs extension calls require no migration. Version 1 adds optional source-level inline parsers through `MarkdownExtension.inlineParser`. They run only when configured and leave default syntax unchanged. See [extensions](../guides/extensions.md) for marker dispatch, precedence, UTF-16 source offsets, shared parser budgets, and trusted callback requirements. Rebuild generated AST caches once, run your own Markdown corpus, and inspect important anchor links and customized components. Do not enable `allowHtml` merely to restore differences from another parser.

The release pipeline validates the packed archive in an isolated consumer, all public imports, serialized AST rendering, safe URL handling, React server rendering, browser hydration and streamed updates. Published documentation and examples are checked alongside parser, resilience, security, and size regression tests.
