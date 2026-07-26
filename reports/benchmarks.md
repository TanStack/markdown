# Benchmark Results

Generated: 2026-07-26T03:30:51.330Z

Lower `ms/op` is better. Benchmarks run in Node with production package builds where available; heap delta is a coarse process-level signal, not an allocation profiler. Streaming rows replay the complete response in 32-character chunks, so one operation is one progressive response.

## Markdown

| Name | Fixture | Bytes | Iterations | ms/op | Output bytes | Heap delta KB |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: |
| @tanstack/markdown parse | ai-response.md | 652 | 2000 | 0.0189 | 15 | 1376.2 |
| @tanstack/markdown render AST with external highlighter | ai-response.md | 652 | 2000 | 0.0039 | 1399 | -2717.8 |
| @tanstack/markdown render AST | ai-response.md | 652 | 2000 | 0.0033 | 1143 | 722.9 |
| @tanstack/markdown parse+render with external highlighter | ai-response.md | 652 | 2000 | 0.0213 | 1399 | 1964.5 |
| @tanstack/markdown parse+render | ai-response.md | 652 | 2000 | 0.0201 | 1143 | 3244.9 |
| marked parse+render | ai-response.md | 652 | 2000 | 0.0244 | 1035 | -611.4 |
| markdown-it parse+render | ai-response.md | 652 | 2000 | 0.0165 | 1087 | -3661.9 |
| micromark render | ai-response.md | 652 | 2000 | 0.1390 | 825 | 9400.2 |
| commonmark parse+render | ai-response.md | 652 | 2000 | 0.0114 | 825 | 136.6 |
| markdown-wasm render | ai-response.md | 652 | 2000 | 0.0071 | 1117 | -11973.3 |
| unified remark+rehype render | ai-response.md | 652 | 2000 | 0.1576 | 824 | 30108.1 |
| @tanstack/markdown parse | code-heavy.md | 1011 | 1000 | 0.0062 | 15 | -3895.8 |
| @tanstack/markdown render AST with external highlighter | code-heavy.md | 1011 | 1000 | 0.0070 | 4504 | 2304.5 |
| @tanstack/markdown render AST | code-heavy.md | 1011 | 1000 | 0.0033 | 1835 | -18930.2 |
| @tanstack/markdown parse+render with external highlighter | code-heavy.md | 1011 | 1000 | 0.0132 | 4504 | -1353.3 |
| @tanstack/markdown parse+render | code-heavy.md | 1011 | 1000 | 0.0095 | 1835 | 9930.3 |
| marked parse+render | code-heavy.md | 1011 | 1000 | 0.0054 | 1330 | -19833.4 |
| markdown-it parse+render | code-heavy.md | 1011 | 1000 | 0.0076 | 1330 | 27308.1 |
| micromark render | code-heavy.md | 1011 | 1000 | 0.1222 | 1330 | -11584.4 |
| commonmark parse+render | code-heavy.md | 1011 | 1000 | 0.0085 | 1330 | 24578.4 |
| markdown-wasm render | code-heavy.md | 1011 | 1000 | 0.0041 | 1512 | 2558.8 |
| unified remark+rehype render | code-heavy.md | 1011 | 1000 | 0.1283 | 1200 | -6735.2 |
| @tanstack/markdown parse | malformed.md | 237 | 2000 | 0.0029 | 15 | 23936.5 |
| @tanstack/markdown render AST with external highlighter | malformed.md | 237 | 2000 | 0.0015 | 1067 | -15520.8 |
| @tanstack/markdown render AST | malformed.md | 237 | 2000 | 0.0007 | 361 | 6986.2 |
| @tanstack/markdown parse+render with external highlighter | malformed.md | 237 | 2000 | 0.0045 | 1067 | 8059.2 |
| @tanstack/markdown parse+render | malformed.md | 237 | 2000 | 0.0036 | 361 | -2208.1 |
| marked parse+render | malformed.md | 237 | 2000 | 0.0045 | 350 | -16761.9 |
| markdown-it parse+render | malformed.md | 237 | 2000 | 0.0041 | 300 | -7844.5 |
| micromark render | malformed.md | 237 | 2000 | 0.0427 | 300 | 7691.9 |
| commonmark parse+render | malformed.md | 237 | 2000 | 0.0032 | 300 | -9658.8 |
| markdown-wasm render | malformed.md | 237 | 2000 | 0.0017 | 408 | 2938.6 |
| unified remark+rehype render | malformed.md | 237 | 2000 | 0.0459 | 297 | 1749.3 |
| @tanstack/markdown parse | prose-heavy.md | 1700 | 1000 | 0.0217 | 15 | 1528.4 |
| @tanstack/markdown render AST with external highlighter | prose-heavy.md | 1700 | 1000 | 0.0019 | 1903 | 11772.6 |
| @tanstack/markdown render AST | prose-heavy.md | 1700 | 1000 | 0.0020 | 1903 | -20955.2 |
| @tanstack/markdown parse+render with external highlighter | prose-heavy.md | 1700 | 1000 | 0.0256 | 1903 | 14688.2 |
| @tanstack/markdown parse+render | prose-heavy.md | 1700 | 1000 | 0.0256 | 1903 | -18061.1 |
| marked parse+render | prose-heavy.md | 1700 | 1000 | 0.0313 | 1860 | 6664.6 |
| markdown-it parse+render | prose-heavy.md | 1700 | 1000 | 0.0162 | 1860 | 14340.5 |
| micromark render | prose-heavy.md | 1700 | 1000 | 0.2112 | 1862 | 5863.4 |
| commonmark parse+render | prose-heavy.md | 1700 | 1000 | 0.0109 | 1862 | -17640.3 |
| markdown-wasm render | prose-heavy.md | 1700 | 1000 | 0.0058 | 2340 | 3368.2 |
| unified remark+rehype render | prose-heavy.md | 1700 | 1000 | 0.2301 | 1859 | 51836.9 |
| @tanstack/markdown parse | small-doc.md | 432 | 2000 | 0.0095 | 15 | 24039.2 |
| @tanstack/markdown render AST with external highlighter | small-doc.md | 432 | 2000 | 0.0028 | 1328 | 31783.3 |
| @tanstack/markdown render AST | small-doc.md | 432 | 2000 | 0.0024 | 1002 | 26132.6 |
| @tanstack/markdown parse+render with external highlighter | small-doc.md | 432 | 2000 | 0.0130 | 1328 | -14446.8 |
| @tanstack/markdown parse+render | small-doc.md | 432 | 2000 | 0.0124 | 1002 | -20381.4 |
| marked parse+render | small-doc.md | 432 | 2000 | 0.0114 | 724 | -14855.6 |
| markdown-it parse+render | small-doc.md | 432 | 2000 | 0.0071 | 776 | 3163.8 |
| micromark render | small-doc.md | 432 | 2000 | 0.0869 | 535 | -20923.6 |
| commonmark parse+render | small-doc.md | 432 | 2000 | 0.0054 | 535 | 50226.2 |
| markdown-wasm render | small-doc.md | 432 | 2000 | 0.0031 | 854 | 3722.5 |
| unified remark+rehype render | small-doc.md | 432 | 2000 | 0.0995 | 534 | 3726.3 |
| @tanstack/markdown parse | tables-lists.md | 454 | 2000 | 0.0223 | 15 | 48781.5 |
| @tanstack/markdown render AST with external highlighter | tables-lists.md | 454 | 2000 | 0.0039 | 1315 | -17723.8 |
| @tanstack/markdown render AST | tables-lists.md | 454 | 2000 | 0.0037 | 1315 | -17690.0 |
| @tanstack/markdown parse+render with external highlighter | tables-lists.md | 454 | 2000 | 0.0263 | 1315 | 30714.6 |
| @tanstack/markdown parse+render | tables-lists.md | 454 | 2000 | 0.0278 | 1315 | -34604.4 |
| marked parse+render | tables-lists.md | 454 | 2000 | 0.0259 | 1102 | -14274.4 |
| markdown-it parse+render | tables-lists.md | 454 | 2000 | 0.0163 | 1325 | 26392.0 |
| micromark render | tables-lists.md | 454 | 2000 | 0.1473 | 627 | -38940.6 |
| commonmark parse+render | tables-lists.md | 454 | 2000 | 0.0103 | 627 | 28388.4 |
| markdown-wasm render | tables-lists.md | 454 | 2000 | 0.0053 | 1202 | 4505.4 |
| unified remark+rehype render | tables-lists.md | 454 | 2000 | 0.1730 | 622 | 7657.6 |

## Streaming

| Name | Fixture | Bytes | Iterations | ms/op | Output bytes | Heap delta KB |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: |
| @tanstack/markdown streaming profile | ai-response.md | 652 | 250 | 0.2345 | 1112 | -23405.7 |
| marked progressive parse+render | ai-response.md | 652 | 250 | 0.2556 | 1035 | 3231.5 |

## Averages

| Group | Name | Mean ms/op |
| :--- | :--- | ---: |
| markdown | @tanstack/markdown parse | 0.0136 |
| markdown | @tanstack/markdown render AST with external highlighter | 0.0035 |
| markdown | @tanstack/markdown render AST | 0.0026 |
| markdown | @tanstack/markdown parse+render with external highlighter | 0.0173 |
| markdown | @tanstack/markdown parse+render | 0.0165 |
| markdown | marked parse+render | 0.0172 |
| markdown | markdown-it parse+render | 0.0113 |
| markdown | micromark render | 0.1249 |
| markdown | commonmark parse+render | 0.0083 |
| markdown | markdown-wasm render | 0.0045 |
| markdown | unified remark+rehype render | 0.1391 |
| streaming | @tanstack/markdown streaming profile | 0.2345 |
| streaming | marked progressive parse+render | 0.2556 |
