# Quick Start

Install the package and render markdown on either side of the wire.

```bash
npm install @tanstack/markdown
```

```tsx title="app.tsx" {3}
import { renderHtml } from '@tanstack/markdown'

const html = renderHtml('# Hello')
document.body.innerHTML = html
```

## Notes

- Deterministic output
- Escaped HTML by default
- Small language packs

| Feature | Default |
| :--- | :--- |
| HTML | escaped |
| IDs | stable |
