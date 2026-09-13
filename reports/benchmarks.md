# Benchmark Results

Generated: 2026-09-12T23:59:58.625Z

Environment: Node v24.15.0, darwin arm64, Apple M5 Pro.

Lower `ms/op` is better. Benchmarks run in Node with production dependency builds where available and local Markdown source; heap delta is a coarse process-level signal, not an allocation profiler. Streaming rows replay the complete response in 32-character chunks, so one operation is one progressive response. Every prefix is parsed from scratch. Replay time includes slicing, timing, and collecting samples; per-update latency times only the parser or renderer call. Browser layout, framework updates, and network delays are excluded.

## Markdown

| Name | Fixture | Bytes | Iterations | ms/op | Output bytes | Heap delta KB |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: |
| @tanstack/markdown parse | ai-response.md | 652 | 2000 | 0.0231 | 15 | 35036.6 |
| @tanstack/markdown render AST with external highlighter | ai-response.md | 652 | 2000 | 0.0050 | 1399 | 10160.7 |
| @tanstack/markdown render AST | ai-response.md | 652 | 2000 | 0.0038 | 1143 | 133.8 |
| @tanstack/markdown parse+render with external highlighter | ai-response.md | 652 | 2000 | 0.0251 | 1399 | 11894.5 |
| @tanstack/markdown parse+render | ai-response.md | 652 | 2000 | 0.0232 | 1143 | 44793.7 |
| marked parse+render | ai-response.md | 652 | 2000 | 0.0293 | 1035 | -92849.1 |
| markdown-it parse+render | ai-response.md | 652 | 2000 | 0.0187 | 1087 | 44907.1 |
| micromark render | ai-response.md | 652 | 2000 | 0.1664 | 825 | 51435.6 |
| commonmark parse+render | ai-response.md | 652 | 2000 | 0.0131 | 825 | -49166.8 |
| markdown-wasm render | ai-response.md | 652 | 2000 | 0.0084 | 1117 | 4376.7 |
| unified remark+rehype render | ai-response.md | 652 | 2000 | 0.2147 | 824 | 7854.6 |
| @tanstack/markdown parse | code-heavy.md | 1011 | 1000 | 0.0093 | 15 | 23903.4 |
| @tanstack/markdown render AST with external highlighter | code-heavy.md | 1011 | 1000 | 0.0088 | 4596 | -30194.4 |
| @tanstack/markdown render AST | code-heavy.md | 1011 | 1000 | 0.0040 | 1927 | 10476.2 |
| @tanstack/markdown parse+render with external highlighter | code-heavy.md | 1011 | 1000 | 0.0193 | 4596 | -5389.8 |
| @tanstack/markdown parse+render | code-heavy.md | 1011 | 1000 | 0.0166 | 1927 | -25821.4 |
| marked parse+render | code-heavy.md | 1011 | 1000 | 0.0073 | 1330 | 12886.8 |
| markdown-it parse+render | code-heavy.md | 1011 | 1000 | 0.0098 | 1330 | 27313.4 |
| micromark render | code-heavy.md | 1011 | 1000 | 0.1617 | 1330 | -5850.4 |
| commonmark parse+render | code-heavy.md | 1011 | 1000 | 0.0109 | 1330 | -40876.0 |
| markdown-wasm render | code-heavy.md | 1011 | 1000 | 0.0054 | 1512 | 2558.3 |
| unified remark+rehype render | code-heavy.md | 1011 | 1000 | 0.1567 | 1200 | 24973.7 |
| @tanstack/markdown parse | malformed.md | 237 | 2000 | 0.0027 | 15 | -44947.9 |
| @tanstack/markdown render AST with external highlighter | malformed.md | 237 | 2000 | 0.0016 | 1067 | 15659.7 |
| @tanstack/markdown render AST | malformed.md | 237 | 2000 | 0.0007 | 361 | 5315.2 |
| @tanstack/markdown parse+render with external highlighter | malformed.md | 237 | 2000 | 0.0046 | 1067 | 33660.8 |
| @tanstack/markdown parse+render | malformed.md | 237 | 2000 | 0.0038 | 361 | -34278.9 |
| marked parse+render | malformed.md | 237 | 2000 | 0.0054 | 350 | 16657.7 |
| markdown-it parse+render | malformed.md | 237 | 2000 | 0.0056 | 300 | -31630.1 |
| micromark render | malformed.md | 237 | 2000 | 0.0504 | 300 | 11184.8 |
| commonmark parse+render | malformed.md | 237 | 2000 | 0.0039 | 300 | 23073.0 |
| markdown-wasm render | malformed.md | 237 | 2000 | 0.0018 | 408 | 2938.7 |
| unified remark+rehype render | malformed.md | 237 | 2000 | 0.0552 | 297 | -30681.6 |
| @tanstack/markdown parse | prose-heavy.md | 1700 | 1000 | 0.0181 | 15 | 1601.4 |
| @tanstack/markdown render AST with external highlighter | prose-heavy.md | 1700 | 1000 | 0.0021 | 1903 | 10292.2 |
| @tanstack/markdown render AST | prose-heavy.md | 1700 | 1000 | 0.0024 | 1903 | 10320.5 |
| @tanstack/markdown parse+render with external highlighter | prose-heavy.md | 1700 | 1000 | 0.0201 | 1903 | 18362.3 |
| @tanstack/markdown parse+render | prose-heavy.md | 1700 | 1000 | 0.0203 | 1903 | 18847.2 |
| marked parse+render | prose-heavy.md | 1700 | 1000 | 0.0381 | 1860 | -5593.0 |
| markdown-it parse+render | prose-heavy.md | 1700 | 1000 | 0.0206 | 1860 | -8952.1 |
| micromark render | prose-heavy.md | 1700 | 1000 | 0.2549 | 1862 | 21780.6 |
| commonmark parse+render | prose-heavy.md | 1700 | 1000 | 0.0136 | 1862 | -14599.4 |
| markdown-wasm render | prose-heavy.md | 1700 | 1000 | 0.0064 | 2340 | 3369.4 |
| unified remark+rehype render | prose-heavy.md | 1700 | 1000 | 0.3225 | 1859 | -73200.9 |
| @tanstack/markdown parse | small-doc.md | 432 | 2000 | 0.0127 | 15 | 20112.5 |
| @tanstack/markdown render AST with external highlighter | small-doc.md | 432 | 2000 | 0.0043 | 1370 | -24522.9 |
| @tanstack/markdown render AST | small-doc.md | 432 | 2000 | 0.0028 | 1044 | 21772.9 |
| @tanstack/markdown parse+render with external highlighter | small-doc.md | 432 | 2000 | 0.0164 | 1370 | -9773.9 |
| @tanstack/markdown parse+render | small-doc.md | 432 | 2000 | 0.0168 | 1044 | -7187.6 |
| marked parse+render | small-doc.md | 432 | 2000 | 0.0147 | 724 | 50669.2 |
| markdown-it parse+render | small-doc.md | 432 | 2000 | 0.0087 | 776 | 4037.9 |
| micromark render | small-doc.md | 432 | 2000 | 0.1330 | 535 | 44880.4 |
| commonmark parse+render | small-doc.md | 432 | 2000 | 0.0074 | 535 | -15136.9 |
| markdown-wasm render | small-doc.md | 432 | 2000 | 0.0037 | 854 | 3631.2 |
| unified remark+rehype render | small-doc.md | 432 | 2000 | 0.1475 | 534 | 4013.4 |
| @tanstack/markdown parse | tables-lists.md | 454 | 2000 | 0.0295 | 15 | 12749.1 |
| @tanstack/markdown render AST with external highlighter | tables-lists.md | 454 | 2000 | 0.0058 | 1315 | -5483.2 |
| @tanstack/markdown render AST | tables-lists.md | 454 | 2000 | 0.0052 | 1315 | -14400.9 |
| @tanstack/markdown parse+render with external highlighter | tables-lists.md | 454 | 2000 | 0.0366 | 1315 | 6365.8 |
| @tanstack/markdown parse+render | tables-lists.md | 454 | 2000 | 0.0383 | 1315 | -91885.8 |
| marked parse+render | tables-lists.md | 454 | 2000 | 0.0325 | 1102 | -2774.7 |
| markdown-it parse+render | tables-lists.md | 454 | 2000 | 0.0213 | 1325 | 26335.4 |
| micromark render | tables-lists.md | 454 | 2000 | 0.1830 | 627 | 43377.3 |
| commonmark parse+render | tables-lists.md | 454 | 2000 | 0.0117 | 627 | -36650.8 |
| markdown-wasm render | tables-lists.md | 454 | 2000 | 0.0058 | 1202 | 4506.1 |
| unified remark+rehype render | tables-lists.md | 454 | 2000 | 0.2090 | 622 | -44098.0 |

