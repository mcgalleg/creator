import { useState } from "react";
import type { McpUiHostContext } from "@modelcontextprotocol/ext-apps";
import { useApp, useHostStyles } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { DataView } from "./data-detector";
import { Loading } from "./components/loading";
import type { StructuredContent } from "./types";

export function AnalyticsApp() {
  const [data, setData] = useState<StructuredContent | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [hostContext, setHostContext] = useState<McpUiHostContext | undefined>();

  const { app, error } = useApp({
    appInfo: { name: "Creator Analytics", version: "1.0.0" },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolinputpartial = () => {
        setIsStreaming(true);
      };

      app.ontoolinput = () => {};

      app.ontoolresult = async (result: CallToolResult) => {
        setIsStreaming(false);
        if (result.structuredContent) {
          setData(result.structuredContent as StructuredContent);
        }
      };

      app.ontoolcancelled = () => {
        setIsStreaming(false);
      };

      app.onerror = console.error;

      app.onhostcontextchanged = (params) => {
        setHostContext((prev) => ({ ...prev, ...params }));
      };
    },
  });

  useHostStyles(app, app?.getHostContext());

  if (error) {
    return (
      <div style={{ padding: 24, color: "var(--color-error)" }}>
        Connection error: {error.message}
      </div>
    );
  }

  if (!app) return <Loading message="Connecting..." />;
  if (isStreaming) return <Loading message="Loading analytics..." />;
  if (!data) return <Loading message="Waiting for data..." />;

  return (
    <div
      style={{
        paddingTop: hostContext?.safeAreaInsets?.top,
        paddingRight: hostContext?.safeAreaInsets?.right,
        paddingBottom: hostContext?.safeAreaInsets?.bottom,
        paddingLeft: hostContext?.safeAreaInsets?.left,
      }}
    >
      <DataView data={data} app={app} hostContext={hostContext} />
    </div>
  );
}
