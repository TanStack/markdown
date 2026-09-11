# Benchmark Results

Generated: 2026-09-11T20:23:30.359Z

Lower `ms/op` is better. Benchmarks run in Node with production package builds where available; heap delta is a coarse process-level signal, not an allocation profiler. Streaming rows replay the complete response in 32-character chunks, so one operation is one progressive response.

## Markdown

| Name | Fixture | Bytes | Iterations | ms/op | Output bytes | Heap delta KB |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: |
| @tanstack/markdown parse | ai-response.md | 652 | 2000 | 0.0184 | 15 | 899.0 |
| @tanstack/markdown render AST with external highlighter | ai-response.md | 652 | 2000 | 0.0053 | 1399 | 1238.7 |
| @tanstack/markdown render AST | ai-response.md | 652 | 2000 | 0.0040 | 1143 | -3027.4 |
| @tanstack/markdown parse+render with external highlighter | ai-response.md | 652 | 2000 | 0.0238 | 1399 | -2596.2 |
| @tanstack/markdown parse+render | ai-response.md | 652 | 2000 | 0.0236 | 1143 | -1860.6 |
| marked parse+render | ai-response.md | 652 | 2000 | 0.0295 | 1035 | -853.6 |
| markdown-it parse+render | ai-response.md | 652 | 2000 | 0.0193 | 1087 | 4088.9 |
| micromark render | ai-response.md | 652 | 2000 | 0.1731 | 825 | -8298.2 |
| commonmark parse+render | ai-response.md | 652 | 2000 | 0.0213 | 825 | 54.9 |
| markdown-wasm render | ai-response.md | 652 | 2000 | 0.0105 | 1117 | 4372.4 |
| unified remark+rehype render | ai-response.md | 652 | 2000 | 0.1991 | 824 | 13756.0 |
| @tanstack/markdown parse | code-heavy.md | 1011 | 1000 | 0.0068 | 15 | -6378.1 |
| @tanstack/markdown render AST with external highlighter | code-heavy.md | 1011 | 1000 | 0.0075 | 4596 | -1122.6 |
| @tanstack/markdown render AST | code-heavy.md | 1011 | 1000 | 0.0032 | 1927 | 10476.3 |
| @tanstack/markdown parse+render with external highlighter | code-heavy.md | 1011 | 1000 | 0.0142 | 4596 | -6339.7 |
| @tanstack/markdown parse+render | code-heavy.md | 1011 | 1000 | 0.0099 | 1927 | 4603.2 |
| marked parse+render | code-heavy.md | 1011 | 1000 | 0.0062 | 1330 | -19757.1 |
| markdown-it parse+render | code-heavy.md | 1011 | 1000 | 0.0083 | 1330 | -5321.0 |
| micromark render | code-heavy.md | 1011 | 1000 | 0.1368 | 1330 | -11833.3 |
| commonmark parse+render | code-heavy.md | 1011 | 1000 | 0.0092 | 1330 | 24577.0 |
| markdown-wasm render | code-heavy.md | 1011 | 1000 | 0.0043 | 1512 | 2560.0 |
| unified remark+rehype render | code-heavy.md | 1011 | 1000 | 0.1521 | 1200 | -7038.0 |
| @tanstack/markdown parse | malformed.md | 237 | 2000 | 0.0027 | 15 | 18580.6 |
| @tanstack/markdown render AST with external highlighter | malformed.md | 237 | 2000 | 0.0017 | 1067 | -17067.3 |
| @tanstack/markdown render AST | malformed.md | 237 | 2000 | 0.0007 | 361 | 5314.9 |
| @tanstack/markdown parse+render with external highlighter | malformed.md | 237 | 2000 | 0.0046 | 1067 | 1452.2 |
| @tanstack/markdown parse+render | malformed.md | 237 | 2000 | 0.0036 | 361 | -8892.2 |
| marked parse+render | malformed.md | 237 | 2000 | 0.0055 | 350 | 16140.5 |
| markdown-it parse+render | malformed.md | 237 | 2000 | 0.0051 | 300 | -7253.6 |
| micromark render | malformed.md | 237 | 2000 | 0.0521 | 300 | 7694.5 |
| commonmark parse+render | malformed.md | 237 | 2000 | 0.0039 | 300 | -9655.9 |
| markdown-wasm render | malformed.md | 237 | 2000 | 0.0019 | 408 | 2938.4 |
| unified remark+rehype render | malformed.md | 237 | 2000 | 0.0692 | 297 | 2219.2 |
| @tanstack/markdown parse | prose-heavy.md | 1700 | 1000 | 0.0172 | 15 | -17554.1 |
| @tanstack/markdown render AST with external highlighter | prose-heavy.md | 1700 | 1000 | 0.0027 | 1903 | 10296.0 |
| @tanstack/markdown render AST | prose-heavy.md | 1700 | 1000 | 0.0027 | 1903 | 10321.3 |
| @tanstack/markdown parse+render with external highlighter | prose-heavy.md | 1700 | 1000 | 0.0177 | 1903 | -7355.0 |
| @tanstack/markdown parse+render | prose-heavy.md | 1700 | 1000 | 0.0166 | 1903 | -7244.9 |
| marked parse+render | prose-heavy.md | 1700 | 1000 | 0.0345 | 1860 | 6729.9 |
| markdown-it parse+render | prose-heavy.md | 1700 | 1000 | 0.0189 | 1860 | -18343.2 |
| micromark render | prose-heavy.md | 1700 | 1000 | 0.2429 | 1862 | 24865.8 |
| commonmark parse+render | prose-heavy.md | 1700 | 1000 | 0.0119 | 1862 | 46458.7 |
| markdown-wasm render | prose-heavy.md | 1700 | 1000 | 0.0063 | 2340 | 3368.4 |
| unified remark+rehype render | prose-heavy.md | 1700 | 1000 | 0.2897 | 1859 | 50897.1 |
| @tanstack/markdown parse | small-doc.md | 432 | 2000 | 0.0094 | 15 | 7577.4 |
| @tanstack/markdown render AST with external highlighter | small-doc.md | 432 | 2000 | 0.0031 | 1370 | 27814.1 |
| @tanstack/markdown render AST | small-doc.md | 432 | 2000 | 0.0027 | 1044 | -42766.9 |
| @tanstack/markdown parse+render with external highlighter | small-doc.md | 432 | 2000 | 0.0126 | 1370 | 31414.9 |
| @tanstack/markdown parse+render | small-doc.md | 432 | 2000 | 0.0121 | 1044 | -40133.3 |
| marked parse+render | small-doc.md | 432 | 2000 | 0.0121 | 724 | 50632.2 |
| markdown-it parse+render | small-doc.md | 432 | 2000 | 0.0078 | 776 | 3160.2 |
| micromark render | small-doc.md | 432 | 2000 | 0.0974 | 535 | 44970.4 |
| commonmark parse+render | small-doc.md | 432 | 2000 | 0.0071 | 535 | -15145.2 |
| markdown-wasm render | small-doc.md | 432 | 2000 | 0.0039 | 854 | 3580.2 |
| unified remark+rehype render | small-doc.md | 432 | 2000 | 0.1293 | 534 | 4179.8 |
| @tanstack/markdown parse | tables-lists.md | 454 | 2000 | 0.0232 | 15 | -43744.4 |
| @tanstack/markdown render AST with external highlighter | tables-lists.md | 454 | 2000 | 0.0044 | 1315 | 42278.0 |
| @tanstack/markdown render AST | tables-lists.md | 454 | 2000 | 0.0040 | 1315 | -23161.2 |
| @tanstack/markdown parse+render with external highlighter | tables-lists.md | 454 | 2000 | 0.0274 | 1315 | -1853.1 |
| @tanstack/markdown parse+render | tables-lists.md | 454 | 2000 | 0.0272 | 1315 | -2112.7 |
| marked parse+render | tables-lists.md | 454 | 2000 | 0.0292 | 1102 | -14329.2 |
| markdown-it parse+render | tables-lists.md | 454 | 2000 | 0.0180 | 1325 | 26395.5 |
| micromark render | tables-lists.md | 454 | 2000 | 0.1677 | 627 | -39153.3 |
| commonmark parse+render | tables-lists.md | 454 | 2000 | 0.0114 | 627 | 28363.8 |
| markdown-wasm render | tables-lists.md | 454 | 2000 | 0.0059 | 1202 | 4506.2 |
| unified remark+rehype render | tables-lists.md | 454 | 2000 | 0.1964 | 622 | 7601.9 |

## Streaming

| Name | Fixture | Bytes | Iterations | ms/op | Output bytes | Heap delta KB |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: |
| @tanstack/markdown streaming profile | ai-response.md | 652 | 250 | 0.2236 | 1112 | -8191.5 |
| marked progressive parse+render | ai-response.md | 652 | 250 | 0.2804 | 1035 | 3232.0 |

## Averages

| Group | Name | Mean ms/op |
| :--- | :--- | ---: |
| markdown | @tanstack/markdown parse | 0.0129 |
| markdown | @tanstack/markdown render AST with external highlighter | 0.0041 |
| markdown | @tanstack/markdown render AST | 0.0029 |
| markdown | @tanstack/markdown parse+render with external highlighter | 0.0167 |
| markdown | @tanstack/markdown parse+render | 0.0155 |
| markdown | marked parse+render | 0.0195 |
| markdown | markdown-it parse+render | 0.0129 |
| markdown | micromark render | 0.1450 |
| markdown | commonmark parse+render | 0.0108 |
| markdown | markdown-wasm render | 0.0055 |
| markdown | unified remark+rehype render | 0.1726 |
| streaming | @tanstack/markdown streaming profile | 0.2236 |
| streaming | marked progressive parse+render | 0.2804 |