## Streaming

| Name | Fixture | Bytes | Iterations | ms/op | Output bytes | Heap delta KB |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: |
| @tanstack/markdown streaming parse | ai-response.md | 652 | 250 | 0.2141 | 0 | 27889.1 |
| @tanstack/markdown streaming profile | ai-response.md | 652 | 250 | 0.2579 | 1112 | 65860.8 |
| @tanstack/markdown streaming with @tanstack/highlight | ai-response.md | 652 | 250 | 0.3811 | 1274 | 26043.9 |
| marked progressive parse+render | ai-response.md | 652 | 250 | 0.3046 | 1035 | 19526.3 |
| @tanstack/markdown streaming parse | unfinished-backtick-4kib | 4096 | 20 | 0.4621 | 0 | -34834.7 |
| @tanstack/markdown streaming profile | unfinished-backtick-4kib | 4096 | 20 | 0.8601 | 4731 | 695.4 |
| @tanstack/markdown streaming with @tanstack/highlight | unfinished-backtick-4kib | 4096 | 20 | 22.0687 | 16010 | 62990.4 |
| marked progressive parse+render | unfinished-backtick-4kib | 4096 | 20 | 0.7149 | 4702 | -36811.4 |
| @tanstack/markdown streaming parse | unfinished-backtick-16kib | 16384 | 10 | 5.8481 | 0 | -165018.2 |
| @tanstack/markdown streaming profile | unfinished-backtick-16kib | 16384 | 10 | 10.3301 | 18667 | 66138.5 |
| @tanstack/markdown streaming with @tanstack/highlight | unfinished-backtick-16kib | 16384 | 10 | 433.2552 | 62868 | 35834.8 |
| marked progressive parse+render | unfinished-backtick-16kib | 16384 | 10 | 10.2401 | 18638 | -4537.5 |
| @tanstack/markdown streaming parse | unfinished-backtick-64kib | 65536 | 5 | 88.7832 | 0 | 58977.8 |
| @tanstack/markdown streaming profile | unfinished-backtick-64kib | 65536 | 5 | 166.6901 | 74347 | -65495.2 |
| @tanstack/markdown streaming with @tanstack/highlight | unfinished-backtick-64kib | 65536 | 5 | 6953.5152 | 249146 | -35723.4 |
| marked progressive parse+render | unfinished-backtick-64kib | 65536 | 5 | 148.4297 | 74318 | 29715.1 |
| @tanstack/markdown streaming parse | unfinished-tilde-64kib | 65536 | 5 | 79.8277 | 0 | 71313.6 |
| @tanstack/markdown streaming profile | unfinished-tilde-64kib | 65536 | 5 | 151.5830 | 74347 | -86751.5 |
| @tanstack/markdown streaming with @tanstack/highlight | unfinished-tilde-64kib | 65536 | 5 | 8161.2490 | 249146 | -109512.5 |
| marked progressive parse+render | unfinished-tilde-64kib | 65536 | 5 | 147.2293 | 74318 | 29615.7 |
| @tanstack/markdown streaming parse | closing-backtick-64kib | 65566 | 5 | 83.4517 | 0 | 72340.5 |
| @tanstack/markdown streaming profile | closing-backtick-64kib | 65566 | 5 | 158.2382 | 74378 | 3098.0 |
| @tanstack/markdown streaming with @tanstack/highlight | closing-backtick-64kib | 65566 | 5 | 6534.3609 | 249177 | -117985.0 |
| marked progressive parse+render | closing-backtick-64kib | 65566 | 5 | 146.6420 | 74349 | -43318.0 |

