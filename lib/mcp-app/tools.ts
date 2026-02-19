import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getCurrentUserId } from "./auth";
import {
  fetchPosts,
  fetchTopContent,
  fetchViralPosts,
  fetchUnderperforming,
  fetchEngagementTrends,
  fetchEngagementRate,
  fetchFollowerGrowth,
  fetchPostingFrequency,
  fetchRecentComments,
  fetchTopCommenters,
  fetchCommentActivity,
  fetchAudienceLoyalty,
  fetchPeriodComparison,
  fetchAccountComparison,
  fetchAudienceGeography,
  fetchAudienceLanguages,
  fetchCreatorEngagement,
  getAnalyticsSchema,
  executeReadQuery,
} from "./data";

const RESOURCE_URI = "ui://creator/analytics.html";

export function registerAllTools(server: McpServer) {
  // ── 1. Content & Posts ──
  registerAppTool(server, "show_content", {
    title: "Show Content & Posts",
    description: "Show posts in different views: recent posts (sortable table), top performing posts by metric, viral posts with highest share rates, or underperforming content below average engagement. Use when the user asks about their videos, content performance, best/worst posts, or what went viral.",
    inputSchema: {
      view: z.enum(["recent", "top", "viral", "underperforming"]).describe("'recent' = latest posts; 'top' = ranked by metric; 'viral' = highest share rate; 'underperforming' = below average"),
      metric: z.enum(["likes", "comments", "shares", "plays"]).optional().describe("Ranking metric (for 'top' view)"),
      sortBy: z.enum(["likes", "comments", "shares", "plays", "postedAt"]).optional().describe("Sort column (for 'recent' view)"),
      sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
      limit: z.number().optional().default(10),
    },
    _meta: { ui: { resourceUri: RESOURCE_URI } },
  }, async (args, { authInfo }) => {
    const userId = await getCurrentUserId(authInfo);
    switch (args.view) {
      case "recent": {
        const data = await fetchPosts(userId, args);
        return { content: [{ type: "text" as const, text: `Showing ${data.posts.length} of ${data.total} posts.` }], structuredContent: { _type: "recent_posts", ...data } };
      }
      case "top": {
        const data = await fetchTopContent(userId, { metric: args.metric || "likes", limit: args.limit });
        return { content: [{ type: "text" as const, text: `Top ${data.posts.length} posts by ${args.metric || "likes"}.` }], structuredContent: { _type: "top_content", ...data } };
      }
      case "viral": {
        const data = await fetchViralPosts(userId, { limit: args.limit });
        return { content: [{ type: "text" as const, text: `Top ${data.posts.length} viral posts.` }], structuredContent: { _type: "viral_posts", ...data } };
      }
      case "underperforming": {
        const data = await fetchUnderperforming(userId, { limit: args.limit });
        return { content: [{ type: "text" as const, text: `${data.posts.length} underperforming posts.` }], structuredContent: { _type: "underperforming", ...data } };
      }
    }
  });

  // ── 2. Trends ──
  registerAppTool(server, "show_trends", {
    title: "Show Trend Charts",
    description: "Show line charts of metrics over time: engagement (likes/comments/shares/plays), follower growth, engagement rate, or posting frequency. Use when the user asks about trends, growth over time, daily/weekly/monthly performance, how often they post.",
    inputSchema: {
      metric: z.enum(["engagement", "followers", "engagement_rate", "posting_frequency"]).describe("Which trend to chart"),
      period: z.enum(["day", "week", "month"]).optional().default("week").describe("Time granularity"),
      count: z.number().optional().default(12).describe("Number of periods to show"),
    },
    _meta: { ui: { resourceUri: RESOURCE_URI } },
  }, async (args, { authInfo }) => {
    const userId = await getCurrentUserId(authInfo);
    switch (args.metric) {
      case "engagement": {
        const data = await fetchEngagementTrends(userId, args);
        return { content: [{ type: "text" as const, text: `Engagement trends: ${args.count} ${args.period}s.` }], structuredContent: { _type: "engagement_trends", ...data } };
      }
      case "followers": {
        const data = await fetchFollowerGrowth(userId, args);
        return { content: [{ type: "text" as const, text: `Follower growth over ${args.count} ${args.period}s.` }], structuredContent: { _type: "follower_growth", ...data } };
      }
      case "engagement_rate": {
        const data = await fetchEngagementRate(userId, args);
        return { content: [{ type: "text" as const, text: `Engagement rate trend.` }], structuredContent: { _type: "engagement_rate", ...data } };
      }
      case "posting_frequency": {
        const data = await fetchPostingFrequency(userId);
        return { content: [{ type: "text" as const, text: `Posting frequency by day of week.` }], structuredContent: { _type: "posting_frequency", ...data } };
      }
    }
  });

  // ── 3. Comments & Community ──
  registerAppTool(server, "show_comments", {
    title: "Show Comments & Community",
    description: "Show comment analytics: recent comments feed, top commenters/superfans ranked by frequency and influence, comment activity over time, or audience loyalty (repeat vs one-time commenters). Use when the user asks about comments, feedback, superfans, top commenters, loyal followers, or what people are saying.",
    inputSchema: {
      view: z.enum(["recent", "top_commenters", "activity", "loyalty"]).describe("'recent' = latest comments; 'top_commenters' = superfans by frequency; 'activity' = comments over time; 'loyalty' = repeat vs one-time"),
      limit: z.number().optional().default(20),
      period: z.enum(["day", "week", "month"]).optional().default("week").describe("Time granularity (for 'activity' view)"),
    },
    _meta: { ui: { resourceUri: RESOURCE_URI } },
  }, async (args, { authInfo }) => {
    const userId = await getCurrentUserId(authInfo);
    switch (args.view) {
      case "recent": {
        const data = await fetchRecentComments(userId, { limit: args.limit });
        return { content: [{ type: "text" as const, text: `${data.comments.length} recent comments.` }], structuredContent: { _type: "recent_comments", ...data } };
      }
      case "top_commenters": {
        const data = await fetchTopCommenters(userId, { limit: args.limit });
        return { content: [{ type: "text" as const, text: `Top ${data.commenters.length} commenters.` }], structuredContent: { _type: "top_commenters", ...data } };
      }
      case "activity": {
        const data = await fetchCommentActivity(userId, { period: args.period });
        return { content: [{ type: "text" as const, text: `Comment activity over time.` }], structuredContent: { _type: "comment_activity", ...data } };
      }
      case "loyalty": {
        const data = await fetchAudienceLoyalty(userId);
        return { content: [{ type: "text" as const, text: `Audience loyalty: ${data.loyaltyRate}% repeat commenters.` }], structuredContent: { _type: "audience_loyalty", ...data } };
      }
    }
  });

  // ── 4. Comparisons ──
  registerAppTool(server, "show_comparisons", {
    title: "Compare Periods or Accounts",
    description: "Compare metrics between two time periods (week over week, month over month) or across multiple TikTok accounts. Use when the user asks to compare this week vs last, month over month, or benchmark accounts against each other.",
    inputSchema: {
      type: z.enum(["period", "accounts"]).describe("'period' = compare two date ranges; 'accounts' = compare multiple accounts"),
      period1Start: z.string().optional().describe("ISO date (for period comparison)"),
      period1End: z.string().optional().describe("ISO date (for period comparison)"),
      period2Start: z.string().optional().describe("ISO date (for period comparison)"),
      period2End: z.string().optional().describe("ISO date (for period comparison)"),
      accountIds: z.array(z.string()).optional().describe("Account IDs to compare (for account comparison, min 2)"),
    },
    _meta: { ui: { resourceUri: RESOURCE_URI } },
  }, async (args, { authInfo }) => {
    const userId = await getCurrentUserId(authInfo);
    switch (args.type) {
      case "period": {
        const data = await fetchPeriodComparison(userId, args);
        return { content: [{ type: "text" as const, text: `Period comparison complete.` }], structuredContent: { _type: "period_comparison", ...data } };
      }
      case "accounts": {
        const data = await fetchAccountComparison(userId, { accountIds: args.accountIds! });
        return { content: [{ type: "text" as const, text: `Comparing ${args.accountIds!.length} accounts.` }], structuredContent: { _type: "account_comparison", ...data } };
      }
    }
  });

  // ── 5. Audience ──
  registerAppTool(server, "show_audience", {
    title: "Show Audience Demographics",
    description: "Show audience demographics: geographic distribution of commenters by country, comment language distribution, or creator engagement rate (how often you like/reply to comments). Use when the user asks where their audience is from, what languages they speak, or how responsive they are.",
    inputSchema: {
      view: z.enum(["geography", "languages", "engagement"]).describe("'geography' = commenter countries; 'languages' = comment languages; 'engagement' = creator response rate"),
    },
    _meta: { ui: { resourceUri: RESOURCE_URI } },
  }, async (args, { authInfo }) => {
    const userId = await getCurrentUserId(authInfo);
    switch (args.view) {
      case "geography": {
        const data = await fetchAudienceGeography(userId);
        return { content: [{ type: "text" as const, text: `Audience from ${data.regions.length} regions.` }], structuredContent: { _type: "audience_geography", ...data } };
      }
      case "languages": {
        const data = await fetchAudienceLanguages(userId);
        return { content: [{ type: "text" as const, text: `${data.languages.length} languages detected.` }], structuredContent: { _type: "audience_languages", ...data } };
      }
      case "engagement": {
        const data = await fetchCreatorEngagement(userId);
        return { content: [{ type: "text" as const, text: `Creator engagement rate: ${data.likedRate}%` }], structuredContent: { _type: "creator_engagement", ...data } };
      }
    }
  });

  // ══ APP-ONLY INTERACTIVE TOOLS (hidden from LLM) ══

  // Pagination/sorting for post tables
  registerAppTool(server, "fetch_posts", {
    description: "Fetch posts with sorting and pagination",
    inputSchema: {
      sortBy: z.enum(["likes", "comments", "shares", "plays", "postedAt"]).optional(),
      sortOrder: z.enum(["asc", "desc"]).optional(),
      limit: z.number().optional().default(10),
      offset: z.number().optional().default(0),
    },
    _meta: { ui: { resourceUri: RESOURCE_URI, visibility: ["app"] } },
  }, async (args, { authInfo }) => {
    const userId = await getCurrentUserId(authInfo);
    const data = await fetchPosts(userId, args);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data) }],
      structuredContent: { _type: "recent_posts", ...data },
    };
  });

  // Period/count changes for trend charts
  registerAppTool(server, "fetch_trends", {
    description: "Fetch trend data with specific period and count",
    inputSchema: {
      trendType: z.enum(["engagement", "follower_growth", "engagement_rate", "comment_activity"]),
      period: z.enum(["day", "week", "month"]),
      count: z.number().optional().default(12),
    },
    _meta: { ui: { resourceUri: RESOURCE_URI, visibility: ["app"] } },
  }, async (args, { authInfo }) => {
    const userId = await getCurrentUserId(authInfo);
    switch (args.trendType) {
      case "engagement": {
        const data = await fetchEngagementTrends(userId, args);
        return { content: [{ type: "text" as const, text: JSON.stringify(data) }], structuredContent: { _type: "engagement_trends", ...data } };
      }
      case "follower_growth": {
        const data = await fetchFollowerGrowth(userId, args);
        return { content: [{ type: "text" as const, text: JSON.stringify(data) }], structuredContent: { _type: "follower_growth", ...data } };
      }
      case "engagement_rate": {
        const data = await fetchEngagementRate(userId, args);
        return { content: [{ type: "text" as const, text: JSON.stringify(data) }], structuredContent: { _type: "engagement_rate", ...data } };
      }
      case "comment_activity": {
        const data = await fetchCommentActivity(userId, { period: args.period });
        return { content: [{ type: "text" as const, text: JSON.stringify(data) }], structuredContent: { _type: "comment_activity", ...data } };
      }
    }
  });

  // Metric switching for top content
  registerAppTool(server, "fetch_top_content", {
    description: "Fetch top content by a specific metric",
    inputSchema: {
      metric: z.enum(["likes", "comments", "shares", "plays"]),
      limit: z.number().optional().default(5),
    },
    _meta: { ui: { resourceUri: RESOURCE_URI, visibility: ["app"] } },
  }, async (args, { authInfo }) => {
    const userId = await getCurrentUserId(authInfo);
    const data = await fetchTopContent(userId, args);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data) }],
      structuredContent: { _type: "top_content", ...data },
    };
  });

  // Comment pagination
  registerAppTool(server, "fetch_comments", {
    description: "Fetch comments with pagination",
    inputSchema: {
      limit: z.number().optional().default(20),
      offset: z.number().optional().default(0),
    },
    _meta: { ui: { resourceUri: RESOURCE_URI, visibility: ["app"] } },
  }, async (args, { authInfo }) => {
    const userId = await getCurrentUserId(authInfo);
    const data = await fetchRecentComments(userId, args);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data) }],
      structuredContent: { _type: "recent_comments", ...data },
    };
  });

  // ── Generic Query Tools ──

  registerAppTool(server, "describe_tables", {
    description:
      "Returns the full database schema with detailed column types and relationships. " +
      "Call this before using query_data to understand what tables and columns are available.",
    inputSchema: {},
    _meta: { ui: { resourceUri: RESOURCE_URI } },
  }, async (_args, { authInfo }) => {
    const userId = await getCurrentUserId(authInfo);
    const schema = await getAnalyticsSchema(userId);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(schema, null, 2) }],
    };
  });

  registerAppTool(server, "query_data", {
    description:
      "Execute a read-only PostgreSQL SELECT query against the analytics database. " +
      "Data is automatically scoped to the current user's TikTok accounts — no account filters needed. " +
      "Only SELECT queries are allowed. WITH (CTE) queries are supported. Max 500 rows returned. " +
      "Use describe_tables first to see available tables, then query iteratively — " +
      "examine results from each query to decide what to explore next for deeper insights.",
    inputSchema: {
      sql: z.string().describe("A PostgreSQL SELECT query"),
    },
    _meta: { ui: { resourceUri: RESOURCE_URI } },
  }, async (args, { authInfo }) => {
    const userId = await getCurrentUserId(authInfo);
    try {
      const result = await executeReadQuery(userId, args.sql);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(result),
        }],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: "text" as const, text: `Query error: ${message}` }],
        isError: true,
      };
    }
  });

}
