---
title: FAQ
---

# FAQ

## Is TanStack Markdown CommonMark compliant?

No. It continuously measures CommonMark behavior and preserves established matches, but full conformance is not the product goal. The current generated report matches 287 of 652 CommonMark 0.31.2 examples after output normalization.

## Is it GFM compliant?

No. It implements the GFM features most relevant to documentation: tables, task lists, and strikethrough. Selected official GFM examples protect those behaviors.

## Can it render MDX?

No. It does not parse or execute JSX, JavaScript expressions, or module syntax. Comment components provide deterministic docs metadata without code evaluation.

## Can I use it for user-generated content?

Raw HTML and executable URLs are disabled by default, but the library is not a complete sanitizer. Keep trusted boundaries disabled and apply a final sanitizer when your application’s threat model requires one.

## Why is syntax highlighting not included?

Highlighters vary widely in bundle size, language coverage, theme model, and initialization cost. A callback keeps that choice outside the Markdown package and lets docs sites highlight at build time or on the server.

## Why not add every CommonMark edge case?

Each rule adds parser code, interactions, tests, and maintenance cost. This project accepts syntax when real blog or docs content needs it and the bundle/complexity cost is justified. Compatibility percentage alone is not a reason to expand scope.

## Can I transform the AST?

Yes. It is a public discriminated union made from plain objects. Transform it directly or use a `transformDocument` extension. If the work needs a broad ecosystem of interoperable syntax trees and async plugins, unified is usually a better fit.

## Can I parse once and render HTML and React?

Yes. Both renderers accept the same `MarkdownDocument`. Core output structure is covered by SSR parity tests.

## Is the AST stable?

It is public and typed, but the package is pre-1.0. Pin a version for persisted ASTs and rebuild caches when an upgrade changes the node contract.

## How do I decide before migrating?

Review the [Syntax Profile](../core-concepts/syntax-profile), run your content through the [downstream corpus test](../guides/testing), and inspect the generated output. Choose a broader parser when unsupported syntax is a content requirement rather than an incidental edge case.
