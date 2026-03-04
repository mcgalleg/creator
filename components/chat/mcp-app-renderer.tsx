'use client';

import { useEffect, useRef, useState, useLayoutEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';
import {
  AppBridge,
  PostMessageTransport,
  type McpUiResourceCsp,
  type McpUiResourcePermissions,
} from '@modelcontextprotocol/ext-apps/app-bridge';
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

interface McpAppRendererProps {
  serverUrl: string;
  resourceUri: string;
  toolInput: Record<string, unknown>;
  toolResult: unknown;
  /** Extra sandbox permissions from the connector definition */
  sandboxPermissions?: string;
  /** Called when the App sends a message (ui/message) */
  onMessage?: (text: string) => void;
  /** Called when the App updates model context (ui/update-model-context) */
  onUpdateModelContext?: (ctx: { content?: unknown[]; structuredContent?: Record<string, unknown> }) => void;
  /** Whether the parent chat stream is still active */
  isStreamActive?: boolean;
}

export function McpAppRenderer({
  serverUrl,
  resourceUri,
  toolInput,
  toolResult,
  sandboxPermissions,
  onMessage,
  onUpdateModelContext,
  isStreamActive,
}: McpAppRendererProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const bridgeRef = useRef<AppBridge | null>(null);
  const [iframeHeight, setIframeHeight] = useState(400);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isFullscreenRef = useRef(false);
  const { resolvedTheme } = useTheme();

  // Keep stable refs for values used in the bridge callbacks
  const toolInputRef = useRef(toolInput);
  toolInputRef.current = toolInput;
  const toolResultRef = useRef(toolResult);
  toolResultRef.current = toolResult;
  const themeRef = useRef(resolvedTheme);
  themeRef.current = resolvedTheme;
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;
  const onUpdateModelContextRef = useRef(onUpdateModelContext);
  onUpdateModelContextRef.current = onUpdateModelContext;
  const sandboxPermissionsRef = useRef(sandboxPermissions);
  sandboxPermissionsRef.current = sandboxPermissions;

  // Track whether tool result was sent (for tool-cancelled detection)
  const toolResultSentRef = useRef(false);

  // Sandbox proxy iframe src.
  // When NEXT_PUBLIC_MCP_SANDBOX_ORIGIN is set, load from that origin (true
  // cross-origin isolation). Otherwise fall back to serving from Next.js's
  // public directory on the same origin (works in dev without extra server).
  const sandboxOrigin = process.env.NEXT_PUBLIC_MCP_SANDBOX_ORIGIN || '';
  const iframeSrc = useMemo(() => {
    if (sandboxOrigin) return `${sandboxOrigin}/sandbox-proxy.html`;
    return '/sandbox/sandbox-proxy.html';
  }, [sandboxOrigin]);

  // Metadata fetch URL (JSON endpoint)
  const metadataUrl = useMemo(() => {
    const params = new URLSearchParams({ serverUrl, resourceUri });
    return `/api/connectors/render?${params.toString()}`;
  }, [serverUrl, resourceUri]);

  // If the tool result is an error, show a message instead of a blank iframe
  const mcpResult = (toolResult as Record<string, unknown> | null)?._mcpToolResult as
    | { isError?: boolean; content?: Array<{ type: string; text?: string }> }
    | undefined;
  const isError = mcpResult?.isError ?? false;

  // Set up AppBridge BEFORE the iframe content loads.
  useLayoutEffect(() => {
    if (isError) return;

    const iframe = iframeRef.current;
    if (!iframe) return;

    const contentWindow = iframe.contentWindow;
    if (!contentWindow) return;

    console.log('[McpAppRenderer] Setting up bridge with sandbox proxy');

    const pendingTimers: ReturnType<typeof setTimeout>[] = [];
    toolResultSentRef.current = false;

    // Pre-opened window for export_to_excalidraw. Opened early (close to
    // the user gesture) so popup blockers allow it, then navigated once
    // the MCP server returns the shareable URL.
    let preOpenedWindow: Window | null = null;
    const openedUrls = new Set<string>();
    const rawMessageHandler = (event: MessageEvent) => {
      if (event.source !== contentWindow) return;
      const data = event.data;
      if (data?.jsonrpc !== '2.0') return;

      // Log ALL JSON-RPC requests from the App for diagnostics
      if (data.method) {
        console.log('[McpAppRenderer] Incoming JSON-RPC:', data.method, data.id ? `(id:${data.id})` : '(notification)');
      }

      // Pre-open a blank tab when export_to_excalidraw is called.
      // This runs close to the user's click so popup blockers allow it.
      if (data.method === 'tools/call' && data.params?.name === 'export_to_excalidraw') {
        console.log('[McpAppRenderer] Pre-opening window for export');
        preOpenedWindow = window.open('about:blank', '_blank');
      }

      // Intercept ui/open-link: navigate the pre-opened window if
      // available, otherwise open a new tab. Skip if already opened
      // (e.g. by oncalltool navigating the pre-opened window).
      if (data.method === 'ui/open-link' && data.params?.url) {
        const url = data.params.url as string;
        if (openedUrls.has(url)) {
          console.log('[McpAppRenderer] Skipping already-opened link:', url);
        } else if (preOpenedWindow && !preOpenedWindow.closed) {
          console.log('[McpAppRenderer] Navigating pre-opened window to:', url);
          preOpenedWindow.location.href = url;
          preOpenedWindow = null;
          openedUrls.add(url);
        } else {
          console.log('[McpAppRenderer] Opening link:', url);
          window.open(url, '_blank', 'noopener,noreferrer');
          openedUrls.add(url);
        }
      }
    };
    window.addEventListener('message', rawMessageHandler);

    // Per the SDK docs: pass contentWindow as BOTH target and source.
    const transport = new PostMessageTransport(
      contentWindow,
      contentWindow,
    );

    const currentServerUrl = serverUrl;
    const currentMetadataUrl = metadataUrl;

    const bridge = new AppBridge(
      null,
      { name: 'creator', version: '1.0.0' },
      {
        openLinks: {},
        logging: {},
        serverTools: {},
        serverResources: {},
        message: { text: {} },
        updateModelContext: { text: {}, structuredContent: {} },
      },
      {
        hostContext: {
          theme: themeRef.current === 'dark' ? 'dark' : 'light',
        },
      },
    );

    // Generic helper to proxy MCP requests to the server via our API route.
    const proxyMcpRequest = async (method: string, params?: Record<string, unknown>) => {
      const resp = await fetch('/api/connectors/mcp-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverUrl: currentServerUrl, method, params }),
      });
      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`MCP proxy error (${resp.status}): ${errText}`);
      }
      return resp.json();
    };

    // Start connecting immediately. Handlers set via setters are registered
    // in Protocol's handler map, so they work regardless of connect() timing.
    // onsandboxready awaits this to ensure the transport is ready.
    const connectPromise = bridge.connect(transport).then(() => {
      console.log('[McpAppRenderer] Bridge connected (transport started)');
      // Probe the sandbox proxy to re-trigger sandbox-proxy-ready.
      // Needed for React Strict Mode remount: the iframe DOM persists but
      // the proxy already sent sandbox-proxy-ready during the first mount.
      contentWindow.postMessage({
        jsonrpc: '2.0',
        method: 'ui/notifications/sandbox-proxy-probe',
        params: {},
      }, '*');
    }).catch((err) => {
      console.error('[McpAppRenderer] Bridge connect error:', err);
    });

    bridge.onsizechange = ({ width, height }) => {
      console.log('[McpAppRenderer] Size change:', { width, height });
      if (height != null && !isFullscreenRef.current) {
        setIframeHeight(Math.min(height, 800));
      }
    };

    bridge.onopenlink = async ({ url }) => {
      if (openedUrls.has(url)) {
        openedUrls.delete(url);
        return {};
      }
      window.open(url, '_blank', 'noopener,noreferrer');
      return {};
    };

    bridge.onrequestdisplaymode = async ({ mode }) => {
      console.log('[McpAppRenderer] Display mode requested:', mode);
      if (mode === 'fullscreen') {
        isFullscreenRef.current = true;
        setIsFullscreen(true);
        bridge.setHostContext({ displayMode: 'fullscreen' });
        return { mode: 'fullscreen' as const };
      }
      isFullscreenRef.current = false;
      setIsFullscreen(false);
      bridge.setHostContext({ displayMode: 'inline' });
      return { mode: 'inline' as const };
    };

    bridge.onloggingmessage = ({ level, data }) => {
      console.log(`[McpApp:${level}]`, data);
    };

    // Handle messages from the App (ui/message)
    bridge.onmessage = async ({ content }) => {
      const text = content
        ?.filter((c) => c.type === 'text')
        .map((c) => ('text' in c ? c.text : ''))
        .join('\n');
      if (text) onMessageRef.current?.(text);
      return {};
    };

    // Handle model context updates from the App (ui/update-model-context)
    bridge.onupdatemodelcontext = async ({ content, structuredContent }) => {
      onUpdateModelContextRef.current?.({
        content: content as unknown[] | undefined,
        structuredContent: structuredContent as Record<string, unknown> | undefined,
      });
      return {};
    };

    // Forward MCP server requests from the App through the proxy.
    // tools/list has no setter on AppBridge, so we register directly.
    bridge.setRequestHandler(ListToolsRequestSchema, async (request) => {
      console.log('[McpAppRenderer] Handler: tools/list');
      return proxyMcpRequest('tools/list', request.params as Record<string, unknown>);
    });

    bridge.onlistresources = async (params) => {
      console.log('[McpAppRenderer] Handler: resources/list', params);
      return proxyMcpRequest('resources/list', params as Record<string, unknown>);
    };

    bridge.onlistresourcetemplates = async (params) => {
      console.log('[McpAppRenderer] Handler: resources/templates/list', params);
      return proxyMcpRequest('resources/templates/list', params as Record<string, unknown>);
    };

    bridge.onreadresource = async (params) => {
      console.log('[McpAppRenderer] Handler: resources/read', params);
      return proxyMcpRequest('resources/read', params as Record<string, unknown>);
    };

    bridge.onlistprompts = async (params) => {
      console.log('[McpAppRenderer] Handler: prompts/list', params);
      return proxyMcpRequest('prompts/list', params as Record<string, unknown>);
    };

    // Sandbox proxy ready — fetch metadata and send HTML to sandbox.
    // Must await connectPromise because the sandbox proxy on same origin
    // loads so fast that onsandboxready can fire before connect() resolves.
    bridge.onsandboxready = async () => {
      console.log('[McpAppRenderer] Sandbox proxy ready, waiting for connect...');
      try {
        await connectPromise;
        const resp = await fetch(currentMetadataUrl);
        if (!resp.ok) {
          console.error('[McpAppRenderer] Metadata fetch failed:', resp.status);
          return;
        }
        const metadata: { html: string; csp?: McpUiResourceCsp; permissions?: McpUiResourcePermissions } = await resp.json();
        console.log('[McpAppRenderer] Sending resource to sandbox');
        bridge.sendSandboxResourceReady({
          html: metadata.html,
          sandbox: sandboxPermissionsRef.current || undefined,
          csp: metadata.csp,
          permissions: metadata.permissions,
        });
      } catch (err) {
        console.error('[McpAppRenderer] Failed to fetch metadata:', err);
      }
    };

    // Proxy tool calls from the App back to the MCP server
    bridge.oncalltool = async (params) => {
      console.log('[McpAppRenderer] Proxying tool call to server:', params.name);
      try {
        const result = await proxyMcpRequest('tools/call', params as Record<string, unknown>);

        // For export_to_excalidraw, navigate the pre-opened window and
        // mark the URL as opened so the subsequent ui/open-link from the
        // App doesn't open a duplicate tab.
        if (params.name === 'export_to_excalidraw' && !result.isError) {
          const url = result.content
            ?.find((c: { type: string; text?: string }) => c.type === 'text' && c.text?.startsWith('http'))
            ?.text;
          if (url) {
            if (preOpenedWindow && !preOpenedWindow.closed) {
              console.log('[McpAppRenderer] Navigating pre-opened window to:', url);
              preOpenedWindow.location.href = url;
              preOpenedWindow = null;
            }
            openedUrls.add(url);
          }
        }

        // Close pre-opened window on error
        if (result.isError && preOpenedWindow && !preOpenedWindow.closed) {
          preOpenedWindow.close();
          preOpenedWindow = null;
        }

        return result;
      } catch (err) {
        console.error('[McpAppRenderer] Tool proxy fetch error:', err);
        if (preOpenedWindow && !preOpenedWindow.closed) {
          preOpenedWindow.close();
          preOpenedWindow = null;
        }
        return {
          content: [{ type: 'text' as const, text: `Tool "${params.name}" call failed` }],
          isError: true,
        };
      }
    };

    // Helper to send tool input + result to the App via the bridge.
    const sendToolData = () => {
      bridge.sendToolInput({ arguments: toolInputRef.current });

      const output = toolResultRef.current as Record<string, unknown> | null;
      if (output?._mcpToolResult) {
        const callResult = output._mcpToolResult as Record<string, unknown>;
        bridge.sendToolResult({
          content: (callResult.content ?? []) as Array<{ type: 'text'; text: string }>,
          structuredContent: callResult.structuredContent as Record<string, unknown> | undefined,
        });
      } else if (output) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _mcpAppUi, _mcpToolResult, ...rest } = output;
        bridge.sendToolResult({
          content: [{ type: 'text', text: JSON.stringify(rest) }],
        });
      }
      toolResultSentRef.current = true;
    };

    bridge.oninitialized = () => {
      console.log('[McpAppRenderer] Bridge initialized! Sending tool data...');

      // Defer to let the App's React component register ontoolinput/
      // ontoolresult handlers (they mount in a useEffect after connect).
      // Single send with a small delay is sufficient — the previous
      // duplicate send at 500ms caused Excalidraw to re-render from
      // scratch, blocking the main thread for several seconds.
      pendingTimers.push(setTimeout(() => {
        console.log('[McpAppRenderer] Sending tool data (deferred)');
        sendToolData();
      }, 50));
    };

    // Listen for iframe load
    const onIframeLoad = () => {
      console.log('[McpAppRenderer] iframe loaded');
    };
    iframe.addEventListener('load', onIframeLoad);

    bridgeRef.current = bridge;

    // Cleanup: graceful teardown then close
    return () => {
      pendingTimers.forEach(clearTimeout);
      window.removeEventListener('message', rawMessageHandler);
      iframe.removeEventListener('load', onIframeLoad);
      if (preOpenedWindow && !preOpenedWindow.closed) {
        preOpenedWindow.close();
        preOpenedWindow = null;
      }
      const b = bridge;
      b.teardownResource({}, { timeout: 3000 })
        .catch(() => {}) // timeout or error — proceed anyway
        .finally(() => b.close().catch(() => {}));
      bridgeRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iframeSrc, metadataUrl, isError]);

  // Tool cancelled detection: when stream stops without result being sent
  const prevStreamRef = useRef(isStreamActive);
  useEffect(() => {
    if (prevStreamRef.current && !isStreamActive && !toolResultSentRef.current && bridgeRef.current) {
      bridgeRef.current.sendToolCancelled({ reason: 'User stopped generation' });
    }
    prevStreamRef.current = isStreamActive;
  }, [isStreamActive]);

  // Update theme when it changes
  useEffect(() => {
    if (bridgeRef.current && resolvedTheme) {
      bridgeRef.current.setHostContext({
        theme: resolvedTheme === 'dark' ? 'dark' : 'light',
      });
    }
  }, [resolvedTheme]);

  // Escape key exits fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        isFullscreenRef.current = false;
        setIsFullscreen(false);
        bridgeRef.current?.setHostContext({ displayMode: 'inline' });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFullscreen]);

  // Error state — show inline instead of iframe
  if (isError) {
    const errorText = mcpResult?.content
      ?.filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('\n') ?? 'Tool call failed';
    return (
      <div className="w-full rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        {errorText}
      </div>
    );
  }

  return (
    <>
      {/* Fullscreen exit button */}
      {isFullscreen && (
        <button
          onClick={() => {
            isFullscreenRef.current = false;
            setIsFullscreen(false);
            bridgeRef.current?.setHostContext({ displayMode: 'inline' });
          }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] rounded-md bg-muted px-3 py-1.5 text-sm font-medium shadow-md hover:bg-muted/80"
        >
          Exit fullscreen
        </button>
      )}
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        sandbox="allow-scripts allow-same-origin"
        style={isFullscreen ? undefined : { height: iframeHeight }}
        className={
          isFullscreen
            ? 'fixed inset-0 z-50 h-full w-full border-0 bg-background'
            : 'w-full border-0 rounded-lg bg-background'
        }
        title="MCP App View"
      />
    </>
  );
}
