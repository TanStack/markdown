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

Each Markdown file is tested in core and docs-extension modes for deterministic AST output, deterministic HTML output, React SSR success, and expected renderer structure. Focused adapter fixtures additionally prove Octane static SSR parity.

## Practical compatibility audit

```bash
pnpm run corpus:audit:tanstack
pnpm run corpus:audit:external
```

The TanStack audit discovers local sibling repositories, scans their tracked Markdown and MDX files, and records each Git revision and dirty state. The external audit checks out exact commits from twenty representative documentation and blog repositories. MDX is inventoried but not parsed.

Both audits parse every Markdown file twice with the docs profile, verify deterministic AST and HTML output, inventory syntax usage, and compare rendered output with Marked. Marked is a differential reference, not a correctness oracle. Reports separate exact output, serialization differences, structural differences with equivalent text, and rendered-content differences.

The external audit runs in CI and fails on parser errors, nondeterminism, or any unexplained target-profile content difference. The local TanStack audit enforces the same rule when the sibling repositories are available.

- [TanStack repository corpus](../../reports/tanstack-corpus.md)
- [External docs and blogs corpus](../../reports/external-corpus.md)

### Triage policy

1. Parse errors or nondeterministic output are always defects.
2. Content differences in docs, blogs, or READMEs that use only the supported profile must be fixed or explained before release.
3. Serialization and structure differences are reviewed but do not imply incorrect output.
4. MDX, site templates, opt-in HTML, and documented unsupported syntax measure demand; they do not expand the profile automatically.

A syntax rule enters the profile only when real target content needs it, the behavior can be covered across renderers, and its parser and bundle cost are justified. CommonMark examples remain edge-case accounting rather than the product roadmap.

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
