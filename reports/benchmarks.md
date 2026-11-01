# Benchmark Results

Generated: 2026-09-30T23:01:01.675Z

Environment: Node v24.21.0, darwin arm64, Apple M5 Pro.

Lower `ms/op` is better. Benchmarks run in Node with production dependency builds where available and local Markdown source; heap delta is a coarse process-level signal, not an allocation profiler. Streaming rows replay the complete response in 32-character chunks, so one operation is one progressive response. Every prefix is parsed from scratch. Replay time includes slicing, timing, and collecting samples; per-update latency times only the parser or renderer call. Browser layout, framework updates, and network delays are excluded.

## Markdown

| Name | Fixture | Bytes | Iterations | ms/op | Output bytes | Heap delta KB |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: |
| @tanstack/markdown parse | ai-response.md | 652 | 2000 | 0.0231 | 15 | 39319.8 |
| @tanstack/markdown render AST with external highlighter | ai-response.md | 652 | 2000 | 0.0057 | 1399 | -18030.5 |
| @tanstack/markdown render AST | ai-response.md | 652 | 2000 | 0.0036 | 1143 | -3178.4 |
| @tanstack/markdown parse+render with external highlighter | ai-response.md | 652 | 2000 | 0.0258 | 1399 | 22823.9 |
| @tanstack/markdown parse+render | ai-response.md | 652 | 2000 | 0.0241 | 1143 | -12809.9 |
| marked parse+render | ai-response.md | 652 | 2000 | 0.0266 | 1035 | 27814.2 |
| markdown-it parse+render | ai-response.md | 652 | 2000 | 0.0183 | 1087 | -15946.6 |
| micromark render | ai-response.md | 652 | 2000 | 0.1549 | 825 | -14778.1 |
| commonmark parse+render | ai-response.md | 652 | 2000 | 0.0125 | 825 | 16212.6 |
| markdown-wasm render | ai-response.md | 652 | 2000 | 0.0079 | 1117 | 4373.8 |
| unified remark+rehype render | ai-response.md | 652 | 2000 | 0.1820 | 824 | 7768.1 |
| @tanstack/markdown parse | code-heavy.md | 1011 | 1000 | 0.0071 | 15 | 22915.1 |
| @tanstack/markdown render AST with external highlighter | code-heavy.md | 1011 | 1000 | 0.0082 | 4596 | -29854.7 |
| @tanstack/markdown render AST | code-heavy.md | 1011 | 1000 | 0.0031 | 1927 | 10478.2 |
| @tanstack/markdown parse+render with external highlighter | code-heavy.md | 1011 | 1000 | 0.0148 | 4596 | -4365.1 |
| @tanstack/markdown parse+render | code-heavy.md | 1011 | 1000 | 0.0098 | 1927 | 33441.6 |
| marked parse+render | code-heavy.md | 1011 | 1000 | 0.0062 | 1330 | 12906.4 |
| markdown-it parse+render | code-heavy.md | 1011 | 1000 | 0.0094 | 1330 | -31203.3 |
| micromark render | code-heavy.md | 1011 | 1000 | 0.1418 | 1330 | -8001.0 |
| commonmark parse+render | code-heavy.md | 1011 | 1000 | 0.0094 | 1330 | 24582.9 |
| markdown-wasm render | code-heavy.md | 1011 | 1000 | 0.0039 | 1512 | 2559.9 |
| unified remark+rehype render | code-heavy.md | 1011 | 1000 | 0.1473 | 1200 | 24883.4 |
| @tanstack/markdown parse | malformed.md | 237 | 2000 | 0.0026 | 15 | 19347.1 |
| @tanstack/markdown render AST with external highlighter | malformed.md | 237 | 2000 | 0.0019 | 1067 | -45990.2 |
| @tanstack/markdown render AST | malformed.md | 237 | 2000 | 0.0008 | 361 | 5314.6 |
| @tanstack/markdown parse+render with external highlighter | malformed.md | 237 | 2000 | 0.0041 | 1067 | 35040.7 |
| @tanstack/markdown parse+render | malformed.md | 237 | 2000 | 0.0036 | 361 | -30869.7 |
| marked parse+render | malformed.md | 237 | 2000 | 0.0051 | 350 | 16137.0 |
| markdown-it parse+render | malformed.md | 237 | 2000 | 0.0045 | 300 | 24769.2 |
| micromark render | malformed.md | 237 | 2000 | 0.0488 | 300 | -49578.3 |
| commonmark parse+render | malformed.md | 237 | 2000 | 0.0037 | 300 | 23073.8 |
| markdown-wasm render | malformed.md | 237 | 2000 | 0.0017 | 408 | 2938.7 |
| unified remark+rehype render | malformed.md | 237 | 2000 | 0.0530 | 297 | -30685.5 |
| @tanstack/markdown parse | prose-heavy.md | 1700 | 1000 | 0.0148 | 15 | 58579.9 |
| @tanstack/markdown render AST with external highlighter | prose-heavy.md | 1700 | 1000 | 0.0041 | 1903 | -42841.5 |
| @tanstack/markdown render AST | prose-heavy.md | 1700 | 1000 | 0.0028 | 1903 | 10328.9 |
| @tanstack/markdown parse+render with external highlighter | prose-heavy.md | 1700 | 1000 | 0.0188 | 1903 | 22426.2 |
| @tanstack/markdown parse+render | prose-heavy.md | 1700 | 1000 | 0.0189 | 1903 | 20395.1 |
| marked parse+render | prose-heavy.md | 1700 | 1000 | 0.0374 | 1860 | -8289.1 |
| markdown-it parse+render | prose-heavy.md | 1700 | 1000 | 0.0192 | 1860 | -11639.0 |
| micromark render | prose-heavy.md | 1700 | 1000 | 0.2373 | 1862 | 23424.2 |
| commonmark parse+render | prose-heavy.md | 1700 | 1000 | 0.0125 | 1862 | -15252.8 |
| markdown-wasm render | prose-heavy.md | 1700 | 1000 | 0.0059 | 2340 | 3368.2 |
| unified remark+rehype render | prose-heavy.md | 1700 | 1000 | 0.2684 | 1859 | 50649.2 |
| @tanstack/markdown parse | small-doc.md | 432 | 2000 | 0.0120 | 15 | 24191.9 |
| @tanstack/markdown render AST with external highlighter | small-doc.md | 432 | 2000 | 0.0039 | 1370 | -25168.5 |
| @tanstack/markdown render AST | small-doc.md | 432 | 2000 | 0.0027 | 1044 | 21771.8 |
| @tanstack/markdown parse+render with external highlighter | small-doc.md | 432 | 2000 | 0.0146 | 1370 | -6793.4 |
| @tanstack/markdown parse+render | small-doc.md | 432 | 2000 | 0.0137 | 1044 | 47308.6 |
| marked parse+render | small-doc.md | 432 | 2000 | 0.0133 | 724 | 50669.1 |
| markdown-it parse+render | small-doc.md | 432 | 2000 | 0.0083 | 776 | 9738.6 |
| micromark render | small-doc.md | 432 | 2000 | 0.1014 | 535 | 45061.3 |
| commonmark parse+render | small-doc.md | 432 | 2000 | 0.0063 | 535 | -15154.1 |
| markdown-wasm render | small-doc.md | 432 | 2000 | 0.0032 | 854 | 3584.4 |
| unified remark+rehype render | small-doc.md | 432 | 2000 | 0.1161 | 534 | 4153.8 |
| @tanstack/markdown parse | tables-lists.md | 454 | 2000 | 0.0274 | 15 | 21858.8 |
| @tanstack/markdown render AST with external highlighter | tables-lists.md | 454 | 2000 | 0.0056 | 1315 | -5902.1 |
| @tanstack/markdown render AST | tables-lists.md | 454 | 2000 | 0.0045 | 1315 | -14615.3 |
| @tanstack/markdown parse+render with external highlighter | tables-lists.md | 454 | 2000 | 0.0334 | 1315 | 13028.4 |
| @tanstack/markdown parse+render | tables-lists.md | 454 | 2000 | 0.0359 | 1315 | -84288.2 |
| marked parse+render | tables-lists.md | 454 | 2000 | 0.0303 | 1102 | 6604.8 |
| markdown-it parse+render | tables-lists.md | 454 | 2000 | 0.0179 | 1325 | -39166.9 |
| micromark render | tables-lists.md | 454 | 2000 | 0.1760 | 627 | 29847.6 |
| commonmark parse+render | tables-lists.md | 454 | 2000 | 0.0117 | 627 | -36841.4 |
| markdown-wasm render | tables-lists.md | 454 | 2000 | 0.0058 | 1202 | 4506.1 |
| unified remark+rehype render | tables-lists.md | 454 | 2000 | 0.1999 | 622 | 11679.6 |

