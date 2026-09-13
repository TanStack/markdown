# Bundle Size Results

Generated: 2026-09-12T23:57:10.289Z

Bundles are ESM, browser-targeted, minified with esbuild, then gzip and brotli compressed. Framework runtimes are externalized for the React and Octane adapters.

| Group | Entry | Min bytes | Gzip bytes | Brotli bytes |
| :--- | :--- | ---: | ---: | ---: |
| tanstack | parser only | 11949 | 4894 | 4539 |
| tanstack | html renderer no highlighter | 17139 | 6729 | 6158 |
| tanstack | html renderer with external highlighter stub | 17175 | 6751 | 6184 |
| tanstack | react adapter | 17147 | 6676 | 6170 |
| tanstack | octane adapter | 17084 | 6644 | 6143 |
| tanstack | docs extension preset | 6423 | 2292 | 2073 |
| tanstack | callouts extension | 506 | 335 | 278 |
| tanstack | streaming extension | 699 | 311 | 253 |
| tanstack | react adapter with streaming extension | 17839 | 6860 | 6302 |
| tanstack | tabs transforms | 3290 | 1221 | 1082 |
| markdown | marked | 41415 | 12548 | 11509 |
| markdown | markdown-it | 148242 | 52655 | 44023 |
| markdown | micromark | 53283 | 15420 | 13712 |
| markdown | commonmark | 159687 | 48084 | 39793 |
| markdown | markdown-wasm browser js+wasm | 66387 | 31275 | 26431 |
| markdown | unified remark+rehype | 119588 | 36843 | 32686 |
| tanstack-public | . | 17404 | 6852 | 6267 |
| tanstack-public | ./html | 17364 | 6840 | 6283 |
| tanstack-public | ./parser | 12082 | 4981 | 4599 |
| tanstack-public | ./react | 17347 | 6790 | 6241 |
| tanstack-public | ./octane | 17287 | 6752 | 6209 |
| tanstack-public | ./extensions/callouts | 660 | 432 | 360 |
| tanstack-public | ./extensions/comment-components | 1073 | 647 | 542 |
| tanstack-public | ./extensions/docs | 6587 | 2392 | 2162 |
| tanstack-public | ./extensions/framework | 1470 | 734 | 630 |
| tanstack-public | ./extensions/headings | 1038 | 573 | 480 |
| tanstack-public | ./extensions/streaming | 838 | 403 | 334 |
| tanstack-public | ./extensions/tabs | 3537 | 1338 | 1185 |
