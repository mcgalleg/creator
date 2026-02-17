import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plug,
  BookOpen,
  Monitor,
  MessageSquare,
  Terminal,
  Sparkles,
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  Hash,
  Globe,
  HelpCircle,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MCP Apps Documentation — Not a Bot",
  description:
    "Connect Claude Desktop, ChatGPT, or any MCP-compatible AI client to your TikTok analytics. Setup guides, available visualizations, and example queries.",
};

const VISUALIZATIONS = [
  {
    category: "Overview",
    icon: BarChart3,
    items: [
      { name: "Account Overview", description: "Key metrics dashboard with followers, plays, engagement rate, likes, shares, saves" },
      { name: "Connected Accounts", description: "List of all connected TikTok accounts with status and last sync time" },
    ],
  },
  {
    category: "Trends & Growth",
    icon: TrendingUp,
    items: [
      { name: "Engagement Trends", description: "Line chart of likes, comments, shares, and plays over time" },
      { name: "Follower Growth", description: "Follower count change over time with growth rate" },
      { name: "Content Velocity", description: "Posting frequency trends and output consistency" },
    ],
  },
  {
    category: "Content Performance",
    icon: BarChart3,
    items: [
      { name: "Recent Posts", description: "Sortable table of latest posts with all engagement metrics" },
      { name: "Top Performing Posts", description: "Best posts ranked by likes, comments, shares, or plays" },
      { name: "Viral Posts", description: "Posts with the highest share-to-view ratio" },
      { name: "Underperforming Content", description: "Posts below your average engagement rate" },
    ],
  },
  {
    category: "Posting Strategy",
    icon: Clock,
    items: [
      { name: "Posting Heatmap", description: "Hour-by-day grid showing when your posts get the most engagement" },
      { name: "Best Time to Post", description: "Optimal posting windows based on historical performance" },
      { name: "Content Calendar", description: "Visual timeline of your posting schedule" },
    ],
  },
  {
    category: "Comments & Audience",
    icon: MessageSquare,
    items: [
      { name: "Comment Sentiment", description: "Breakdown of positive, neutral, and negative comment sentiment" },
      { name: "Top Commenters", description: "Most active commenters on your content (superfans)" },
      { name: "Comment Trends", description: "Comment volume and sentiment changes over time" },
      { name: "Comment Word Cloud", description: "Most frequently used words across your comments" },
    ],
  },
  {
    category: "Comparisons",
    icon: Users,
    items: [
      { name: "Account Comparison", description: "Side-by-side metrics comparison between your connected accounts" },
      { name: "Period Comparison", description: "Compare performance between two time periods" },
    ],
  },
  {
    category: "Hashtags & Sounds",
    icon: Hash,
    items: [
      { name: "Hashtag Performance", description: "Which hashtags drive the most engagement for your content" },
      { name: "Hashtag Trends", description: "How your hashtag usage and performance change over time" },
      { name: "Sound Analytics", description: "Performance breakdown by audio/sound used in your videos" },
      { name: "Trending Sounds", description: "Sounds that are driving the best engagement rates" },
    ],
  },
  {
    category: "Audience & Reach",
    icon: Globe,
    items: [
      { name: "Audience Geography", description: "Where your commenters and engaged audience are located" },
      { name: "Engagement Distribution", description: "How engagement is distributed across your content library" },
      { name: "Reach Analysis", description: "Views-to-engagement funnel analysis" },
    ],
  },
];

const EXAMPLE_QUESTIONS = [
  {
    category: "Overview",
    questions: [
      "How am I doing overall?",
      "Show me my dashboard",
      "Which accounts are connected?",
    ],
  },
  {
    category: "Trends",
    questions: [
      "Show me my engagement trends for the last 30 days",
      "How is my follower growth this month?",
      "Am I posting more or less than last month?",
    ],
  },
  {
    category: "Content Performance",
    questions: [
      "What are my top 5 posts by likes?",
      "Which videos went viral?",
      "Show me posts that underperformed",
      "What are my most recent videos?",
    ],
  },
  {
    category: "Posting Strategy",
    questions: [
      "When is the best time for me to post?",
      "Show me a posting heatmap",
      "How often am I posting?",
    ],
  },
  {
    category: "Comments",
    questions: [
      "What is the sentiment of my comments?",
      "Who are my biggest fans?",
      "How are my comment trends looking?",
    ],
  },
  {
    category: "Comparisons",
    questions: [
      "Compare my accounts side by side",
      "How did this week compare to last week?",
    ],
  },
  {
    category: "Hashtags & Sounds",
    questions: [
      "Which hashtags work best for me?",
      "What sounds are trending in my content?",
      "Show me hashtag performance over time",
    ],
  },
  {
    category: "Audience",
    questions: [
      "Where is my audience located?",
      "Show me my engagement distribution",
    ],
  },
];

