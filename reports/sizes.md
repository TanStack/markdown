# Bundle Size Results

Generated: 2026-09-11T18:44:26.816Z

Bundles are ESM, browser-targeted, minified with esbuild, then gzip and brotli compressed. Framework runtimes are externalized for the React and Octane adapters.

| Group | Entry | Min bytes | Gzip bytes | Brotli bytes |
| :--- | :--- | ---: | ---: | ---: |
| tanstack | parser only | 13084 | 4941 | 4555 |
| tanstack | html renderer no highlighter | 18066 | 6730 | 6161 |
| tanstack | html renderer with external highlighter stub | 18102 | 6751 | 6179 |
| tanstack | react adapter | 18030 | 6648 | 6107 |
| tanstack | octane adapter | 18033 | 6649 | 6108 |
| tanstack | docs extension preset | 6423 | 2292 | 2073 |
| tanstack | callouts extension | 506 | 335 | 278 |
| tanstack | streaming extension | 699 | 311 | 253 |
| tanstack | react adapter with streaming extension | 18721 | 6835 | 6282 |
| tanstack | tabs transforms | 3290 | 1221 | 1082 |
| markdown | marked | 41415 | 12548 | 11509 |
| markdown | markdown-it | 148242 | 52655 | 44023 |
| markdown | micromark | 53283 | 15420 | 13712 |
| markdown | commonmark | 159687 | 48084 | 39793 |
| markdown | markdown-wasm browser js+wasm | 66387 | 31275 | 26431 |
| markdown | unified remark+rehype | 119588 | 36843 | 32686 |
| tanstack-public | . | 18328 | 6853 | 6262 |
| tanstack-public | ./html | 18289 | 6841 | 6258 |
| tanstack-public | ./parser | 13216 | 5027 | 4630 |
| tanstack-public | ./react | 18229 | 6756 | 6200 |
| tanstack-public | ./octane | 18235 | 6756 | 6207 |
| tanstack-public | ./extensions/callouts | 660 | 432 | 360 |
| tanstack-public | ./extensions/comment-components | 1073 | 647 | 542 |
| tanstack-public | ./extensions/docs | 6587 | 2392 | 2162 |
| tanstack-public | ./extensions/framework | 1470 | 734 | 630 |
| tanstack-public | ./extensions/headings | 1038 | 573 | 480 |
| tanstack-public | ./extensions/streaming | 838 | 403 | 334 |
| tanstack-public | ./extensions/tabs | 3537 | 1338 | 1185 |
