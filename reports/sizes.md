# Bundle Size Results

Generated: 2026-07-21T20:15:46.594Z

Bundles are ESM, browser-targeted, minified with esbuild, then gzip and brotli compressed. React is externalized for the React adapter.

| Group | Entry | Min bytes | Gzip bytes | Brotli bytes |
| :--- | :--- | ---: | ---: | ---: |
| tanstack | parser only | 12810 | 4563 | 4199 |
| tanstack | html renderer no highlighter | 17837 | 6366 | 5826 |
| tanstack | html renderer with external highlighter stub | 17873 | 6387 | 5846 |
| tanstack | react adapter | 17803 | 6279 | 5760 |
| tanstack | docs extension preset | 6792 | 2398 | 2188 |
| tanstack | callouts extension | 556 | 372 | 329 |
| tanstack | tabs transforms | 3398 | 1255 | 1103 |
| markdown | marked | 41415 | 12548 | 11509 |
| markdown | markdown-it | 148242 | 52655 | 44023 |
| markdown | micromark | 53283 | 15420 | 13712 |
| markdown | commonmark | 159687 | 48084 | 39793 |
| markdown | markdown-wasm browser js+wasm | 66387 | 31275 | 26431 |
| markdown | unified remark+rehype | 119588 | 36843 | 32686 |
