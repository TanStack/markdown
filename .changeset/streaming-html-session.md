---
"@tanstack/markdown": minor
---

Add an optional HTML rendering session at `@tanstack/markdown/html/streaming` that reuses escaped code while appending to a standalone open fence. Every update returns complete HTML. Edits to an eligible open fence rebuild its header and escape its body. Other syntax and custom options use full rendering.
