# Bundle Size Results

Generated: 2026-09-30T22:59:30.929Z

Bundles are ESM, browser-targeted, minified with esbuild, then gzip and brotli compressed. Framework runtimes are externalized for the React and Octane adapters.

| Group | Entry | Min bytes | Gzip bytes | Brotli bytes |
| :--- | :--- | ---: | ---: | ---: |
| tanstack | parser only | 12583 | 5196 | 4785 |
| tanstack | html renderer no highlighter | 17774 | 7027 | 6436 |
| tanstack | html renderer with external highlighter stub | 17810 | 7049 | 6478 |
| tanstack | react adapter | 17782 | 6974 | 6442 |
| tanstack | octane adapter | 17719 | 6941 | 6383 |
| tanstack | docs extension preset | 6285 | 2273 | 2059 |
| tanstack | callouts extension | 506 | 335 | 278 |
| tanstack | streaming extension | 699 | 311 | 253 |
| tanstack | react adapter with streaming extension | 18474 | 7157 | 6572 |
| tanstack | tabs transforms | 3152 | 1206 | 1076 |
| markdown | marked | 41415 | 12548 | 11509 |
| markdown | markdown-it | 148242 | 52655 | 44023 |
| markdown | micromark | 53283 | 15420 | 13712 |
| markdown | commonmark | 159687 | 48084 | 39793 |
| markdown | markdown-wasm browser js+wasm | 66387 | 31275 | 26431 |
| markdown | unified remark+rehype | 119588 | 36843 | 32686 |
| tanstack-public | . | 18039 | 7151 | 6580 |
| tanstack-public | ./html | 17999 | 7141 | 6526 |
| tanstack-public | ./parser | 12716 | 5284 | 4879 |
| tanstack-public | ./react | 17982 | 7086 | 6513 |
| tanstack-public | ./octane | 17922 | 7049 | 6485 |
| tanstack-public | ./extensions/callouts | 660 | 432 | 360 |
| tanstack-public | ./extensions/comment-components | 1073 | 647 | 542 |
| tanstack-public | ./extensions/docs | 6449 | 2373 | 2138 |
| tanstack-public | ./extensions/framework | 1422 | 706 | 607 |
| tanstack-public | ./extensions/headings | 1038 | 573 | 480 |
| tanstack-public | ./extensions/streaming | 838 | 403 | 334 |
| tanstack-public | ./extensions/tabs | 3399 | 1324 | 1183 |
