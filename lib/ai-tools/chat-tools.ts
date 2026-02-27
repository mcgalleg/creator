import type { UIToolInvocation } from "ai";

// ---------------------------------------------------------------------------
// createDiagram
// ---------------------------------------------------------------------------

export interface DiagramResult {
  title: string;
  elements: unknown[];
}

export type CreateDiagramInvocation = UIToolInvocation<{
  input: { title: string; elements: string };
  output: {
    title: string;
    elements?: unknown[];
    elementCount?: number;
    error?: string;
  };
}>;

// ---------------------------------------------------------------------------
// Union type for catch-all rendering
// ---------------------------------------------------------------------------

export type ChatToolPart =
  | ({ type: "tool-createDiagram" } & CreateDiagramInvocation);
