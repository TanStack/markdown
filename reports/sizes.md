# Bundle Size Results

Generated: 2026-09-12T16:34:38.705Z

Bundles are ESM, browser-targeted, minified with esbuild, then gzip and brotli compressed. Framework runtimes are externalized for the React and Octane adapters.

| Group | Entry | Min bytes | Gzip bytes | Brotli bytes |
| :--- | :--- | ---: | ---: | ---: |
| tanstack | parser only | 13797 | 5283 | 4854 |
| tanstack | html renderer no highlighter | 18979 | 7116 | 6514 |
| tanstack | html renderer with external highlighter stub | 19015 | 7137 | 6536 |
| tanstack | react adapter | 18913 | 7026 | 6454 |
| tanstack | octane adapter | 18925 | 7033 | 6462 |
| tanstack | docs extension preset | 6423 | 2292 | 2073 |
| tanstack | callouts extension | 506 | 335 | 278 |
| tanstack | streaming extension | 699 | 311 | 253 |
| tanstack | react adapter with streaming extension | 19604 | 7212 | 6624 |
| tanstack | tabs transforms | 3290 | 1221 | 1082 |
| markdown | marked | 41415 | 12548 | 11509 |
| markdown | markdown-it | 148242 | 52655 | 44023 |
| markdown | micromark | 53283 | 15420 | 13712 |
| markdown | commonmark | 159687 | 48084 | 39793 |
| markdown | markdown-wasm browser js+wasm | 66387 | 31275 | 26431 |
| markdown | unified remark+rehype | 119588 | 36843 | 32686 |
| tanstack-public | . | 19241 | 7240 | 6622 |
| tanstack-public | ./html | 19203 | 7227 | 6606 |
| tanstack-public | ./parser | 13929 | 5372 | 4925 |
| tanstack-public | ./react | 19113 | 7133 | 6554 |
| tanstack-public | ./octane | 19128 | 7140 | 6563 |
| tanstack-public | ./extensions/callouts | 660 | 432 | 360 |
| tanstack-public | ./extensions/comment-components | 1073 | 647 | 542 |
| tanstack-public | ./extensions/docs | 6587 | 2392 | 2162 |
| tanstack-public | ./extensions/framework | 1470 | 734 | 630 |
| tanstack-public | ./extensions/headings | 1038 | 573 | 480 |
| tanstack-public | ./extensions/streaming | 838 | 403 | 334 |
| tanstack-public | ./extensions/tabs | 3537 | 1338 | 1185 |