## Streaming

| Name | Fixture | Bytes | Iterations | ms/op | Output bytes | Heap delta KB |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: |
| @tanstack/markdown streaming parse | ai-response.md | 652 | 250 | 0.2226 | 0 | 38394.3 |
| @tanstack/markdown streaming profile | ai-response.md | 652 | 250 | 0.2822 | 1112 | 24961.3 |
| @tanstack/markdown streaming with @tanstack/highlight | ai-response.md | 652 | 250 | 0.3564 | 1358 | 68355.1 |
| marked progressive parse+render | ai-response.md | 652 | 250 | 0.3010 | 1035 | -43364.9 |
| @tanstack/markdown streaming parse | unfinished-backtick-4kib | 4096 | 20 | 0.4292 | 0 | 29134.0 |
| @tanstack/markdown streaming profile | unfinished-backtick-4kib | 4096 | 20 | 0.8094 | 4731 | -90.0 |
| @tanstack/markdown streaming with @tanstack/highlight | unfinished-backtick-4kib | 4096 | 20 | 13.3481 | 21890 | 23042.8 |
| marked progressive parse+render | unfinished-backtick-4kib | 4096 | 20 | 0.7055 | 4702 | 28115.1 |
| @tanstack/markdown streaming parse | unfinished-backtick-16kib | 16384 | 10 | 5.2927 | 0 | 58919.2 |
| @tanstack/markdown streaming profile | unfinished-backtick-16kib | 16384 | 10 | 10.0132 | 18667 | 67338.4 |
| @tanstack/markdown streaming with @tanstack/highlight | unfinished-backtick-16kib | 16384 | 10 | 208.0735 | 86052 | -94523.8 |
| marked progressive parse+render | unfinished-backtick-16kib | 16384 | 10 | 10.0016 | 18638 | -4468.8 |
| @tanstack/markdown streaming parse | unfinished-backtick-64kib | 65536 | 5 | 77.7222 | 0 | 106103.7 |
| @tanstack/markdown streaming profile | unfinished-backtick-64kib | 65536 | 5 | 146.4689 | 74347 | 101922.9 |
| @tanstack/markdown streaming with @tanstack/highlight | unfinished-backtick-64kib | 65536 | 5 | 3331.0572 | 340874 | -17365.6 |
| marked progressive parse+render | unfinished-backtick-64kib | 65536 | 5 | 148.6360 | 74318 | -39887.9 |
| @tanstack/markdown streaming parse | unfinished-tilde-64kib | 65536 | 5 | 83.1405 | 0 | -36447.5 |
| @tanstack/markdown streaming profile | unfinished-tilde-64kib | 65536 | 5 | 144.7382 | 74347 | -63612.9 |
| @tanstack/markdown streaming with @tanstack/highlight | unfinished-tilde-64kib | 65536 | 5 | 3308.1843 | 340874 | -108007.8 |
| marked progressive parse+render | unfinished-tilde-64kib | 65536 | 5 | 146.2123 | 74318 | 27043.1 |
| @tanstack/markdown streaming parse | closing-backtick-64kib | 65566 | 5 | 78.8489 | 0 | 66372.8 |
| @tanstack/markdown streaming profile | closing-backtick-64kib | 65566 | 5 | 169.5598 | 74378 | -50285.6 |
| @tanstack/markdown streaming with @tanstack/highlight | closing-backtick-64kib | 65566 | 5 | 4155.7038 | 340905 | -38715.3 |
| marked progressive parse+render | closing-backtick-64kib | 65566 | 5 | 149.5698 | 74349 | -44930.3 |

