---
title: Testing
---

# Testing

The release gate tests the supported profile, compatibility baseline, security policy, renderer parity, real content, malformed input, complexity limits, bundle budgets, declarations, build output, and package contents.

## Full verification

```bash
pnpm run verify
```

This runs tests, typechecking, a production build, docs validation, compatibility accounting, bundle measurement, benchmarks, and an npm package dry run.

## Downstream corpus testing

Point the corpus suite at one or more content directories:

```bash
MARKDOWN_CORPUS_DIRS=../tanstack.com/src/blog:../tanstack.com/docs \
  pnpm run test:corpus
```

Each Markdown file is tested in core and docs-extension modes for deterministic AST output, deterministic HTML output, React SSR success, and expected renderer structure.

## Compatibility accounting

```bash
pnpm run conformance
```

The command compares output against CommonMark 0.31.2 examples, preserves every established match as a regression baseline, and updates [the generated report](../../reports/conformance.md). It is not a claim of full conformance.

Selected official GFM examples separately cover tables, task lists, and strikethrough in the supported profile.

## Resilience

The suite includes fixed-seed generated malformed documents and adversarial cases such as unmatched delimiters, deep blockquotes, nested lists, and parser depth exhaustion. Performance thresholds are generous enough for CI variation but strict enough to catch accidental superlinear behavior.

## Documentation coverage

`pnpm run docs:verify` checks that:

- every docs page is in `docs/config.json`
- every navigation target exists
- local links and anchors resolve
- every page has frontmatter
- every package entry point appears in the API index
- every exported declaration name appears in its reference page

When adding public API, update declarations and reference documentation in the same change.
