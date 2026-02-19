// ── Structured Content Types ──
// With query-first architecture, tools return plain JSON via content[].text.
// This type is kept minimal for the MCP App shell's fallback renderer.

export type StructuredContent = Record<string, unknown> & { _type: string };
