# Contributing

TanStack Markdown targets blogs, documentation, and accumulated AI responses. Parser fixes need regression tests and must preserve the bundle-size budgets. Compare performance against the previous revision before adding work to a parsing hot path.

```sh
pnpm install
pnpm run verify
```

The [testing guide](docs/guides/testing.md) covers conformance, corpus audits, and revision comparisons.

## Releases

Include a changeset for package changes with `pnpm changeset`. Use a patch for compatible fixes and performance improvements, a minor for new public APIs, and a major for breaking changes. Check the planned release with `pnpm run changeset:status`.

After a change reaches `main` and verification passes, the Release workflow opens or updates a version PR. It updates the package version, changelog, and bundled skill versions, then dispatches CI on the generated branch. Merge that PR after its checks pass to publish through GitHub Actions and npm trusted publishing.

The npm trusted publisher for `@tanstack/markdown` must allow direct publishing from GitHub repository `TanStack/markdown`, workflow `release.yml`, with no environment name. No npm token is stored in the repository. GitHub Actions must be allowed to create pull requests.

`release:version` and `release:publish` are automation commands. If publishing is interrupted, inspect the workflow logs and npm before retrying. The Release workflow can be dispatched on `main`, and Changesets skips versions already on npm. Never bump or publish locally to work around a failed workflow.
