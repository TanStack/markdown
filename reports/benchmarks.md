# Benchmark Results

Generated: 2026-07-22T18:10:12.744Z

Lower `ms/op` is better. Benchmarks run in Node with production package builds where available; heap delta is a coarse process-level signal, not an allocation profiler.

## Markdown

| Name | Fixture | Bytes | Iterations | ms/op | Output bytes | Heap delta KB |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: |
| @tanstack/markdown parse | code-heavy.md | 1011 | 1000 | 0.0087 | 15 | -414.2 |
| @tanstack/markdown render AST with external highlighter | code-heavy.md | 1011 | 1000 | 0.0089 | 4504 | 3834.4 |
| @tanstack/markdown render AST | code-heavy.md | 1011 | 1000 | 0.0039 | 1835 | -1169.2 |
| @tanstack/markdown parse+render with external highlighter | code-heavy.md | 1011 | 1000 | 0.0177 | 4504 | -356.7 |
| @tanstack/markdown parse+render | code-heavy.md | 1011 | 1000 | 0.0118 | 1835 | -6238.0 |
| marked parse+render | code-heavy.md | 1011 | 1000 | 0.0080 | 1330 | 4941.8 |
| markdown-it parse+render | code-heavy.md | 1011 | 1000 | 0.0111 | 1330 | -5054.3 |
| micromark render | code-heavy.md | 1011 | 1000 | 0.1219 | 1330 | -825.2 |
| commonmark parse+render | code-heavy.md | 1011 | 1000 | 0.0098 | 1330 | 8180.1 |
| markdown-wasm render | code-heavy.md | 1011 | 1000 | 0.0073 | 1512 | 2592.1 |
| unified remark+rehype render | code-heavy.md | 1011 | 1000 | 0.1197 | 1200 | -2376.6 |
| @tanstack/markdown parse | malformed.md | 237 | 2000 | 0.0044 | 15 | -6991.4 |
| @tanstack/markdown render AST with external highlighter | malformed.md | 237 | 2000 | 0.0016 | 1067 | 803.8 |
| @tanstack/markdown render AST | malformed.md | 237 | 2000 | 0.0007 | 361 | 6929.9 |
| @tanstack/markdown parse+render with external highlighter | malformed.md | 237 | 2000 | 0.0048 | 1067 | -7606.9 |
| @tanstack/markdown parse+render | malformed.md | 237 | 2000 | 0.0037 | 361 | -1790.6 |
| marked parse+render | malformed.md | 237 | 2000 | 0.0047 | 350 | 270.9 |
| markdown-it parse+render | malformed.md | 237 | 2000 | 0.0048 | 300 | 8729.9 |
| micromark render | malformed.md | 237 | 2000 | 0.0418 | 300 | 9444.4 |
| commonmark parse+render | malformed.md | 237 | 2000 | 0.0041 | 300 | -8779.6 |
| markdown-wasm render | malformed.md | 237 | 2000 | 0.0017 | 408 | 2953.5 |
| unified remark+rehype render | malformed.md | 237 | 2000 | 0.0431 | 297 | 3229.0 |
| @tanstack/markdown parse | prose-heavy.md | 1700 | 1000 | 0.0226 | 15 | 1770.2 |
| @tanstack/markdown render AST with external highlighter | prose-heavy.md | 1700 | 1000 | 0.0023 | 1903 | -4262.2 |
| @tanstack/markdown render AST | prose-heavy.md | 1700 | 1000 | 0.0022 | 1903 | -4329.0 |
| @tanstack/markdown parse+render with external highlighter | prose-heavy.md | 1700 | 1000 | 0.0234 | 1903 | -1547.6 |
| @tanstack/markdown parse+render | prose-heavy.md | 1700 | 1000 | 0.0238 | 1903 | -1655.5 |
| marked parse+render | prose-heavy.md | 1700 | 1000 | 0.0325 | 1860 | -9294.6 |
| markdown-it parse+render | prose-heavy.md | 1700 | 1000 | 0.0172 | 1860 | 13230.7 |
| micromark render | prose-heavy.md | 1700 | 1000 | 0.2140 | 1862 | -7081.7 |
| commonmark parse+render | prose-heavy.md | 1700 | 1000 | 0.0127 | 1862 | 48079.0 |
| markdown-wasm render | prose-heavy.md | 1700 | 1000 | 0.0061 | 2340 | 3369.7 |
| unified remark+rehype render | prose-heavy.md | 1700 | 1000 | 0.2268 | 1859 | 52596.4 |
| @tanstack/markdown parse | small-doc.md | 432 | 2000 | 0.0087 | 15 | 23523.2 |
| @tanstack/markdown render AST with external highlighter | small-doc.md | 432 | 2000 | 0.0032 | 1328 | -32785.7 |
| @tanstack/markdown render AST | small-doc.md | 432 | 2000 | 0.0025 | 1002 | 25865.8 |
| @tanstack/markdown parse+render with external highlighter | small-doc.md | 432 | 2000 | 0.0121 | 1328 | -14525.9 |
| @tanstack/markdown parse+render | small-doc.md | 432 | 2000 | 0.0114 | 1002 | -20062.2 |
| marked parse+render | small-doc.md | 432 | 2000 | 0.0113 | 724 | 49472.8 |
| markdown-it parse+render | small-doc.md | 432 | 2000 | 0.0075 | 776 | 1534.2 |
| micromark render | small-doc.md | 432 | 2000 | 0.0869 | 535 | 44657.0 |
| commonmark parse+render | small-doc.md | 432 | 2000 | 0.0056 | 535 | -15027.6 |
| markdown-wasm render | small-doc.md | 432 | 2000 | 0.0032 | 854 | 3637.7 |
| unified remark+rehype render | small-doc.md | 432 | 2000 | 0.0993 | 534 | 4475.7 |
| @tanstack/markdown parse | tables-lists.md | 454 | 2000 | 0.0229 | 15 | -16469.1 |
| @tanstack/markdown render AST with external highlighter | tables-lists.md | 454 | 2000 | 0.0042 | 1315 | -17045.7 |
| @tanstack/markdown render AST | tables-lists.md | 454 | 2000 | 0.0039 | 1315 | -17825.4 |
| @tanstack/markdown parse+render with external highlighter | tables-lists.md | 454 | 2000 | 0.0266 | 1315 | 30703.9 |
| @tanstack/markdown parse+render | tables-lists.md | 454 | 2000 | 0.0263 | 1315 | -34852.2 |
| marked parse+render | tables-lists.md | 454 | 2000 | 0.0257 | 1102 | 46341.5 |
| markdown-it parse+render | tables-lists.md | 454 | 2000 | 0.0167 | 1325 | -42428.3 |
| micromark render | tables-lists.md | 454 | 2000 | 0.1471 | 627 | 26931.6 |
| commonmark parse+render | tables-lists.md | 454 | 2000 | 0.0111 | 627 | -35659.1 |
| markdown-wasm render | tables-lists.md | 454 | 2000 | 0.0056 | 1202 | 4504.4 |
| unified remark+rehype render | tables-lists.md | 454 | 2000 | 0.1729 | 622 | 6602.6 |

## Averages

| Group | Name | Mean ms/op |
| :--- | :--- | ---: |
| markdown | @tanstack/markdown parse | 0.0135 |
| markdown | @tanstack/markdown render AST with external highlighter | 0.0040 |
| markdown | @tanstack/markdown render AST | 0.0026 |
| markdown | @tanstack/markdown parse+render with external highlighter | 0.0169 |
| markdown | @tanstack/markdown parse+render | 0.0154 |
| markdown | marked parse+render | 0.0164 |
| markdown | markdown-it parse+render | 0.0115 |
| markdown | micromark render | 0.1223 |
| markdown | commonmark parse+render | 0.0087 |
| markdown | markdown-wasm render | 0.0048 |
| markdown | unified remark+rehype render | 0.1323 |
