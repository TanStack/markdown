# Benchmark Results

Generated: 2026-07-23T22:04:30.698Z

Lower `ms/op` is better. Benchmarks run in Node with production package builds where available; heap delta is a coarse process-level signal, not an allocation profiler. Streaming rows replay the complete response in 32-character chunks, so one operation is one progressive response.

## Markdown

| Name | Fixture | Bytes | Iterations | ms/op | Output bytes | Heap delta KB |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: |
| @tanstack/markdown parse | ai-response.md | 652 | 2000 | 0.0202 | 15 | 1651.7 |
| @tanstack/markdown render AST with external highlighter | ai-response.md | 652 | 2000 | 0.0043 | 1399 | -2358.5 |
| @tanstack/markdown render AST | ai-response.md | 652 | 2000 | 0.0036 | 1143 | 767.1 |
| @tanstack/markdown parse+render with external highlighter | ai-response.md | 652 | 2000 | 0.0235 | 1399 | 2092.4 |
| @tanstack/markdown parse+render | ai-response.md | 652 | 2000 | 0.0222 | 1143 | 3127.5 |
| marked parse+render | ai-response.md | 652 | 2000 | 0.0262 | 1035 | -467.9 |
| markdown-it parse+render | ai-response.md | 652 | 2000 | 0.0169 | 1087 | -3715.1 |
| micromark render | ai-response.md | 652 | 2000 | 0.1508 | 825 | 8848.6 |
| commonmark parse+render | ai-response.md | 652 | 2000 | 0.0123 | 825 | 114.8 |
| markdown-wasm render | ai-response.md | 652 | 2000 | 0.0078 | 1117 | -11978.6 |
| unified remark+rehype render | ai-response.md | 652 | 2000 | 0.1835 | 824 | -1359.7 |
| @tanstack/markdown parse | code-heavy.md | 1011 | 1000 | 0.0065 | 15 | 28647.6 |
| @tanstack/markdown render AST with external highlighter | code-heavy.md | 1011 | 1000 | 0.0075 | 4504 | -30785.3 |
| @tanstack/markdown render AST | code-heavy.md | 1011 | 1000 | 0.0035 | 1835 | 13767.0 |
| @tanstack/markdown parse+render with external highlighter | code-heavy.md | 1011 | 1000 | 0.0152 | 4504 | -1346.5 |
| @tanstack/markdown parse+render | code-heavy.md | 1011 | 1000 | 0.0105 | 1835 | 9661.7 |
| marked parse+render | code-heavy.md | 1011 | 1000 | 0.0060 | 1330 | -19739.2 |
| markdown-it parse+render | code-heavy.md | 1011 | 1000 | 0.0084 | 1330 | -5350.5 |
| micromark render | code-heavy.md | 1011 | 1000 | 0.1340 | 1330 | -11684.1 |
| commonmark parse+render | code-heavy.md | 1011 | 1000 | 0.0091 | 1330 | 24577.8 |
| markdown-wasm render | code-heavy.md | 1011 | 1000 | 0.0044 | 1512 | 2558.5 |
| unified remark+rehype render | code-heavy.md | 1011 | 1000 | 0.1471 | 1200 | -7131.9 |
| @tanstack/markdown parse | malformed.md | 237 | 2000 | 0.0033 | 15 | 24361.8 |
| @tanstack/markdown render AST with external highlighter | malformed.md | 237 | 2000 | 0.0019 | 1067 | -15518.3 |
| @tanstack/markdown render AST | malformed.md | 237 | 2000 | 0.0009 | 361 | 6923.7 |
| @tanstack/markdown parse+render with external highlighter | malformed.md | 237 | 2000 | 0.0053 | 1067 | 8027.3 |
| @tanstack/markdown parse+render | malformed.md | 237 | 2000 | 0.0044 | 361 | -2179.1 |
| marked parse+render | malformed.md | 237 | 2000 | 0.0051 | 350 | -15987.4 |
| markdown-it parse+render | malformed.md | 237 | 2000 | 0.0043 | 300 | -7889.1 |
| micromark render | malformed.md | 237 | 2000 | 0.0484 | 300 | 7823.3 |
| commonmark parse+render | malformed.md | 237 | 2000 | 0.0036 | 300 | -9657.7 |
| markdown-wasm render | malformed.md | 237 | 2000 | 0.0018 | 408 | 2938.7 |
| unified remark+rehype render | malformed.md | 237 | 2000 | 0.0520 | 297 | 2198.7 |
| @tanstack/markdown parse | prose-heavy.md | 1700 | 1000 | 0.0247 | 15 | 1524.2 |
| @tanstack/markdown render AST with external highlighter | prose-heavy.md | 1700 | 1000 | 0.0023 | 1903 | 11786.2 |
| @tanstack/markdown render AST | prose-heavy.md | 1700 | 1000 | 0.0024 | 1903 | -20926.4 |
| @tanstack/markdown parse+render with external highlighter | prose-heavy.md | 1700 | 1000 | 0.0287 | 1903 | 15101.4 |
| @tanstack/markdown parse+render | prose-heavy.md | 1700 | 1000 | 0.0289 | 1903 | -17679.6 |
| marked parse+render | prose-heavy.md | 1700 | 1000 | 0.0356 | 1860 | 6714.2 |
| markdown-it parse+render | prose-heavy.md | 1700 | 1000 | 0.0170 | 1860 | -18454.5 |
| micromark render | prose-heavy.md | 1700 | 1000 | 0.2434 | 1862 | 36817.5 |
| commonmark parse+render | prose-heavy.md | 1700 | 1000 | 0.0130 | 1862 | -16195.6 |
| markdown-wasm render | prose-heavy.md | 1700 | 1000 | 0.0065 | 2340 | 3369.8 |
| unified remark+rehype render | prose-heavy.md | 1700 | 1000 | 0.2640 | 1859 | -9381.3 |
| @tanstack/markdown parse | small-doc.md | 432 | 2000 | 0.0115 | 15 | 22706.2 |
| @tanstack/markdown render AST with external highlighter | small-doc.md | 432 | 2000 | 0.0042 | 1328 | 31671.1 |
| @tanstack/markdown render AST | small-doc.md | 432 | 2000 | 0.0031 | 1002 | -39114.4 |
| @tanstack/markdown parse+render with external highlighter | small-doc.md | 432 | 2000 | 0.0155 | 1328 | -14484.3 |
| @tanstack/markdown parse+render | small-doc.md | 432 | 2000 | 0.0151 | 1002 | 44889.2 |
| marked parse+render | small-doc.md | 432 | 2000 | 0.0134 | 724 | -14855.8 |
| markdown-it parse+render | small-doc.md | 432 | 2000 | 0.0100 | 776 | 3151.8 |
| micromark render | small-doc.md | 432 | 2000 | 0.1060 | 535 | -20894.3 |
| commonmark parse+render | small-doc.md | 432 | 2000 | 0.0061 | 535 | -15135.8 |
| markdown-wasm render | small-doc.md | 432 | 2000 | 0.0034 | 854 | 3619.6 |
| unified remark+rehype render | small-doc.md | 432 | 2000 | 0.1119 | 534 | 3891.2 |
| @tanstack/markdown parse | tables-lists.md | 454 | 2000 | 0.0251 | 15 | -16620.2 |
| @tanstack/markdown render AST with external highlighter | tables-lists.md | 454 | 2000 | 0.0043 | 1315 | -17646.4 |
| @tanstack/markdown render AST | tables-lists.md | 454 | 2000 | 0.0040 | 1315 | 47794.4 |
| @tanstack/markdown parse+render with external highlighter | tables-lists.md | 454 | 2000 | 0.0299 | 1315 | -34785.5 |
| @tanstack/markdown parse+render | tables-lists.md | 454 | 2000 | 0.0288 | 1315 | 30924.1 |
| marked parse+render | tables-lists.md | 454 | 2000 | 0.0280 | 1102 | -14243.8 |
| markdown-it parse+render | tables-lists.md | 454 | 2000 | 0.0181 | 1325 | -39103.1 |
| micromark render | tables-lists.md | 454 | 2000 | 0.1647 | 627 | 26083.1 |
| commonmark parse+render | tables-lists.md | 454 | 2000 | 0.0114 | 627 | -37034.4 |
| markdown-wasm render | tables-lists.md | 454 | 2000 | 0.0058 | 1202 | 4505.3 |
| unified remark+rehype render | tables-lists.md | 454 | 2000 | 0.1950 | 622 | 7804.8 |

## Streaming

| Name | Fixture | Bytes | Iterations | ms/op | Output bytes | Heap delta KB |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: |
| @tanstack/markdown streaming profile | ai-response.md | 652 | 250 | 0.2652 | 1112 | -22832.9 |
| marked progressive parse+render | ai-response.md | 652 | 250 | 0.2895 | 1035 | 3180.8 |

## Averages

| Group | Name | Mean ms/op |
| :--- | :--- | ---: |
| markdown | @tanstack/markdown parse | 0.0152 |
| markdown | @tanstack/markdown render AST with external highlighter | 0.0041 |
| markdown | @tanstack/markdown render AST | 0.0029 |
| markdown | @tanstack/markdown parse+render with external highlighter | 0.0197 |
| markdown | @tanstack/markdown parse+render | 0.0183 |
| markdown | marked parse+render | 0.0190 |
| markdown | markdown-it parse+render | 0.0125 |
| markdown | micromark render | 0.1412 |
| markdown | commonmark parse+render | 0.0092 |
| markdown | markdown-wasm render | 0.0049 |
| markdown | unified remark+rehype render | 0.1589 |
| streaming | @tanstack/markdown streaming profile | 0.2652 |
| streaming | marked progressive parse+render | 0.2895 |
