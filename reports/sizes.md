# Bundle Size Results

Generated: 2026-09-11T20:23:25.726Z

Bundles are ESM, browser-targeted, minified with esbuild, then gzip and brotli compressed. Framework runtimes are externalized for the React and Octane adapters.

| Group | Entry | Min bytes | Gzip bytes | Brotli bytes |
| :--- | :--- | ---: | ---: | ---: |
| tanstack | parser only | 13157 | 4975 | 4593 |
| tanstack | html renderer no highlighter | 18337 | 6807 | 6240 |
| tanstack | html renderer with external highlighter stub | 18373 | 6829 | 6260 |
| tanstack | react adapter | 18271 | 6722 | 6184 |
| tanstack | octane adapter | 18283 | 6727 | 6194 |
| tanstack | docs extension preset | 6423 | 2292 | 2073 |
| tanstack | callouts extension | 506 | 335 | 278 |
| tanstack | streaming extension | 699 | 311 | 253 |
| tanstack | react adapter with streaming extension | 18962 | 6907 | 6356 |
| tanstack | tabs transforms | 3290 | 1221 | 1082 |
| markdown | marked | 41415 | 12548 | 11509 |
| markdown | markdown-it | 148242 | 52655 | 44023 |
| markdown | micromark | 53283 | 15420 | 13712 |
| markdown | commonmark | 159687 | 48084 | 39793 |
| markdown | markdown-wasm browser js+wasm | 66387 | 31275 | 26431 |
| markdown | unified remark+rehype | 119588 | 36843 | 32686 |
| tanstack-public | . | 18598 | 6936 | 6345 |
| tanstack-public | ./html | 18560 | 6920 | 6331 |
| tanstack-public | ./parser | 13289 | 5061 | 4664 |
| tanstack-public | ./react | 18470 | 6828 | 6279 |
| tanstack-public | ./octane | 18485 | 6833 | 6287 |
| tanstack-public | ./extensions/callouts | 660 | 432 | 360 |
| tanstack-public | ./extensions/comment-components | 1073 | 647 | 542 |
| tanstack-public | ./extensions/docs | 6587 | 2392 | 2162 |
| tanstack-public | ./extensions/framework | 1470 | 734 | 630 |
| tanstack-public | ./extensions/headings | 1038 | 573 | 480 |
| tanstack-public | ./extensions/streaming | 838 | 403 | 334 |
| tanstack-public | ./extensions/tabs | 3537 | 1338 | 1185 |
