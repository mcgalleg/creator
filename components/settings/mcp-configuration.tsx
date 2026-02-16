"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plug, Copy, Check, ExternalLink } from "lucide-react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 shrink-0"
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}

function ConfigSnippet({ label, code }: { label: string; code: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs">
          {label}
        </Badge>
        <CopyButton text={code} />
      </div>
      <pre className="rounded-md bg-muted p-3 text-xs overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
}

interface McpConnectionSetupProps {
  compact?: boolean;
}

export function McpConnectionSetup({ compact = false }: McpConnectionSetupProps) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  // MCP App endpoint: interactive UI with charts (for hosts that support MCP Apps)
  const appUrl = `${origin}/api/mcp-app/mcp`;
  // Plain endpoint: text-only tools (for CLI and non-UI hosts)
  const analyticsUrl = `${origin}/api/analytics/mcp`;

  const claudeDesktopConfig = JSON.stringify(
    {
      mcpServers: {
        "creator-analytics": {
          url: appUrl,
        },
      },
    },
    null,
    2
  );

  const claudeCodeCommand = `claude mcp add creator-analytics ${analyticsUrl}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plug className="h-5 w-5 text-primary" />
          {compact ? "Connect External AI Clients" : "MCP Connection Setup"}
        </CardTitle>
        <CardDescription>
          {compact
            ? "Connect Claude Desktop, ChatGPT, or other MCP-compatible AI clients"
            : "Connect your AI client to query your TikTok analytics"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Interactive UI endpoint */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">Interactive Dashboard</p>
            <Badge variant="secondary" className="text-[10px]">Charts &amp; Visualizations</Badge>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-muted p-3">
            <code className="text-sm flex-1 break-all">{appUrl}</code>
            <CopyButton text={appUrl} />
          </div>
          <p className="text-xs text-muted-foreground">
            For Claude Desktop and other MCP Apps-compatible hosts
          </p>
        </div>

        {/* Text-only endpoint */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">Text-Only API</p>
            <Badge variant="outline" className="text-[10px]">CLI &amp; Agents</Badge>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-muted p-3">
            <code className="text-sm flex-1 break-all">{analyticsUrl}</code>
            <CopyButton text={analyticsUrl} />
          </div>
          <p className="text-xs text-muted-foreground">
            For Claude Code, ChatGPT, and other text-based clients
          </p>
        </div>

        {/* Config snippets */}
        <ConfigSnippet
          label="Claude Desktop"
          code={claudeDesktopConfig}
        />

        <ConfigSnippet
          label="Claude Code"
          code={claudeCodeCommand}
        />

        <ConfigSnippet
          label="ChatGPT / Other"
          code={`Server URL: ${analyticsUrl}\nTransport: Streamable HTTP`}
        />

        {/* Docs link */}
        <Button variant="outline" size="sm" asChild className="w-full">
          <a href="/docs/mcp" target="_blank" rel="noopener noreferrer">
            View full documentation
            <ExternalLink className="ml-2 h-3.5 w-3.5" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
