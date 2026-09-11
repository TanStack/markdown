---
'@tanstack/markdown': patch
---

Forward raw code-fence metadata to `pre[data-meta]` and highlighter options in HTML, React, and Octane.

Add portable `InlineComponentNode` output for custom inline extensions, using the existing component maps without requiring raw HTML or a bundled math engine.

Add `urlTransform(url, kind, defaultUrl)` for application-controlled link and image policies. Default URL screening is unchanged; returning `null` removes a link or image while keeping its label content.

Use single-pass attribute escaping, expand renderer and security regression coverage, and update documentation and shipped skills. The combined renderer increase is 74-78 gzip bytes, with no new runtime dependencies.

Code fences with metadata now include an additional escaped HTML attribute. Consumers with exhaustive `InlineNode` switches should handle the new `inlineComponent` variant.
