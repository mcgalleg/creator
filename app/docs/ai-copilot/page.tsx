import { Badge } from "@/components/ui/badge";
import { Bot } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Copilot — Astriq",
  description:
    "Ask questions about your TikTok data in plain English and get interactive charts and actionable insights.",
};

export default function AiCopilotPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-4">
        <Badge variant="secondary">
          <Bot className="size-3" />
          AI Copilot
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">AI Copilot</h1>
        <p className="text-lg text-muted-foreground">
          Ask questions about your TikTok data in plain English. The AI Copilot
          analyzes your content, generates charts, and provides actionable
          insights through a conversational interface.
        </p>
      </div>

      {/* Content */}
      <div className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-lg font-medium">Natural Language Queries</h2>
          <p className="text-sm text-muted-foreground">
            Ask anything about your data — &quot;What was my best performing
            video this month?&quot;, &quot;Show me engagement trends over the
            last 30 days&quot;, or &quot;Which posting time gets the most
            views?&quot;. The AI understands context and delivers precise
            answers.
          </p>
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-medium">Chart Generation</h2>
          <p className="text-sm text-muted-foreground">
            The Copilot can generate interactive charts and visualizations on the
            fly. Request bar charts, line graphs, pie charts, and more to
            visualize your data exactly how you need it.
          </p>
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-medium">Streaming Responses</h2>
          <p className="text-sm text-muted-foreground">
            Responses stream in real-time so you can start reading insights
            immediately. Complex analyses run in the background while you
            continue interacting with the Copilot.
          </p>
        </div>
      </div>
    </div>
  );
}
