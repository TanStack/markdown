# Streaming library comparison

Generated: 2026-09-12T17:00:04.103Z

Chrome 152.0.7977.83, Apple M5 Pro, darwin arm64. Production React 19.2.7, Streamdown 2.6.0, streaming-markdown 0.2.15. Cross-origin isolation: true.

Each response arrives in 32-character chunks. TanStack Markdown and Streamdown keep a React root mounted across updates and commit each update with flushSync. Streamdown uses streaming mode with incomplete-Markdown repair and block memoization enabled. streaming-markdown keeps one incremental parser and receives only new chunks through its default DOM renderer. Each replay starts with a fresh root or parser.

Code is plain text for every library. Streamdown uses custom pre/code components, with animations, controls, and line numbers disabled. Its default parsing, GFM, and sanitization remain enabled. No syntax highlighter is installed in this browser harness. This isolates streaming rendering from highlighter choices and is not a comparison of default product interfaces or syntax coverage.

Update latency includes parsing, rendering, and synchronous DOM commit. Update + layout also forces style and layout with offsetHeight after every chunk. Paint, network delays, animation frames, and bundle loading are excluded. All libraries use the same 800px-wide container and basic typography. Browser timer resolution limits very small measurements.

Five measured replays follow two full warmups. Percentiles use nearest rank over pooled updates. Late-open samples cover the last 10% of source before the closing fence or EOF. Replay totals include update sampling, forced layout, and stream finalization, but exclude root/parser creation, cleanup, precomputed prefix/chunk slicing, and validation. End-of-stream finalization is also recorded separately in JSON.

Before timing, a separate replay checks the code block at every open-fence update, ignoring serializer-added trailing newlines. Up to three trailing characters may be buffered for delimiter recognition, and the observed maximum is reported. Final code must match after trimming trailing whitespace; exact-text differences are recorded separately in JSON. Cases that fail this content check receive no timing. This validates the code-fence workload, not full Markdown conformance.

| Renderer | Fixture | Replay mean ms | Open update p95 ms | Open update + layout p95 ms | Late open update + layout p95 ms | Max update + layout ms | Buffered chars |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: | ---: |
| TanStack Markdown React | unfinished-backtick-4kib | 4.529 | 0.015 | 0.055 | 0.065 | 0.325 | 0 |
| Streamdown React | unfinished-backtick-4kib | 30.308 | 0.255 | 0.395 | 0.540 | 1.285 | 1 |
| streaming-markdown DOM | unfinished-backtick-4kib | 3.711 | 0.005 | 0.060 | 0.070 | 0.390 | 2 |
| TanStack Markdown React | unfinished-backtick-16kib | 47.487 | 0.030 | 0.155 | 0.235 | 5.035 | 0 |
| Streamdown React | unfinished-backtick-16kib | 366.486 | 0.745 | 1.320 | 1.450 | 2.535 | 1 |
| streaming-markdown DOM | unfinished-backtick-16kib | 50.320 | 0.005 | 0.155 | 0.190 | 3.640 | 2 |
| TanStack Markdown React | unfinished-backtick-64kib | 677.785 | 0.090 | 0.570 | 0.695 | 3.855 | 0 |
| Streamdown React | unfinished-backtick-64kib | 5932.688 | 3.380 | 5.685 | 6.785 | 9.205 | 1 |
| streaming-markdown DOM | unfinished-backtick-64kib | 788.824 | 0.005 | 0.650 | 1.495 | 4.790 | 2 |
| TanStack Markdown React | unfinished-tilde-64kib | 677.853 | 0.090 | 0.575 | 0.740 | 3.485 | 0 |
| Streamdown React | unfinished-tilde-64kib | n/a | n/a | n/a | n/a | n/a | failed content check |
| streaming-markdown DOM | unfinished-tilde-64kib | n/a | n/a | n/a | n/a | n/a | failed content check |
| TanStack Markdown React | closing-backtick-64kib | 678.211 | 0.090 | 0.570 | 0.655 | 3.390 | 0 |
| Streamdown React | closing-backtick-64kib | 6081.446 | 3.445 | 5.755 | 7.060 | 8.805 | 1 |
| streaming-markdown DOM | closing-backtick-64kib | 842.548 | 0.005 | 0.650 | 1.040 | 6.445 | 2 |
| TanStack Markdown React | settled-prose-16kib-then-open-fence-16kib | 327.658 | 0.355 | 0.515 | 0.560 | 2.750 | 0 |
| Streamdown React | settled-prose-16kib-then-open-fence-16kib | 1196.575 | 2.015 | 2.655 | 2.865 | 5.195 | 1 |
| streaming-markdown DOM | settled-prose-16kib-then-open-fence-16kib | 80.595 | 0.005 | 0.190 | 0.220 | 3.425 | 2 |

Streamdown React, unfinished-tilde-64kib: 0 open updates missing a code fence; 2047 updates with incorrect or buffered code beyond the allowed three characters; final code match: false.
streaming-markdown DOM, unfinished-tilde-64kib: 2047 open updates missing a code fence; 2047 updates with incorrect or buffered code beyond the allowed three characters; final code match: false.

The settled-prose case adds 16 KiB of completed prose before a growing 16 KiB fence, so retained blocks can benefit from memoization. The other cases contain one heading and one growing fence. Results apply to these fixtures and configurations.

Reproduce with `pnpm exec playwright install chromium` followed by `pnpm run bench:streaming`. To use an installed Chrome instead, run `BENCH_BROWSER_CHANNEL=chrome pnpm run bench:streaming`. `--smoke` runs the smallest case and validates the harness without replacing reports.

Library APIs: [Streamdown](https://streamdown.ai/docs/components), [streaming-markdown](https://github.com/thetarnav/streaming-markdown).
