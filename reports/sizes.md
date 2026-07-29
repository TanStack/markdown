# Bundle Size Results

Generated: 2026-07-29T02:36:13.986Z

Bundles are ESM, browser-targeted, minified with esbuild, then gzip and brotli compressed. Framework runtimes are externalized for the React and Octane adapters.

| Group | Entry | Min bytes | Gzip bytes | Brotli bytes |
| :--- | :--- | ---: | ---: | ---: |
| tanstack | parser only | 14043 | 4970 | 4571 |
| tanstack | html renderer no highlighter | 19120 | 6781 | 6203 |
| tanstack | html renderer with external highlighter stub | 19156 | 6802 | 6223 |
| tanstack | react adapter | 19085 | 6704 | 6166 |
| tanstack | octane adapter | 19088 | 6701 | 6169 |
| tanstack | docs extension preset | 6792 | 2398 | 2188 |
| tanstack | callouts extension | 556 | 372 | 329 |
| tanstack | streaming extension | 699 | 311 | 253 |
| tanstack | react adapter with streaming extension | 19776 | 6886 | 6331 |
| tanstack | tabs transforms | 3398 | 1255 | 1103 |
| markdown | marked | 41415 | 12548 | 11509 |
| markdown | markdown-it | 148242 | 52655 | 44023 |
| markdown | micromark | 53283 | 15420 | 13712 |
| markdown | commonmark | 159687 | 48084 | 39793 |
| markdown | markdown-wasm browser js+wasm | 66387 | 31275 | 26431 |
| markdown | unified remark+rehype | 119588 | 36843 | 32686 |
