# @tanstack/markdown

## 0.0.14

### Patch Changes

- 04f450c: Improve Markdown compatibility and parsing speed while reducing parser, renderer, and documentation extension bundles.
  
  - Preserve code span whitespace and exact backtick delimiters, handle escaped punctuation and nested emphasis, and retain formatted image alt text.
  - Correct nested list tightness, ordered lists starting at zero, indented code fences, escaped table pipes, and link destinations and reference labels. Prevent nested link anchors.
  - Avoid generated heading and footnote definition ID collisions, preserve headings across footnote content, and render backreferences for footnotes ending in non-paragraph blocks.
  - Keep callouts within quoted content, preserve prototype-shaped comment attributes and package-manager names, and guard oversized code-line ranges.
  - Reduce repeated scanning and allocations in inline parsing, React and Octane list rendering, and documentation extensions.
  
  Add regression coverage, ratchet 403 CommonMark examples, and enforce minified, gzip, and Brotli budgets for every public entry point. Existing public APIs and runtime dependencies are unchanged.
