# Streaming optimization results

Plain code, 32-character updates, persistent renderer state, production Chrome on Apple M5 Pro. Replay times include synchronous DOM updates and forced layout, but exclude paint and syntax highlighting. Before and after are separate runs on the same machine. See the [browser report](./streaming-browser.md) for configurations, validation, and per-update latency.

| Fixture | TanStack before, ms | TanStack after, ms | streaming-markdown, ms | Streamdown, ms |
| :--- | ---: | ---: | ---: | ---: |
| unfinished-backtick-4kib | 11.59 | 4.53 | 3.71 | 30.31 |
| unfinished-backtick-16kib | 165.01 | 47.49 | 50.32 | 366.49 |
| unfinished-backtick-64kib | 2615.27 | 677.79 | 788.82 | 5932.69 |
| unfinished-tilde-64kib | 2601.32 | 677.85 | content check failed | content check failed |
| closing-backtick-64kib | 2717.50 | 678.21 | 842.55 | 6081.45 |
| settled-prose-16kib-then-open-fence-16kib | 443.06 | 327.66 | 80.60 | 1196.57 |

The 64 KiB unfinished and closing backtick cases now have the lowest total replay time among the tested renderers. The 16 KiB result is close to streaming-markdown. TanStack still trails streaming-markdown on the 4 KiB and mixed-prose cases, so this does not establish a win across the full suite. Both competitors fail the tilde-fence content check.

React streaming now retains completed groups of plain code lines in stable text nodes. Static rendering and custom code components retain string children. Parser state uses local variables, and block detection skips irrelevant checks on ordinary text and fenced code. Parsing still processes the full accumulated source on every update.

| Entry | Minified before → after | Gzip before → after | Brotli before → after |
| :--- | ---: | ---: | ---: |
| parser only | 13157 → 11949 | 4975 → 4894 | 4593 → 4539 |
| html renderer no highlighter | 18337 → 17139 | 6807 → 6729 | 6240 → 6158 |
| react adapter | 18271 → 17147 | 6722 → 6676 | 6184 → 6170 |
| octane adapter | 18283 → 17084 | 6727 → 6644 | 6194 → 6143 |
| react adapter with streaming extension | 18962 → 17839 | 6907 → 6860 | 6356 → 6302 |

Every measured public entry remains at or below its original minified, gzip, and Brotli size. Size-test ceilings were lowered to the new measurements.

Validation: 255 tests, 24 browser checks covering hydration, updates, Unicode, overrides, and highlighting transitions, typechecking, a production build, and docs verification passed. The before/after CommonMark comparison retained all 403 previously passing examples.

Reproduce the browser regression checks with `BENCH_BROWSER_CHANNEL=chrome pnpm run test:streaming-browser`, and the comparison with `BENCH_BROWSER_CHANNEL=chrome pnpm run bench:streaming`. Browser fixtures and competitor configurations are unchanged by the optimization.
