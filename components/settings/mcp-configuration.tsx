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
import { Plug, Copy, Check } from "lucide-react";

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
  const mcpUrl = "https://astriq.ai/api/mcp-app";

  const claudeDesktopConfig = JSON.stringify(
    {
      mcpServers: {
        astriq: {
          url: mcpUrl,
        },
      },
    },
    null,
    2
  );

  const claudeCodeCommand = `claude mcp add astriq ${mcpUrl}`;

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
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Server URL</p>
          <div className="flex items-center gap-2 rounded-md bg-muted p-3">
            <code className="text-sm flex-1 break-all">{mcpUrl}</code>
            <CopyButton text={mcpUrl} />
          </div>
          <p className="text-xs text-muted-foreground">
            Works with all MCP clients — Claude Desktop, Claude Code, ChatGPT, and more
          </p>
        </div>

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
          code={`Server URL: ${mcpUrl}\nTransport: Streamable HTTP`}
        />

      </CardContent>
    </Card>
  );
}
