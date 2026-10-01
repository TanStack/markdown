# Bundle Size Results

Generated: 2026-10-01T01:44:15.553Z

Bundles are ESM, browser-targeted, minified with esbuild, then gzip and brotli compressed. Framework runtimes are externalized for the React and Octane adapters.

| Group | Entry | Min bytes | Gzip bytes | Brotli bytes |
| :--- | :--- | ---: | ---: | ---: |
| tanstack | parser only | 12648 | 5217 | 4823 |
| tanstack | html renderer no highlighter | 17839 | 7048 | 6483 |
| tanstack | html renderer with external highlighter stub | 17875 | 7068 | 6474 |
| tanstack | react adapter | 17847 | 6998 | 6478 |
| tanstack | octane adapter | 17784 | 6964 | 6438 |
| tanstack | docs extension preset | 6285 | 2273 | 2059 |
| tanstack | callouts extension | 506 | 335 | 278 |
| tanstack | streaming extension | 699 | 311 | 253 |
| tanstack | react adapter with streaming extension | 18539 | 7183 | 6621 |
| tanstack | tabs transforms | 3152 | 1206 | 1076 |
| markdown | marked | 41415 | 12548 | 11509 |
| markdown | markdown-it | 148242 | 52655 | 44023 |
| markdown | micromark | 53283 | 15420 | 13712 |
| markdown | commonmark | 159687 | 48084 | 39793 |
| markdown | markdown-wasm browser js+wasm | 66387 | 31275 | 26431 |
| markdown | unified remark+rehype | 119588 | 36843 | 32686 |
| tanstack-public | . | 18104 | 7174 | 6583 |
| tanstack-public | ./html | 18064 | 7161 | 6580 |
| tanstack-public | ./parser | 12781 | 5304 | 4884 |
| tanstack-public | ./react | 18047 | 7108 | 6563 |
| tanstack-public | ./octane | 17987 | 7073 | 6504 |
| tanstack-public | ./extensions/callouts | 660 | 432 | 360 |
| tanstack-public | ./extensions/comment-components | 1073 | 647 | 542 |
| tanstack-public | ./extensions/docs | 6449 | 2373 | 2138 |
| tanstack-public | ./extensions/framework | 1422 | 706 | 607 |
| tanstack-public | ./extensions/headings | 1038 | 573 | 480 |
| tanstack-public | ./extensions/streaming | 838 | 403 | 334 |
| tanstack-public | ./extensions/tabs | 3399 | 1324 | 1183 |
