---
'@tanstack/markdown': patch
---

Speed up plain fenced-code rendering with the React streaming extension by retaining completed code text nodes across updates. Reduce parser overhead and shrink every affected public bundle without adding runtime dependencies.

Add unfinished-fence benchmarks at 4, 16, and 64 KiB, browser comparisons with Streamdown and streaming-markdown, and regression coverage for streamed text, custom code components, and hydration.
