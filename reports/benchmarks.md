# Benchmark Results

Generated: 2026-07-22T14:20:21.293Z

Lower `ms/op` is better. Benchmarks run in Node with production package builds where available; heap delta is a coarse process-level signal, not an allocation profiler.

## Markdown

| Name | Fixture | Bytes | Iterations | ms/op | Output bytes | Heap delta KB |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: |
| @tanstack/markdown parse | code-heavy.md | 1011 | 1000 | 0.0088 | 15 | -417.5 |
| @tanstack/markdown render AST with external highlighter | code-heavy.md | 1011 | 1000 | 0.0080 | 4504 | 4003.9 |
| @tanstack/markdown render AST | code-heavy.md | 1011 | 1000 | 0.0039 | 1835 | -1174.4 |
| @tanstack/markdown parse+render with external highlighter | code-heavy.md | 1011 | 1000 | 0.0149 | 4504 | -707.3 |
| @tanstack/markdown parse+render | code-heavy.md | 1011 | 1000 | 0.0109 | 1835 | 1668.1 |
| marked parse+render | code-heavy.md | 1011 | 1000 | 0.0065 | 1330 | 4953.8 |
| markdown-it parse+render | code-heavy.md | 1011 | 1000 | 0.0102 | 1330 | -4841.0 |
| micromark render | code-heavy.md | 1011 | 1000 | 0.1495 | 1330 | 7278.6 |
| commonmark parse+render | code-heavy.md | 1011 | 1000 | 0.0109 | 1330 | -8518.4 |
| markdown-wasm render | code-heavy.md | 1011 | 1000 | 0.0083 | 1512 | 2591.3 |
| unified remark+rehype render | code-heavy.md | 1011 | 1000 | 0.1444 | 1200 | -2061.2 |
| @tanstack/markdown parse | malformed.md | 237 | 2000 | 0.0052 | 15 | 8761.1 |
| @tanstack/markdown render AST with external highlighter | malformed.md | 237 | 2000 | 0.0020 | 1067 | 898.5 |
| @tanstack/markdown render AST | malformed.md | 237 | 2000 | 0.0008 | 361 | -9449.0 |
| @tanstack/markdown parse+render with external highlighter | malformed.md | 237 | 2000 | 0.0050 | 1067 | 8618.2 |
| @tanstack/markdown parse+render | malformed.md | 237 | 2000 | 0.0040 | 361 | -1949.3 |
| marked parse+render | malformed.md | 237 | 2000 | 0.0050 | 350 | 394.8 |
| markdown-it parse+render | malformed.md | 237 | 2000 | 0.0054 | 300 | -7565.9 |
| micromark render | malformed.md | 237 | 2000 | 0.0462 | 300 | -6294.8 |
| commonmark parse+render | malformed.md | 237 | 2000 | 0.0043 | 300 | 7496.9 |
| markdown-wasm render | malformed.md | 237 | 2000 | 0.0019 | 408 | 2953.6 |
| unified remark+rehype render | malformed.md | 237 | 2000 | 0.0499 | 297 | 3086.0 |
| @tanstack/markdown parse | prose-heavy.md | 1700 | 1000 | 0.0254 | 15 | 1412.6 |
| @tanstack/markdown render AST with external highlighter | prose-heavy.md | 1700 | 1000 | 0.0025 | 1903 | -4233.5 |
| @tanstack/markdown render AST | prose-heavy.md | 1700 | 1000 | 0.0024 | 1903 | 12075.8 |
| @tanstack/markdown parse+render with external highlighter | prose-heavy.md | 1700 | 1000 | 0.0262 | 1903 | 14559.5 |
| @tanstack/markdown parse+render | prose-heavy.md | 1700 | 1000 | 0.0251 | 1903 | -1890.6 |
| marked parse+render | prose-heavy.md | 1700 | 1000 | 0.0342 | 1860 | 7072.1 |
| markdown-it parse+render | prose-heavy.md | 1700 | 1000 | 0.0185 | 1860 | -3138.3 |
| micromark render | prose-heavy.md | 1700 | 1000 | 0.2377 | 1862 | -7116.1 |
| commonmark parse+render | prose-heavy.md | 1700 | 1000 | 0.0135 | 1862 | 48070.6 |
| markdown-wasm render | prose-heavy.md | 1700 | 1000 | 0.0067 | 2340 | 3369.6 |
| unified remark+rehype render | prose-heavy.md | 1700 | 1000 | 0.2731 | 1859 | 52442.5 |
| @tanstack/markdown parse | small-doc.md | 432 | 2000 | 0.0100 | 15 | 22697.3 |
| @tanstack/markdown render AST with external highlighter | small-doc.md | 432 | 2000 | 0.0033 | 1328 | -33220.3 |
| @tanstack/markdown render AST | small-doc.md | 432 | 2000 | 0.0028 | 1002 | 25869.0 |
| @tanstack/markdown parse+render with external highlighter | small-doc.md | 432 | 2000 | 0.0128 | 1328 | -14894.3 |
| @tanstack/markdown parse+render | small-doc.md | 432 | 2000 | 0.0122 | 1002 | -20447.8 |
| marked parse+render | small-doc.md | 432 | 2000 | 0.0120 | 724 | 49454.6 |
| markdown-it parse+render | small-doc.md | 432 | 2000 | 0.0079 | 776 | 1721.2 |
| micromark render | small-doc.md | 432 | 2000 | 0.0956 | 535 | -20592.6 |
| commonmark parse+render | small-doc.md | 432 | 2000 | 0.0059 | 535 | -15109.8 |
| markdown-wasm render | small-doc.md | 432 | 2000 | 0.0033 | 854 | 3682.8 |
| unified remark+rehype render | small-doc.md | 432 | 2000 | 0.1077 | 534 | 4655.7 |
| @tanstack/markdown parse | tables-lists.md | 454 | 2000 | 0.0255 | 15 | -16648.3 |
| @tanstack/markdown render AST with external highlighter | tables-lists.md | 454 | 2000 | 0.0048 | 1315 | -17193.0 |
| @tanstack/markdown render AST | tables-lists.md | 454 | 2000 | 0.0042 | 1315 | 47682.1 |
| @tanstack/markdown parse+render with external highlighter | tables-lists.md | 454 | 2000 | 0.0282 | 1315 | -35005.5 |
| @tanstack/markdown parse+render | tables-lists.md | 454 | 2000 | 0.0278 | 1315 | 30465.3 |
| marked parse+render | tables-lists.md | 454 | 2000 | 0.0276 | 1102 | -19255.3 |
| markdown-it parse+render | tables-lists.md | 454 | 2000 | 0.0179 | 1325 | -42296.0 |
| micromark render | tables-lists.md | 454 | 2000 | 0.1611 | 627 | 26564.2 |
| commonmark parse+render | tables-lists.md | 454 | 2000 | 0.0122 | 627 | -35562.6 |
| markdown-wasm render | tables-lists.md | 454 | 2000 | 0.0059 | 1202 | 4504.4 |
| unified remark+rehype render | tables-lists.md | 454 | 2000 | 0.1885 | 622 | 9034.0 |

## Averages

| Group | Name | Mean ms/op |
| :--- | :--- | ---: |
| markdown | @tanstack/markdown parse | 0.0150 |
| markdown | @tanstack/markdown render AST with external highlighter | 0.0041 |
| markdown | @tanstack/markdown render AST | 0.0028 |
| markdown | @tanstack/markdown parse+render with external highlighter | 0.0174 |
| markdown | @tanstack/markdown parse+render | 0.0160 |
| markdown | marked parse+render | 0.0170 |
| markdown | markdown-it parse+render | 0.0120 |
| markdown | micromark render | 0.1380 |
| markdown | commonmark parse+render | 0.0094 |
| markdown | markdown-wasm render | 0.0052 |
| markdown | unified remark+rehype render | 0.1527 |
