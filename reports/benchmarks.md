# Benchmark Results

Generated: 2026-09-12T16:34:43.747Z

Lower `ms/op` is better. Benchmarks run in Node with production package builds where available; heap delta is a coarse process-level signal, not an allocation profiler. Streaming rows replay the complete response in 32-character chunks, so one operation is one progressive response.

## Markdown

| Name | Fixture | Bytes | Iterations | ms/op | Output bytes | Heap delta KB |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: |
| @tanstack/markdown parse | ai-response.md | 652 | 2000 | 0.0220 | 15 | 977.6 |
| @tanstack/markdown render AST with external highlighter | ai-response.md | 652 | 2000 | 0.0046 | 1399 | 2604.7 |
| @tanstack/markdown render AST | ai-response.md | 652 | 2000 | 0.0040 | 1143 | -1731.7 |
| @tanstack/markdown parse+render with external highlighter | ai-response.md | 652 | 2000 | 0.0243 | 1399 | -3691.8 |
| @tanstack/markdown parse+render | ai-response.md | 652 | 2000 | 0.0225 | 1143 | 1486.6 |
| marked parse+render | ai-response.md | 652 | 2000 | 0.0286 | 1035 | 711.0 |
| markdown-it parse+render | ai-response.md | 652 | 2000 | 0.0177 | 1087 | -4008.6 |
| micromark render | ai-response.md | 652 | 2000 | 0.1764 | 825 | 8798.0 |
| commonmark parse+render | ai-response.md | 652 | 2000 | 0.0135 | 825 | 409.8 |
| markdown-wasm render | ai-response.md | 652 | 2000 | 0.0077 | 1117 | 4377.7 |
| unified remark+rehype render | ai-response.md | 652 | 2000 | 0.2242 | 824 | 9968.0 |
| @tanstack/markdown parse | code-heavy.md | 1011 | 1000 | 0.0084 | 15 | -5036.9 |
| @tanstack/markdown render AST with external highlighter | code-heavy.md | 1011 | 1000 | 0.0085 | 4596 | -772.2 |
| @tanstack/markdown render AST | code-heavy.md | 1011 | 1000 | 0.0034 | 1927 | 10347.9 |
| @tanstack/markdown parse+render with external highlighter | code-heavy.md | 1011 | 1000 | 0.0152 | 4596 | -7885.1 |
| @tanstack/markdown parse+render | code-heavy.md | 1011 | 1000 | 0.0103 | 1927 | 3101.1 |
| marked parse+render | code-heavy.md | 1011 | 1000 | 0.0072 | 1330 | -19906.7 |
| markdown-it parse+render | code-heavy.md | 1011 | 1000 | 0.0090 | 1330 | -5375.3 |
| micromark render | code-heavy.md | 1011 | 1000 | 0.1617 | 1330 | -11468.0 |
| commonmark parse+render | code-heavy.md | 1011 | 1000 | 0.0097 | 1330 | 24610.8 |
| markdown-wasm render | code-heavy.md | 1011 | 1000 | 0.0044 | 1512 | 2559.9 |
| unified remark+rehype render | code-heavy.md | 1011 | 1000 | 0.1708 | 1200 | -6404.0 |
| @tanstack/markdown parse | malformed.md | 237 | 2000 | 0.0032 | 15 | 20140.4 |
| @tanstack/markdown render AST with external highlighter | malformed.md | 237 | 2000 | 0.0019 | 1067 | -17021.6 |
| @tanstack/markdown render AST | malformed.md | 237 | 2000 | 0.0009 | 361 | 5298.2 |
| @tanstack/markdown parse+render with external highlighter | malformed.md | 237 | 2000 | 0.0048 | 1067 | 2224.4 |
| @tanstack/markdown parse+render | malformed.md | 237 | 2000 | 0.0039 | 361 | -8430.8 |
| marked parse+render | malformed.md | 237 | 2000 | 0.0059 | 350 | 16325.5 |
| markdown-it parse+render | malformed.md | 237 | 2000 | 0.0051 | 300 | -7808.4 |
| micromark render | malformed.md | 237 | 2000 | 0.0553 | 300 | 7211.2 |
| commonmark parse+render | malformed.md | 237 | 2000 | 0.0042 | 300 | -9635.3 |
| markdown-wasm render | malformed.md | 237 | 2000 | 0.0022 | 408 | 2951.2 |
| unified remark+rehype render | malformed.md | 237 | 2000 | 0.0612 | 297 | 1570.1 |
| @tanstack/markdown parse | prose-heavy.md | 1700 | 1000 | 0.0195 | 15 | -15331.2 |
| @tanstack/markdown render AST with external highlighter | prose-heavy.md | 1700 | 1000 | 0.0023 | 1903 | 10463.9 |
| @tanstack/markdown render AST | prose-heavy.md | 1700 | 1000 | 0.0024 | 1903 | -22236.1 |
| @tanstack/markdown parse+render with external highlighter | prose-heavy.md | 1700 | 1000 | 0.0212 | 1903 | 26786.3 |
| @tanstack/markdown parse+render | prose-heavy.md | 1700 | 1000 | 0.0210 | 1903 | -6000.0 |
| marked parse+render | prose-heavy.md | 1700 | 1000 | 0.0364 | 1860 | -25857.7 |
| markdown-it parse+render | prose-heavy.md | 1700 | 1000 | 0.0173 | 1860 | 14485.0 |
| micromark render | prose-heavy.md | 1700 | 1000 | 0.2602 | 1862 | 6955.8 |
| commonmark parse+render | prose-heavy.md | 1700 | 1000 | 0.0137 | 1862 | 15720.6 |
| markdown-wasm render | prose-heavy.md | 1700 | 1000 | 0.0061 | 2340 | 3368.6 |
| unified remark+rehype render | prose-heavy.md | 1700 | 1000 | 0.2978 | 1859 | 51638.1 |
| @tanstack/markdown parse | small-doc.md | 432 | 2000 | 0.0123 | 15 | 9680.7 |
| @tanstack/markdown render AST with external highlighter | small-doc.md | 432 | 2000 | 0.0040 | 1370 | -4751.9 |
| @tanstack/markdown render AST | small-doc.md | 432 | 2000 | 0.0029 | 1044 | -10698.0 |
| @tanstack/markdown parse+render with external highlighter | small-doc.md | 432 | 2000 | 0.0153 | 1370 | 142.6 |
| @tanstack/markdown parse+render | small-doc.md | 432 | 2000 | 0.0144 | 1044 | -5808.3 |
| marked parse+render | small-doc.md | 432 | 2000 | 0.0145 | 724 | 17843.9 |
| markdown-it parse+render | small-doc.md | 432 | 2000 | 0.0086 | 776 | -29483.0 |
| micromark render | small-doc.md | 432 | 2000 | 0.1131 | 535 | 9311.4 |
| commonmark parse+render | small-doc.md | 432 | 2000 | 0.0071 | 535 | -15395.9 |
| markdown-wasm render | small-doc.md | 432 | 2000 | 0.0036 | 854 | 3820.0 |
| unified remark+rehype render | small-doc.md | 432 | 2000 | 0.1372 | 534 | 2127.0 |
| @tanstack/markdown parse | tables-lists.md | 454 | 2000 | 0.0306 | 15 | -1160.3 |
| @tanstack/markdown render AST with external highlighter | tables-lists.md | 454 | 2000 | 0.0049 | 1315 | 10472.2 |
| @tanstack/markdown render AST | tables-lists.md | 454 | 2000 | 0.0046 | 1315 | -22139.2 |
| @tanstack/markdown parse+render with external highlighter | tables-lists.md | 454 | 2000 | 0.0342 | 1315 | 7724.9 |
| @tanstack/markdown parse+render | tables-lists.md | 454 | 2000 | 0.0334 | 1315 | 5238.6 |
| marked parse+render | tables-lists.md | 454 | 2000 | 0.0321 | 1102 | -13272.4 |
| markdown-it parse+render | tables-lists.md | 454 | 2000 | 0.0184 | 1325 | -5843.8 |
| micromark render | tables-lists.md | 454 | 2000 | 0.1947 | 627 | -12006.2 |
| commonmark parse+render | tables-lists.md | 454 | 2000 | 0.0132 | 627 | -4626.6 |
| markdown-wasm render | tables-lists.md | 454 | 2000 | 0.0060 | 1202 | 4504.4 |
| unified remark+rehype render | tables-lists.md | 454 | 2000 | 0.2424 | 622 | 5114.4 |

## Streaming

| Name | Fixture | Bytes | Iterations | ms/op | Output bytes | Heap delta KB |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: |
| @tanstack/markdown streaming profile | ai-response.md | 652 | 250 | 0.2850 | 1112 | -25768.1 |
| marked progressive parse+render | ai-response.md | 652 | 250 | 0.3194 | 1035 | 3579.4 |

## Averages

| Group | Name | Mean ms/op |
| :--- | :--- | ---: |
| markdown | @tanstack/markdown parse | 0.0160 |
| markdown | @tanstack/markdown render AST with external highlighter | 0.0044 |
| markdown | @tanstack/markdown render AST | 0.0030 |
| markdown | @tanstack/markdown parse+render with external highlighter | 0.0192 |
| markdown | @tanstack/markdown parse+render | 0.0176 |
| markdown | marked parse+render | 0.0208 |
| markdown | markdown-it parse+render | 0.0127 |
| markdown | micromark render | 0.1602 |
| markdown | commonmark parse+render | 0.0102 |
| markdown | markdown-wasm render | 0.0050 |
| markdown | unified remark+rehype render | 0.1889 |
| streaming | @tanstack/markdown streaming profile | 0.2850 |
| streaming | marked progressive parse+render | 0.3194 |
