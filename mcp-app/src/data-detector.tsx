import type { App, McpUiHostContext } from "@modelcontextprotocol/ext-apps";
import type { StructuredContent } from "./types";

interface DataViewProps {
  data: StructuredContent;
  app: App;
  hostContext?: McpUiHostContext;
}

export function DataView({ data }: DataViewProps) {
  return (
    <div style={{ padding: 24, fontFamily: "var(--font-mono)", fontSize: "0.75rem", whiteSpace: "pre-wrap", color: "var(--color-text-secondary)" }}>
      {JSON.stringify(data, null, 2)}
    </div>
  );
}