const CLAUDE_DESKTOP_CONFIG = `{
  "mcpServers": {
    "not-a-bot": {
      "url": "https://notabot.cc/api/mcp-app/sse"
    }
  }
}`;

const CLAUDE_CODE_COMMAND = `claude mcp add not-a-bot https://notabot.cc/api/mcp-app/sse`;

export default function McpDocsPage() {
  return (
    <div className="space-y-12">
      {/* Page Header */}
      <div className="space-y-4">
        <Badge variant="secondary">
          <Plug className="size-3" />
          MCP Apps
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">
          MCP Apps Documentation
        </h1>
        <p className="text-lg text-muted-foreground">
          Connect your own AI client to query TikTok analytics with natural
          language. Works with Claude Desktop, ChatGPT, Claude Code, and any
          MCP-compatible client.
        </p>
      </div>

      <Separator />

      {/* Overview */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Plug className="size-5 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Overview
          </h2>
        </div>
        <p className="text-muted-foreground">
          MCP (Model Context Protocol) is an open standard that lets AI
          assistants connect to external data sources. Not a Bot&apos;s MCP
          server exposes your TikTok analytics as tools that any
          MCP-compatible AI client can use.
        </p>
        <div className="space-y-4">
          <h3 className="text-lg font-medium">How It Works</h3>
          <p className="text-sm text-muted-foreground">
            When you ask a question in your AI client, the LLM automatically
            selects the right analytics tool and parameters. The MCP server
            queries your data and returns rich, interactive visualizations
            directly in the chat. There are no commands to memorize — just
            ask in plain English.
          </p>
          <h3 className="text-lg font-medium">Zero AI Cost on Our End</h3>
          <p className="text-sm text-muted-foreground">
            Your AI client handles all the reasoning. Not a Bot&apos;s MCP
            server is a pure data pipe — it receives the tool call, queries
            your analytics database, and returns structured data. You only
            pay for sync credits to keep your data fresh.
          </p>
        </div>
      </section>

      <Separator />

      {/* Getting Started */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="size-5 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Getting Started
          </h2>
        </div>
        <p className="text-muted-foreground">
          Get connected in three steps. No subscription required — activate
          for free and buy sync credits as you need them.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                1. Activate MCP Apps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Sign up and activate the MCP Apps plan for free. This gives
                you MCP server access, 10 connected accounts, and 90-day
                data retention.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                2. Buy a Sync Pack
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Purchase sync credits to pull data from TikTok. Connect your
                TikTok account and run your first sync to populate your
                analytics.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                3. Connect Your Client
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Add the MCP server URL to Claude Desktop, ChatGPT, or Claude
                Code. You will be prompted to authorize with your Not a Bot
                account.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* Claude Desktop Setup */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Monitor className="size-5 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Claude Desktop Setup
          </h2>
        </div>
        <p className="text-muted-foreground">
          Add Not a Bot to your Claude Desktop configuration file. Claude
          will prompt you to authorize when you first use it.
        </p>
        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm overflow-x-auto">
            <pre className="text-muted-foreground">{CLAUDE_DESKTOP_CONFIG}</pre>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">macOS:</strong> Edit{" "}
              <code className="rounded bg-muted px-1 py-0.5">
                ~/Library/Application Support/Claude/claude_desktop_config.json
              </code>
            </p>
            <p>
              <strong className="text-foreground">Windows:</strong> Edit{" "}
              <code className="rounded bg-muted px-1 py-0.5">
                %APPDATA%\Claude\claude_desktop_config.json
              </code>
            </p>
          </div>
        </div>
      </section>

      <Separator />

      {/* ChatGPT Setup */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <MessageSquare className="size-5 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            ChatGPT Setup
          </h2>
        </div>
        <p className="text-muted-foreground">
          Connect Not a Bot as an MCP server in ChatGPT&apos;s settings.
        </p>
        <div className="space-y-3 text-sm text-muted-foreground">
          <ol className="list-decimal list-inside space-y-2">
            <li>Open ChatGPT and go to <strong className="text-foreground">Settings</strong></li>
            <li>Navigate to <strong className="text-foreground">Connected Apps</strong> or <strong className="text-foreground">MCP Servers</strong></li>
            <li>Click <strong className="text-foreground">Add Server</strong> and enter the URL: <code className="rounded bg-muted px-1 py-0.5">https://notabot.cc/api/mcp-app/sse</code></li>
            <li>Authorize with your Not a Bot account when prompted</li>
          </ol>
        </div>
      </section>

      <Separator />

      {/* Claude Code Setup */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Terminal className="size-5 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Claude Code Setup
          </h2>
        </div>
        <p className="text-muted-foreground">
          Add the MCP server with a single CLI command.
        </p>
        <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm overflow-x-auto">
          <pre className="text-muted-foreground">{CLAUDE_CODE_COMMAND}</pre>
        </div>
      </section>

      <Separator />

      {/* Just Ask */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="size-5 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Just Ask
          </h2>
        </div>
        <p className="text-muted-foreground">
          There are no commands to memorize. Ask questions in natural
          language and your AI client automatically selects the right
          analytics tool and visualization.
        </p>
        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <div className="flex justify-end">
              <div className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-muted-foreground max-w-[80%]">
                &quot;Who are my biggest fans?&quot;
              </div>
            </div>
            <div className="flex justify-start">
              <div className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground max-w-[80%]">
                Your AI selects <code className="rounded bg-background px-1 py-0.5 text-xs">show_comments(view: &quot;top_commenters&quot;)</code> and
                renders an interactive top commenters visualization with engagement
                metrics for each superfan.
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            The AI understands context across all 30+ visualizations. Ask
            about trends, comparisons, posting strategy, audience
            demographics, hashtag performance, and more — the right chart
            appears automatically.
          </p>
        </div>
      </section>

      <Separator />

      {/* Available Visualizations */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <BarChart3 className="size-5 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Available Visualizations
          </h2>
        </div>
        <p className="text-muted-foreground">
          Over 30 analytics visualizations organized by category. Each
          renders as an interactive chart, table, or card directly in your AI
          client.
        </p>
        <div className="space-y-8">
          {VISUALIZATIONS.map((group) => {
            const GroupIcon = group.icon;
            return (
              <div key={group.category} className="space-y-3">
                <div className="flex items-center gap-2">
                  <GroupIcon className="size-4 text-primary" />
                  <h3 className="text-lg font-medium">{group.category}</h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {group.items.map((item) => (
                    <Card key={item.name}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{item.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Separator />

      {/* Example Questions */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <MessageSquare className="size-5 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Example Questions
          </h2>
        </div>
        <p className="text-muted-foreground">
          Try these questions to get started. Your AI client will
          automatically pick the right visualization.
        </p>
        <div className="grid gap-6 sm:grid-cols-2">
          {EXAMPLE_QUESTIONS.map((group) => (
            <div key={group.category} className="space-y-2">
              <h3 className="text-sm font-medium">{group.category}</h3>
              <ul className="space-y-1.5">
                {group.questions.map((q) => (
                  <li
                    key={q}
                    className="text-sm text-muted-foreground flex items-start gap-2"
                  >
                    <span className="text-primary mt-0.5">&bull;</span>
                    &quot;{q}&quot;
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* FAQ */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <HelpCircle className="size-5 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-base font-medium">
              Do I need a subscription to use MCP Apps?
            </h3>
            <p className="text-sm text-muted-foreground">
              No. MCP Apps is free to activate. You only pay for sync credit
              packs to pull data from TikTok. There is no monthly fee.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-medium">
              Which AI clients are supported?
            </h3>
            <p className="text-sm text-muted-foreground">
              Any client that supports the Model Context Protocol (MCP).
              This includes Claude Desktop, ChatGPT, Claude Code, and other
              MCP-compatible tools. The server uses standard SSE transport.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-medium">
              How fresh is the data?
            </h3>
            <p className="text-sm text-muted-foreground">
              Data freshness depends on when you last synced. You can
              trigger a sync from the MCP Hub or through the MCP server
              itself. Each sync uses credits — full sync uses 3 credits,
              incremental sync uses 1 credit.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-medium">
              How does the AI know which visualization to show?
            </h3>
            <p className="text-sm text-muted-foreground">
              The MCP server exposes ~10 tools organized by analytics
              category. Each tool has a detailed description that your AI
              client reads to understand when to use it. The AI matches your
              natural language question to the right tool and parameters
              automatically.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-medium">
              Does this use my AI tokens?
            </h3>
            <p className="text-sm text-muted-foreground">
              No. MCP Apps uses your own AI client (Claude Desktop, ChatGPT,
              etc.), so the AI reasoning happens on your client&apos;s plan,
              not ours. You only consume Not a Bot sync credits for data
              syncing.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-medium">
              Can I also use the web dashboard?
            </h3>
            <p className="text-sm text-muted-foreground">
              MCP Apps gives you MCP server access only. For the full web
              dashboard with AI Analytics Assistant, Canvas workspace, and
              drag-and-drop widgets, upgrade to the Creator ($14.99/mo) or
              Pro ($29.99/mo) plan. Both include MCP access.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-medium">
              How do I connect multiple TikTok accounts?
            </h3>
            <p className="text-sm text-muted-foreground">
              MCP Apps supports up to 10 connected TikTok accounts. Connect
              them through the MCP Hub at notabot.cc after signing in. Each
              account can be synced independently.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
