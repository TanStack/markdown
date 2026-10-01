# @tanstack/markdown

## 1.0.0

### Major Changes

- 7cd68d4: Release the documented Markdown parser, HTML/React/Octane renderers, AST and extension APIs as version 1.0. Define the compatibility and trusted-content contracts, validate installed package entry points, and gate releases on supported server and browser rendering tests. Include the optional source-level inline parser contract for custom syntax without changing default parsing. Existing 0.0.16 calls require no migration.

### Minor Changes

- 771ab04: Add opt-in source-level inline parsers to Markdown extensions. Declare starting characters and return a standard inline node with an explicit consumed length, before built-in formatting changes the source. Preserve escape and code precedence, expose link-label context, and share parser budgets with nested parsing.

## 0.0.16

### Patch Changes

- 967a294: Support framework-independent commands in package-manager tabs. Lines without a framework prefix are shared commands, and named framework groups include shared lines in source order. Preserve existing framework-prefixed commands and URL and path specifiers.

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
