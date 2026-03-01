'use client';

import { useEffect, useRef, useState, useLayoutEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';
import {
  AppBridge,
  PostMessageTransport,
} from '@modelcontextprotocol/ext-apps/app-bridge';

interface McpAppRendererProps {
  serverUrl: string;
  resourceUri: string;
  toolInput: Record<string, unknown>;
  toolResult: unknown;
}

export function McpAppRenderer({
  serverUrl,
  resourceUri,
  toolInput,
  toolResult,
}: McpAppRendererProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const bridgeRef = useRef<AppBridge | null>(null);
  const [iframeHeight, setIframeHeight] = useState(400);
  const { resolvedTheme } = useTheme();

  // Keep stable refs for values used in the bridge callbacks
  const toolInputRef = useRef(toolInput);
  toolInputRef.current = toolInput;
  const toolResultRef = useRef(toolResult);
  toolResultRef.current = toolResult;
  const themeRef = useRef(resolvedTheme);
  themeRef.current = resolvedTheme;

  // The iframe loads directly from our API route which serves the MCP App
  // HTML as text/html WITHOUT the parent page's CSP headers, allowing the
  // App's CDN scripts (esm.sh) to load freely.
  const iframeSrc = useMemo(() => {
    const params = new URLSearchParams({ serverUrl, resourceUri });
    return `/api/connectors/render?${params.toString()}`;
  }, [serverUrl, resourceUri]);

  // Set up AppBridge BEFORE the iframe content loads.
  //
  // useLayoutEffect runs synchronously after React commits the <iframe> to
  // the DOM (with src set) but BEFORE the browser completes the async
  // navigation to the render route. This ensures the bridge's postMessage
  // listener is registered on `window` before the App's scripts run and
  // send `ui/initialize`.
  //
  // The cleanup function handles React Strict Mode (dev: mount → unmount →
  // remount) by tearing down the bridge so a fresh one is created on remount.
  useLayoutEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const contentWindow = iframe.contentWindow;
    if (!contentWindow) return;

    console.log('[McpAppRenderer] Setting up bridge, iframeSrc:', iframeSrc);

    // Per the SDK docs: pass contentWindow as BOTH target and source.
    // The transport always listens on the host's own `window`.
    const transport = new PostMessageTransport(
      contentWindow,
      contentWindow,
    );

    const bridge = new AppBridge(
      null,
      { name: 'creator', version: '1.0.0' },
      { openLinks: {}, logging: {} },
      {
        hostContext: {
          theme: themeRef.current === 'dark' ? 'dark' : 'light',
        },
      },
    );

    bridge.onsizechange = ({ width, height }) => {
      console.log('[McpAppRenderer] Size change:', { width, height });
      if (height != null) {
        setIframeHeight(Math.min(height, 800));
      }
    };

    bridge.onopenlink = async ({ url }) => {
      window.open(url, '_blank', 'noopener,noreferrer');
      return {};
    };

    bridge.onloggingmessage = ({ level, data }) => {
      console.log(`[McpApp:${level}]`, data);
    };

    bridge.oninitialized = () => {
      console.log('[McpAppRenderer] Bridge initialized! Sending tool data...');
      // Strip our internal metadata before forwarding to the App
      const result = toolResultRef.current;
      const cleanResult =
        result && typeof result === 'object' && !Array.isArray(result)
          ? Object.fromEntries(
              Object.entries(result as Record<string, unknown>).filter(
                ([k]) => k !== '_mcpAppUi'
              )
            )
          : result;

      bridge.sendToolInput({ arguments: toolInputRef.current });
      bridge.sendToolResult({
        content: [{ type: 'text', text: JSON.stringify(cleanResult) }],
      });
      console.log('[McpAppRenderer] Tool data sent');
    };

    // Listen for iframe load to confirm HTML loaded
    const onIframeLoad = () => {
      console.log('[McpAppRenderer] iframe loaded');
    };
    iframe.addEventListener('load', onIframeLoad);

    bridge.connect(transport).then(() => {
      console.log('[McpAppRenderer] Bridge connected (transport started)');
    }).catch((err) => {
      console.error('[McpAppRenderer] Bridge connect error:', err);
    });

    bridgeRef.current = bridge;

    // Cleanup: tear down bridge so React Strict Mode remount creates fresh one
    return () => {
      iframe.removeEventListener('load', onIframeLoad);
      bridge.close().catch(() => {});
      bridgeRef.current = null;
    };
  }, [iframeSrc]);

  // Update theme when it changes
  useEffect(() => {
    if (bridgeRef.current && resolvedTheme) {
      bridgeRef.current.setHostContext({
        theme: resolvedTheme === 'dark' ? 'dark' : 'light',
      });
    }
  }, [resolvedTheme]);

  return (
    <iframe
      ref={iframeRef}
      src={iframeSrc}
      sandbox="allow-scripts allow-same-origin"
      style={{ height: iframeHeight }}
      className="w-full border-0 rounded-lg bg-background"
      title="MCP App View"
    />
  );
}
