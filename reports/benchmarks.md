# Benchmark Results

Generated: 2026-07-21T20:15:49.953Z

Lower `ms/op` is better. Benchmarks run in Node with production package builds where available; heap delta is a coarse process-level signal, not an allocation profiler.

## Markdown

| Name | Fixture | Bytes | Iterations | ms/op | Output bytes | Heap delta KB |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: |
| @tanstack/markdown parse | code-heavy.md | 1011 | 1000 | 0.0093 | 15 | -442.2 |
| @tanstack/markdown render AST with external highlighter | code-heavy.md | 1011 | 1000 | 0.0083 | 4504 | 3791.8 |
| @tanstack/markdown render AST | code-heavy.md | 1011 | 1000 | 0.0040 | 1835 | -1111.7 |
| @tanstack/markdown parse+render with external highlighter | code-heavy.md | 1011 | 1000 | 0.0160 | 4504 | -482.5 |
| @tanstack/markdown parse+render | code-heavy.md | 1011 | 1000 | 0.0112 | 1835 | -6340.2 |
| marked parse+render | code-heavy.md | 1011 | 1000 | 0.0067 | 1330 | 4973.0 |
| markdown-it parse+render | code-heavy.md | 1011 | 1000 | 0.0107 | 1330 | -4892.7 |
| micromark render | code-heavy.md | 1011 | 1000 | 0.1398 | 1330 | 6.3 |
| commonmark parse+render | code-heavy.md | 1011 | 1000 | 0.0106 | 1330 | 8476.9 |
| markdown-wasm render | code-heavy.md | 1011 | 1000 | 0.0086 | 1512 | -13744.9 |
| unified remark+rehype render | code-heavy.md | 1011 | 1000 | 0.1337 | 1200 | -943.4 |
| @tanstack/markdown parse | malformed.md | 237 | 2000 | 0.0048 | 15 | -7516.4 |
| @tanstack/markdown render AST with external highlighter | malformed.md | 237 | 2000 | 0.0018 | 1067 | 895.5 |
| @tanstack/markdown render AST | malformed.md | 237 | 2000 | 0.0008 | 361 | 6929.9 |
| @tanstack/markdown parse+render with external highlighter | malformed.md | 237 | 2000 | 0.0053 | 1067 | -7964.5 |
| @tanstack/markdown parse+render | malformed.md | 237 | 2000 | 0.0041 | 361 | -1916.3 |
| marked parse+render | malformed.md | 237 | 2000 | 0.0050 | 350 | 158.8 |
| markdown-it parse+render | malformed.md | 237 | 2000 | 0.0055 | 300 | 8677.8 |
| micromark render | malformed.md | 237 | 2000 | 0.0476 | 300 | 10101.6 |
| commonmark parse+render | malformed.md | 237 | 2000 | 0.0044 | 300 | -8750.9 |
| markdown-wasm render | malformed.md | 237 | 2000 | 0.0019 | 408 | 2953.7 |
| unified remark+rehype render | malformed.md | 237 | 2000 | 0.0494 | 297 | 3650.9 |
| @tanstack/markdown parse | prose-heavy.md | 1700 | 1000 | 0.0244 | 15 | 1380.9 |
| @tanstack/markdown render AST with external highlighter | prose-heavy.md | 1700 | 1000 | 0.0025 | 1903 | 12105.2 |
| @tanstack/markdown render AST | prose-heavy.md | 1700 | 1000 | 0.0026 | 1903 | -4255.3 |
| @tanstack/markdown parse+render with external highlighter | prose-heavy.md | 1700 | 1000 | 0.0262 | 1903 | -1717.1 |
| @tanstack/markdown parse+render | prose-heavy.md | 1700 | 1000 | 0.0256 | 1903 | -1880.3 |
| marked parse+render | prose-heavy.md | 1700 | 1000 | 0.0354 | 1860 | -9105.3 |
| markdown-it parse+render | prose-heavy.md | 1700 | 1000 | 0.0192 | 1860 | -3247.1 |
| micromark render | prose-heavy.md | 1700 | 1000 | 0.2587 | 1862 | 8422.6 |
| commonmark parse+render | prose-heavy.md | 1700 | 1000 | 0.0141 | 1862 | 48080.5 |
| markdown-wasm render | prose-heavy.md | 1700 | 1000 | 0.0067 | 2340 | 3366.9 |
| unified remark+rehype render | prose-heavy.md | 1700 | 1000 | 0.2550 | 1859 | 52468.8 |
| @tanstack/markdown parse | small-doc.md | 432 | 2000 | 0.0096 | 15 | 23199.4 |
| @tanstack/markdown render AST with external highlighter | small-doc.md | 432 | 2000 | 0.0036 | 1328 | -32634.8 |
| @tanstack/markdown render AST | small-doc.md | 432 | 2000 | 0.0027 | 1002 | 25868.4 |
| @tanstack/markdown parse+render with external highlighter | small-doc.md | 432 | 2000 | 0.0132 | 1328 | -14890.9 |
| @tanstack/markdown parse+render | small-doc.md | 432 | 2000 | 0.0126 | 1002 | -20409.8 |
| marked parse+render | small-doc.md | 432 | 2000 | 0.0126 | 724 | 49459.6 |
| markdown-it parse+render | small-doc.md | 432 | 2000 | 0.0083 | 776 | 1651.0 |
| micromark render | small-doc.md | 432 | 2000 | 0.0967 | 535 | 44808.4 |
| commonmark parse+render | small-doc.md | 432 | 2000 | 0.0064 | 535 | -15155.2 |
| markdown-wasm render | small-doc.md | 432 | 2000 | 0.0035 | 854 | 3824.1 |
| unified remark+rehype render | small-doc.md | 432 | 2000 | 0.1166 | 534 | 4897.6 |
| @tanstack/markdown parse | tables-lists.md | 454 | 2000 | 0.0248 | 15 | -16598.6 |
| @tanstack/markdown render AST with external highlighter | tables-lists.md | 454 | 2000 | 0.0048 | 1315 | -17134.1 |
| @tanstack/markdown render AST | tables-lists.md | 454 | 2000 | 0.0043 | 1315 | -17571.5 |
| @tanstack/markdown parse+render with external highlighter | tables-lists.md | 454 | 2000 | 0.0291 | 1315 | 30529.3 |
| @tanstack/markdown parse+render | tables-lists.md | 454 | 2000 | 0.0286 | 1315 | -35010.9 |
| marked parse+render | tables-lists.md | 454 | 2000 | 0.0282 | 1102 | 45871.8 |
| markdown-it parse+render | tables-lists.md | 454 | 2000 | 0.0185 | 1325 | -42290.9 |
| micromark render | tables-lists.md | 454 | 2000 | 0.1641 | 627 | 26495.4 |
| commonmark parse+render | tables-lists.md | 454 | 2000 | 0.0124 | 627 | -35588.9 |
| markdown-wasm render | tables-lists.md | 454 | 2000 | 0.0071 | 1202 | 4505.1 |
| unified remark+rehype render | tables-lists.md | 454 | 2000 | 0.1961 | 622 | 9090.3 |

## Averages

| Group | Name | Mean ms/op |
| :--- | :--- | ---: |
| markdown | @tanstack/markdown parse | 0.0146 |
| markdown | @tanstack/markdown render AST with external highlighter | 0.0042 |
| markdown | @tanstack/markdown render AST | 0.0029 |
| markdown | @tanstack/markdown parse+render with external highlighter | 0.0179 |
| markdown | @tanstack/markdown parse+render | 0.0164 |
| markdown | marked parse+render | 0.0176 |
| markdown | markdown-it parse+render | 0.0124 |
| markdown | micromark render | 0.1414 |
| markdown | commonmark parse+render | 0.0096 |
| markdown | markdown-wasm render | 0.0056 |
| markdown | unified remark+rehype render | 0.1502 |
