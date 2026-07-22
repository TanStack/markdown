# Bundle Size Results

Generated: 2026-07-22T18:10:09.789Z

Bundles are ESM, browser-targeted, minified with esbuild, then gzip and brotli compressed. Framework runtimes are externalized for the React and Octane adapters.

| Group | Entry | Min bytes | Gzip bytes | Brotli bytes |
| :--- | :--- | ---: | ---: | ---: |
| tanstack | parser only | 14017 | 4942 | 4549 |
| tanstack | html renderer no highlighter | 19047 | 6747 | 6171 |
| tanstack | html renderer with external highlighter stub | 19083 | 6768 | 6190 |
| tanstack | react adapter | 19012 | 6662 | 6124 |
| tanstack | octane adapter | 19015 | 6661 | 6125 |
| tanstack | docs extension preset | 6792 | 2398 | 2188 |
| tanstack | callouts extension | 556 | 372 | 329 |
| tanstack | tabs transforms | 3398 | 1255 | 1103 |
| markdown | marked | 41415 | 12548 | 11509 |
| markdown | markdown-it | 148242 | 52655 | 44023 |
| markdown | micromark | 53283 | 15420 | 13712 |
| markdown | commonmark | 159687 | 48084 | 39793 |
| markdown | markdown-wasm browser js+wasm | 66387 | 31275 | 26431 |
| markdown | unified remark+rehype | 119588 | 36843 | 32686 |