For persistent React and incremental DOM comparisons against streaming-focused libraries, see the [browser streaming report](./streaming-browser.md).

## Streaming update latency

All timings below are milliseconds, pooled across measured replays after two full warmup replays. Percentiles use nearest rank. Each update contributes its output to a checksum. Parse-only rows use the same streaming options as rendering rows and report zero HTML output bytes.

Generated fixtures contain a growing TypeScript fence with an unfinished final line. Backtick fences cover 4, 16, and 64 KiB; a 64 KiB tilde fence checks the other delimiter. The closing case appends a closing fence and trailing prose to the same 64 KiB body. Open-fence membership uses known fixture offsets, independently of the parser. The late-open sample covers prefixes in the last 10% of the source up to the closing fence, or EOF when it never closes.

The streaming highlighter is the installed @tanstack/highlight TypeScript tokenizer and HTML adapter, initialized before timing and called on every code block on every update. The non-streaming external-highlighter rows above use a line-wrapping stub. Parse-only and plain-render rows help compare parsing cost with rendering; these are separate runs, not an instrumented phase breakdown.

| Name | Fixture | Updates/replay | Open updates/replay | Update p50 | Update p95 | Open p50 | Open p95 | Open max | Late open p95 | Final p50 |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @tanstack/markdown streaming parse | ai-response.md | 21 | 2 | 0.0075 | 0.0159 | 0.0058 | 0.0071 | 0.0494 | 0.0070 | 0.0149 |
| @tanstack/markdown streaming profile | ai-response.md | 21 | 2 | 0.0089 | 0.0193 | 0.0072 | 0.0087 | 0.0530 | 0.0091 | 0.0185 |
| @tanstack/markdown streaming with @tanstack/highlight | ai-response.md | 21 | 2 | 0.0176 | 0.0295 | 0.0126 | 0.0174 | 1.8180 | 0.0201 | 0.0261 |
| marked progressive parse+render | ai-response.md | 21 | 2 | 0.0131 | 0.0254 | 0.0098 | 0.0133 | 0.0253 | 0.0138 | 0.0235 |
| @tanstack/markdown streaming parse | unfinished-backtick-4kib | 128 | 127 | 0.0031 | 0.0051 | 0.0031 | 0.0051 | 0.6202 | 0.0061 | 0.0050 |
| @tanstack/markdown streaming profile | unfinished-backtick-4kib | 128 | 127 | 0.0056 | 0.0097 | 0.0057 | 0.0097 | 2.0297 | 0.0134 | 0.0095 |
| @tanstack/markdown streaming with @tanstack/highlight | unfinished-backtick-4kib | 128 | 127 | 0.1685 | 0.3212 | 0.1694 | 0.3213 | 0.7369 | 0.3593 | 0.3322 |
| marked progressive parse+render | unfinished-backtick-4kib | 128 | 127 | 0.0053 | 0.0093 | 0.0054 | 0.0093 | 0.3233 | 0.0112 | 0.0095 |
| @tanstack/markdown streaming parse | unfinished-backtick-16kib | 512 | 511 | 0.0095 | 0.0181 | 0.0095 | 0.0181 | 2.3500 | 0.0242 | 0.0176 |
| @tanstack/markdown streaming profile | unfinished-backtick-16kib | 512 | 511 | 0.0189 | 0.0345 | 0.0189 | 0.0345 | 1.5925 | 0.0410 | 0.0361 |
| @tanstack/markdown streaming with @tanstack/highlight | unfinished-backtick-16kib | 512 | 511 | 0.8176 | 1.7403 | 0.8186 | 1.7404 | 3.7254 | 2.1948 | 1.6743 |
| marked progressive parse+render | unfinished-backtick-16kib | 512 | 511 | 0.0194 | 0.0359 | 0.0195 | 0.0359 | 0.2829 | 0.0476 | 0.0360 |
| @tanstack/markdown streaming parse | unfinished-backtick-64kib | 2048 | 2047 | 0.0362 | 0.0810 | 0.0362 | 0.0810 | 3.2907 | 0.1178 | 0.0671 |
| @tanstack/markdown streaming profile | unfinished-backtick-64kib | 2048 | 2047 | 0.0735 | 0.1531 | 0.0735 | 0.1533 | 2.1279 | 0.2269 | 0.1315 |
| @tanstack/markdown streaming with @tanstack/highlight | unfinished-backtick-64kib | 2048 | 2047 | 3.4199 | 6.5803 | 3.4216 | 6.5835 | 12.0435 | 7.7552 | 6.7720 |
| marked progressive parse+render | unfinished-backtick-64kib | 2048 | 2047 | 0.0726 | 0.1342 | 0.0727 | 0.1342 | 0.4335 | 0.1549 | 0.1372 |
| @tanstack/markdown streaming parse | unfinished-tilde-64kib | 2048 | 2047 | 0.0340 | 0.0644 | 0.0340 | 0.0645 | 2.7499 | 0.0819 | 0.0658 |
| @tanstack/markdown streaming profile | unfinished-tilde-64kib | 2048 | 2047 | 0.0697 | 0.1275 | 0.0698 | 0.1275 | 1.7017 | 0.1492 | 0.1275 |
| @tanstack/markdown streaming with @tanstack/highlight | unfinished-tilde-64kib | 2048 | 2047 | 3.7827 | 8.1041 | 3.7843 | 8.1067 | 92.9487 | 9.3680 | 6.7152 |
| marked progressive parse+render | unfinished-tilde-64kib | 2048 | 2047 | 0.0708 | 0.1332 | 0.0709 | 0.1332 | 0.3760 | 0.1583 | 0.1394 |
| @tanstack/markdown streaming parse | closing-backtick-64kib | 2049 | 2047 | 0.0349 | 0.0696 | 0.0349 | 0.0695 | 3.1709 | 0.0973 | 0.0747 |
| @tanstack/markdown streaming profile | closing-backtick-64kib | 2049 | 2047 | 0.0692 | 0.1397 | 0.0692 | 0.1395 | 1.7650 | 0.1669 | 0.1467 |
| @tanstack/markdown streaming with @tanstack/highlight | closing-backtick-64kib | 2049 | 2047 | 3.1582 | 6.1610 | 3.1582 | 6.1598 | 12.5397 | 7.1230 | 6.2508 |
| marked progressive parse+render | closing-backtick-64kib | 2049 | 2047 | 0.0713 | 0.1333 | 0.0713 | 0.1333 | 0.3815 | 0.1559 | 0.1559 |

## Averages

| Group | Name | Mean ms/op |
| :--- | :--- | ---: |
| markdown | @tanstack/markdown parse | 0.0159 |
| markdown | @tanstack/markdown render AST with external highlighter | 0.0046 |
| markdown | @tanstack/markdown render AST | 0.0031 |
| markdown | @tanstack/markdown parse+render with external highlighter | 0.0204 |
| markdown | @tanstack/markdown parse+render | 0.0198 |
| markdown | marked parse+render | 0.0212 |
| markdown | markdown-it parse+render | 0.0141 |
| markdown | micromark render | 0.1583 |
| markdown | commonmark parse+render | 0.0101 |
| markdown | markdown-wasm render | 0.0052 |
| markdown | unified remark+rehype render | 0.1843 |
