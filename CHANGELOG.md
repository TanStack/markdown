# @tanstack/markdown

## 0.0.15

### Patch Changes

- f37686a: Speed up plain fenced-code rendering with the React streaming extension by retaining completed code text nodes across updates. Reduce parser overhead and shrink every affected public bundle without adding runtime dependencies.
  
  Add unfinished-fence benchmarks at 4, 16, and 64 KiB, browser comparisons with Streamdown and streaming-markdown, and regression coverage for streamed text, custom code components, and hydration.
- eb6ef72: Forward raw code-fence metadata to `pre[data-meta]` and highlighter options in HTML, React, and Octane.
  
  Add portable `InlineComponentNode` output for custom inline extensions, using the existing component maps without requiring raw HTML or a bundled math engine.
  
  Add `urlTransform(url, kind, defaultUrl)` for application-controlled link and image policies. Default URL screening is unchanged; returning `null` removes a link or image while keeping its label content.
  
  Use single-pass attribute escaping, expand renderer and security regression coverage, and update documentation and shipped skills. The combined renderer increase is 74-78 gzip bytes, with no new runtime dependencies.
  
  Code fences with metadata now include an additional escaped HTML attribute. Consumers with exhaustive `InlineNode` switches should handle the new `inlineComponent` variant.

## 0.0.14

### Patch Changes

- 04f450c: Improve Markdown compatibility and parsing speed while reducing parser, renderer, and documentation extension bundles.
  
  - Preserve code span whitespace and exact backtick delimiters, handle escaped punctuation and nested emphasis, and retain formatted image alt text.
  - Correct nested list tightness, ordered lists starting at zero, indented code fences, escaped table pipes, and link destinations and reference labels. Prevent nested link anchors.
  - Avoid generated heading and footnote definition ID collisions, preserve headings across footnote content, and render backreferences for footnotes ending in non-paragraph blocks.
  - Keep callouts within quoted content, preserve prototype-shaped comment attributes and package-manager names, and guard oversized code-line ranges.
  - Reduce repeated scanning and allocations in inline parsing, React and Octane list rendering, and documentation extensions.
  
  Add regression coverage, ratchet 403 CommonMark examples, and enforce minified, gzip, and Brotli budgets for every public entry point. Existing public APIs and runtime dependencies are unchanged.
