# Benchmark Results

Generated: 2026-09-11T18:44:31.009Z

Lower `ms/op` is better. Benchmarks run in Node with production package builds where available; heap delta is a coarse process-level signal, not an allocation profiler. Streaming rows replay the complete response in 32-character chunks, so one operation is one progressive response.

## Markdown

| Name | Fixture | Bytes | Iterations | ms/op | Output bytes | Heap delta KB |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: |
| @tanstack/markdown parse | ai-response.md | 652 | 2000 | 0.0163 | 15 | 315.3 |
| @tanstack/markdown render AST with external highlighter | ai-response.md | 652 | 2000 | 0.0041 | 1399 | 4611.7 |
| @tanstack/markdown render AST | ai-response.md | 652 | 2000 | 0.0033 | 1143 | 24.0 |
| @tanstack/markdown parse+render with external highlighter | ai-response.md | 652 | 2000 | 0.0201 | 1399 | 545.8 |
| @tanstack/markdown parse+render | ai-response.md | 652 | 2000 | 0.0186 | 1143 | 1627.0 |
| marked parse+render | ai-response.md | 652 | 2000 | 0.0259 | 1035 | -584.2 |
| markdown-it parse+render | ai-response.md | 652 | 2000 | 0.0171 | 1087 | -3580.1 |
| micromark render | ai-response.md | 652 | 2000 | 0.1466 | 825 | 6402.0 |
| commonmark parse+render | ai-response.md | 652 | 2000 | 0.0119 | 825 | 155.7 |
| markdown-wasm render | ai-response.md | 652 | 2000 | 0.0075 | 1117 | 4372.8 |
| unified remark+rehype render | ai-response.md | 652 | 2000 | 0.1697 | 824 | 14038.6 |
| @tanstack/markdown parse | code-heavy.md | 1011 | 1000 | 0.0064 | 15 | -6268.1 |
| @tanstack/markdown render AST with external highlighter | code-heavy.md | 1011 | 1000 | 0.0071 | 4504 | 347.4 |
| @tanstack/markdown render AST | code-heavy.md | 1011 | 1000 | 0.0034 | 1835 | 12183.9 |
| @tanstack/markdown parse+render with external highlighter | code-heavy.md | 1011 | 1000 | 0.0139 | 4504 | -5203.2 |
| @tanstack/markdown parse+render | code-heavy.md | 1011 | 1000 | 0.0109 | 1835 | -26450.2 |
| marked parse+render | code-heavy.md | 1011 | 1000 | 0.0059 | 1330 | 12896.3 |
| markdown-it parse+render | code-heavy.md | 1011 | 1000 | 0.0088 | 1330 | -5356.3 |
| micromark render | code-heavy.md | 1011 | 1000 | 0.1408 | 1330 | -11812.2 |
| commonmark parse+render | code-heavy.md | 1011 | 1000 | 0.0094 | 1330 | -8107.4 |
| markdown-wasm render | code-heavy.md | 1011 | 1000 | 0.0043 | 1512 | 2558.4 |
| unified remark+rehype render | code-heavy.md | 1011 | 1000 | 0.1487 | 1200 | -6915.0 |
| @tanstack/markdown parse | malformed.md | 237 | 2000 | 0.0023 | 15 | 18583.8 |
| @tanstack/markdown render AST with external highlighter | malformed.md | 237 | 2000 | 0.0018 | 1067 | -16217.9 |
| @tanstack/markdown render AST | malformed.md | 237 | 2000 | 0.0007 | 361 | 6298.9 |
| @tanstack/markdown parse+render with external highlighter | malformed.md | 237 | 2000 | 0.0042 | 1067 | 2330.6 |
| @tanstack/markdown parse+render | malformed.md | 237 | 2000 | 0.0031 | 361 | -7910.2 |
| marked parse+render | malformed.md | 237 | 2000 | 0.0050 | 350 | -16034.5 |
| markdown-it parse+render | malformed.md | 237 | 2000 | 0.0041 | 300 | 24762.2 |
| micromark render | malformed.md | 237 | 2000 | 0.0455 | 300 | -24868.7 |
| commonmark parse+render | malformed.md | 237 | 2000 | 0.0034 | 300 | 23073.3 |
| markdown-wasm render | malformed.md | 237 | 2000 | 0.0018 | 408 | 2938.8 |
| unified remark+rehype render | malformed.md | 237 | 2000 | 0.0494 | 297 | 1974.7 |
| @tanstack/markdown parse | prose-heavy.md | 1700 | 1000 | 0.0131 | 15 | 15263.7 |
| @tanstack/markdown render AST with external highlighter | prose-heavy.md | 1700 | 1000 | 0.0022 | 1903 | -20948.9 |
| @tanstack/markdown render AST | prose-heavy.md | 1700 | 1000 | 0.0022 | 1903 | 11793.5 |
| @tanstack/markdown parse+render with external highlighter | prose-heavy.md | 1700 | 1000 | 0.0161 | 1903 | -5901.6 |
| @tanstack/markdown parse+render | prose-heavy.md | 1700 | 1000 | 0.0159 | 1903 | -5896.0 |
| marked parse+render | prose-heavy.md | 1700 | 1000 | 0.0354 | 1860 | 6719.4 |
| markdown-it parse+render | prose-heavy.md | 1700 | 1000 | 0.0171 | 1860 | 14302.9 |
| micromark render | prose-heavy.md | 1700 | 1000 | 0.2280 | 1862 | 84947.0 |
| commonmark parse+render | prose-heavy.md | 1700 | 1000 | 0.0122 | 1862 | -13384.6 |
| markdown-wasm render | prose-heavy.md | 1700 | 1000 | 0.0061 | 2340 | 3368.2 |
| unified remark+rehype render | prose-heavy.md | 1700 | 1000 | 0.2498 | 1859 | 50851.1 |
| @tanstack/markdown parse | small-doc.md | 432 | 2000 | 0.0089 | 15 | 7608.5 |
| @tanstack/markdown render AST with external highlighter | small-doc.md | 432 | 2000 | 0.0030 | 1328 | 30267.3 |
| @tanstack/markdown render AST | small-doc.md | 432 | 2000 | 0.0026 | 1002 | -39909.2 |
| @tanstack/markdown parse+render with external highlighter | small-doc.md | 432 | 2000 | 0.0121 | 1328 | 33858.0 |
| @tanstack/markdown parse+render | small-doc.md | 432 | 2000 | 0.0118 | 1002 | -37329.9 |
| marked parse+render | small-doc.md | 432 | 2000 | 0.0121 | 724 | -14790.5 |
| markdown-it parse+render | small-doc.md | 432 | 2000 | 0.0075 | 776 | 3163.1 |
| micromark render | small-doc.md | 432 | 2000 | 0.0964 | 535 | 45302.1 |
| commonmark parse+render | small-doc.md | 432 | 2000 | 0.0065 | 535 | -15211.3 |
| markdown-wasm render | small-doc.md | 432 | 2000 | 0.0033 | 854 | 3642.8 |
| unified remark+rehype render | small-doc.md | 432 | 2000 | 0.1119 | 534 | -61627.6 |
| @tanstack/markdown parse | tables-lists.md | 454 | 2000 | 0.0224 | 15 | 21773.1 |
| @tanstack/markdown render AST with external highlighter | tables-lists.md | 454 | 2000 | 0.0043 | 1315 | -18808.4 |
| @tanstack/markdown render AST | tables-lists.md | 454 | 2000 | 0.0038 | 1315 | 46672.4 |
| @tanstack/markdown parse+render with external highlighter | tables-lists.md | 454 | 2000 | 0.0266 | 1315 | 2395.1 |
| @tanstack/markdown parse+render | tables-lists.md | 454 | 2000 | 0.0264 | 1315 | 2248.8 |
| marked parse+render | tables-lists.md | 454 | 2000 | 0.0278 | 1102 | -14314.8 |
| markdown-it parse+render | tables-lists.md | 454 | 2000 | 0.0178 | 1325 | -39188.7 |
| micromark render | tables-lists.md | 454 | 2000 | 0.1602 | 627 | 26000.9 |
| commonmark parse+render | tables-lists.md | 454 | 2000 | 0.0111 | 627 | -37171.3 |
| markdown-wasm render | tables-lists.md | 454 | 2000 | 0.0055 | 1202 | 4506.0 |
| unified remark+rehype render | tables-lists.md | 454 | 2000 | 0.1868 | 622 | 7536.4 |

## Streaming

| Name | Fixture | Bytes | Iterations | ms/op | Output bytes | Heap delta KB |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: |
| @tanstack/markdown streaming profile | ai-response.md | 652 | 250 | 0.2125 | 1112 | 62452.2 |
| marked progressive parse+render | ai-response.md | 652 | 250 | 0.2893 | 1035 | 3190.0 |

## Averages

| Group | Name | Mean ms/op |
| :--- | :--- | ---: |
| markdown | @tanstack/markdown parse | 0.0116 |
| markdown | @tanstack/markdown render AST with external highlighter | 0.0037 |
| markdown | @tanstack/markdown render AST | 0.0027 |
| markdown | @tanstack/markdown parse+render with external highlighter | 0.0155 |
| markdown | @tanstack/markdown parse+render | 0.0145 |
| markdown | marked parse+render | 0.0187 |
| markdown | markdown-it parse+render | 0.0121 |
| markdown | micromark render | 0.1363 |
| markdown | commonmark parse+render | 0.0091 |
| markdown | markdown-wasm render | 0.0048 |
| markdown | unified remark+rehype render | 0.1527 |
| streaming | @tanstack/markdown streaming profile | 0.2125 |
| streaming | marked progressive parse+render | 0.2893 |