For persistent React and incremental DOM comparisons against streaming-focused libraries, see the [browser streaming report](./streaming-browser.md).

## Streaming update latency

All timings below are milliseconds, pooled across measured replays after two full warmup replays. Percentiles use nearest rank. Each update contributes its output to a checksum. Parse-only rows use the same streaming options as rendering rows and report zero HTML output bytes.

Generated fixtures contain a growing TypeScript fence with an unfinished final line. Backtick fences cover 4, 16, and 64 KiB; a 64 KiB tilde fence checks the other delimiter. The closing case appends a closing fence and trailing prose to the same 64 KiB body. Open-fence membership uses known fixture offsets, independently of the parser. The late-open sample covers prefixes in the last 10% of the source up to the closing fence, or EOF when it never closes.

The streaming highlighter is the installed @tanstack/highlight TypeScript tokenizer and HTML adapter, initialized before timing and called on every code block on every update. The non-streaming external-highlighter rows above use a line-wrapping stub. Parse-only and plain-render rows help compare parsing cost with rendering; these are separate runs, not an instrumented phase breakdown.

| Name | Fixture | Updates/replay | Open updates/replay | Update p50 | Update p95 | Open p50 | Open p95 | Open max | Late open p95 | Final p50 |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @tanstack/markdown streaming parse | ai-response.md | 21 | 2 | 0.0079 | 0.0169 | 0.0060 | 0.0081 | 0.0380 | 0.0077 | 0.0156 |
| @tanstack/markdown streaming profile | ai-response.md | 21 | 2 | 0.0099 | 0.0211 | 0.0075 | 0.0105 | 0.0494 | 0.0105 | 0.0192 |
| @tanstack/markdown streaming with @tanstack/highlight | ai-response.md | 21 | 2 | 0.0161 | 0.0279 | 0.0115 | 0.0167 | 0.0522 | 0.0176 | 0.0252 |
| marked progressive parse+render | ai-response.md | 21 | 2 | 0.0123 | 0.0239 | 0.0099 | 0.0115 | 0.0485 | 0.0115 | 0.0233 |
| @tanstack/markdown streaming parse | unfinished-backtick-4kib | 128 | 127 | 0.0031 | 0.0050 | 0.0031 | 0.0050 | 0.1149 | 0.0055 | 0.0051 |
| @tanstack/markdown streaming profile | unfinished-backtick-4kib | 128 | 127 | 0.0055 | 0.0093 | 0.0056 | 0.0093 | 1.4059 | 0.0099 | 0.0095 |
| @tanstack/markdown streaming with @tanstack/highlight | unfinished-backtick-4kib | 128 | 127 | 0.1038 | 0.1882 | 0.1045 | 0.1883 | 0.5522 | 0.2136 | 0.1918 |
| marked progressive parse+render | unfinished-backtick-4kib | 128 | 127 | 0.0054 | 0.0093 | 0.0054 | 0.0093 | 0.0444 | 0.0103 | 0.0095 |
| @tanstack/markdown streaming parse | unfinished-backtick-16kib | 512 | 511 | 0.0094 | 0.0164 | 0.0094 | 0.0164 | 2.9473 | 0.0193 | 0.0170 |
| @tanstack/markdown streaming profile | unfinished-backtick-16kib | 512 | 511 | 0.0179 | 0.0329 | 0.0180 | 0.0330 | 1.5409 | 0.0407 | 0.0340 |
| @tanstack/markdown streaming with @tanstack/highlight | unfinished-backtick-16kib | 512 | 511 | 0.4020 | 0.7568 | 0.4035 | 0.7568 | 3.7079 | 0.9166 | 0.7837 |
| marked progressive parse+render | unfinished-backtick-16kib | 512 | 511 | 0.0195 | 0.0359 | 0.0195 | 0.0359 | 0.2392 | 0.0418 | 0.0360 |
| @tanstack/markdown streaming parse | unfinished-backtick-64kib | 2048 | 2047 | 0.0343 | 0.0640 | 0.0344 | 0.0640 | 2.5243 | 0.0713 | 0.0664 |
| @tanstack/markdown streaming profile | unfinished-backtick-64kib | 2048 | 2047 | 0.0675 | 0.1259 | 0.0676 | 0.1259 | 1.5798 | 0.1410 | 0.1267 |
| @tanstack/markdown streaming with @tanstack/highlight | unfinished-backtick-64kib | 2048 | 2047 | 1.6265 | 3.0787 | 1.6273 | 3.0794 | 5.4585 | 3.7923 | 3.0968 |
| marked progressive parse+render | unfinished-backtick-64kib | 2048 | 2047 | 0.0727 | 0.1348 | 0.0727 | 0.1348 | 0.3616 | 0.1487 | 0.1410 |
| @tanstack/markdown streaming parse | unfinished-tilde-64kib | 2048 | 2047 | 0.0347 | 0.0697 | 0.0347 | 0.0697 | 2.9380 | 0.0881 | 0.0645 |
| @tanstack/markdown streaming profile | unfinished-tilde-64kib | 2048 | 2047 | 0.0665 | 0.1239 | 0.0665 | 0.1239 | 1.8263 | 0.1345 | 0.1289 |
| @tanstack/markdown streaming with @tanstack/highlight | unfinished-tilde-64kib | 2048 | 2047 | 1.5834 | 3.0910 | 1.5840 | 3.0910 | 6.1165 | 3.8093 | 3.2749 |
| marked progressive parse+render | unfinished-tilde-64kib | 2048 | 2047 | 0.0695 | 0.1342 | 0.0696 | 0.1342 | 0.3658 | 0.1682 | 0.1364 |
| @tanstack/markdown streaming parse | closing-backtick-64kib | 2049 | 2047 | 0.0335 | 0.0627 | 0.0335 | 0.0627 | 3.0912 | 0.0903 | 0.0757 |
| @tanstack/markdown streaming profile | closing-backtick-64kib | 2049 | 2047 | 0.0749 | 0.1575 | 0.0749 | 0.1574 | 2.1431 | 0.2071 | 0.1625 |
| @tanstack/markdown streaming with @tanstack/highlight | closing-backtick-64kib | 2049 | 2047 | 1.7903 | 3.9215 | 1.7903 | 3.9218 | 76.2777 | 8.5765 | 3.4574 |
| marked progressive parse+render | closing-backtick-64kib | 2049 | 2047 | 0.0723 | 0.1350 | 0.0723 | 0.1350 | 0.4568 | 0.1710 | 0.1567 |

## Averages

| Group | Name | Mean ms/op |
| :--- | :--- | ---: |
| markdown | @tanstack/markdown parse | 0.0145 |
| markdown | @tanstack/markdown render AST with external highlighter | 0.0049 |
| markdown | @tanstack/markdown render AST | 0.0029 |
| markdown | @tanstack/markdown parse+render with external highlighter | 0.0186 |
| markdown | @tanstack/markdown parse+render | 0.0177 |
| markdown | marked parse+render | 0.0198 |
| markdown | markdown-it parse+render | 0.0129 |
| markdown | micromark render | 0.1433 |
| markdown | commonmark parse+render | 0.0093 |
| markdown | markdown-wasm render | 0.0047 |
| markdown | unified remark+rehype render | 0.1611 |
