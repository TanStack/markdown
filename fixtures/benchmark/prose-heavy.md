---
title: Rendering Markdown in Apps
---

# Rendering Markdown in Apps

Markdown in modern applications is usually not a static publishing problem. The content may be loaded over an API, streamed from a server, rendered inside a route transition, or re-rendered after a small client-side state update. That changes the constraints.

The renderer needs to be predictable enough for hydration, cheap enough to run during navigation, and small enough that it does not dominate the first documentation page. Full CommonMark compatibility is useful, but it is not always the most important requirement for app documentation.

## A Smaller Contract

A docs-oriented renderer can support a smaller contract:

- headings with stable anchors
- paragraphs and inline formatting
- code fences with metadata
- tables
- lists and task items
- blockquotes
- images and links
- safe HTML behavior

That contract should be explicit. When the system does not support an edge case, it should fail plainly instead of creating different server and client output.

> The critical property is not that every historical Markdown trick works. The critical property is that the same input produces the same output everywhere.

## Hydration

Hydration problems usually come from hidden state: random IDs, environment-specific transforms, async language loading, locale-dependent formatting, or plugins that run in a different order. A tiny pipeline has fewer places for hidden state to enter.

## Extension Shape

Extensions should be loaded per feature, not per page. The base parser should understand the common document shape. Optional behavior can attach at block parsing, inline transformation, or rendering boundaries.
