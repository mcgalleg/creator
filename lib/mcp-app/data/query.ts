import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getUserAccountIds } from "./accounts";

const MAX_ROWS = 500;

const FORBIDDEN_KEYWORDS =
  /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE|EXECUTE|COPY)\b/i;

const ALLOWED_TABLES = new Set([
  "tiktok_accounts",
  "posts",
  "comments",
  "account_metrics_history",
  "post_collaborators",
]);

const ANALYTICS_SCHEMA = [
  {
    table: "tiktok_accounts",
    description: "Connected TikTok creator accounts",
    columns: {
      id: "integer PK",
      username: "text",
      display_name: "text",
      follower_count: "bigint",
      following_count: "bigint",
      likes_count: "bigint",
      video_count: "bigint",
      bio: "text",
      is_verified: "boolean",
      last_synced_at: "timestamp",
      created_at: "timestamp",
    },
  },
  {
    table: "posts",
    description: "TikTok videos/posts belonging to an account",
    columns: {
      id: "integer PK",
      account_id: "integer FK → tiktok_accounts.id",
      tiktok_id: "text",
      description: "text (caption)",
      likes: "bigint — total likes on this video",
      comments: "bigint — total comments on this video",
      shares: "bigint — total shares (reposts)",
      plays: "bigint — total video views/plays",
      saves: "bigint — total bookmarks/saves",
      duration: "integer — video length in seconds (nullable)",
      hashtags: "text[] — array of hashtag strings; use unnest(hashtags) for per-tag analysis",
      song_title: "text — audio/sound title used in video (nullable)",
      song_artist: "text — audio/sound artist (nullable)",
      posted_at: "timestamp — when the video was published (nullable for some posts)",
      created_at: "timestamp",
    },
  },
  {
    table: "comments",
    description: "Comments on posts",
    columns: {
      id: "integer PK",
      post_id: "integer FK → posts.id",
      tiktok_id: "text",
      text: "text",
      author_username: "text",
      author_display_name: "text",
      author_region: "text — 2-letter country code of commenter (nullable)",
      comment_language: "text — 2-letter language code (nullable)",
      likes: "integer",
      reply_count: "integer",
      is_author_liked: "boolean — whether the creator liked/hearted this comment",
      author_follower_count: "integer — commenter's follower count at time of sync",
      posted_at: "timestamp",
      created_at: "timestamp",
    },
  },
  {
    table: "account_metrics_history",
    description: "Historical snapshots of account-level metrics over time",
    columns: {
      id: "integer PK",
      account_id: "integer FK → tiktok_accounts.id",
      follower_count: "bigint",
      following_count: "bigint",
      likes_count: "bigint",
      video_count: "bigint",
      recorded_at: "timestamp",
    },
  },
  {
    table: "post_collaborators",
    description: "Collaborators/mentions tagged on posts",
    columns: {
      id: "integer PK",
      post_id: "integer FK → posts.id",
      tiktok_user_id: "text",
      username: "text",
      display_name: "text",
      is_verified: "boolean",
      follower_count: "bigint",
      created_at: "timestamp",
    },
  },
];

// ---------------------------------------------------------------------------
// Schema description (returned to Claude so it knows what to query)
// ---------------------------------------------------------------------------

export async function getAnalyticsSchema(userId: string) {
  const accountIds = await getUserAccountIds(userId);
  return {
    userAccountIds: accountIds,
    instructions:
      "Write standard PostgreSQL SELECT queries. " +
      "Data is automatically scoped to the current user's accounts — do not add account_id filters. " +
      "The hashtags column is text[] — use unnest(hashtags) to expand for per-hashtag analysis. " +
      "Engagement rate is conventionally calculated as (likes + comments + shares) / NULLIF(plays, 0) * 100. " +
      "posted_at, duration, song_title, and song_artist may be NULL — use appropriate NULL handling. " +
      "Join comments to posts via comments.post_id = posts.id. " +
      "Join post_collaborators via post_collaborators.post_id = posts.id. " +
      "Use account_metrics_history for historical follower/following snapshots over time.",
    tables: ANALYTICS_SCHEMA,
    notes: [
      "hashtags is a PostgreSQL text[] column — use unnest(hashtags) to expand into rows for per-hashtag queries",
      "Engagement rate convention: (likes + comments + shares) / NULLIF(plays, 0) * 100",
      "posted_at, duration, song_title, song_artist can be NULL",
      "account_metrics_history contains periodic snapshots — use recorded_at for time-series analysis of follower growth",
    ],
  };
}

// ---------------------------------------------------------------------------
// Query execution with automatic data scoping via CTE shadowing
// ---------------------------------------------------------------------------

/**
 * Validates that a SQL query only references allowed tables.
 * Strips string literals and comments, then checks FROM/JOIN targets.
 */
function validateTableReferences(query: string): void {
  const cleaned = query
    .replace(/'[^']*'/g, "''")
    .replace(/"[^"]*"/g, '""')
    .replace(/--[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");

  // Block schema-qualified references (e.g. public.users) that bypass CTE shadows
  // Match any 3-part dotted identifier like schema.table.column
  if (/\bpublic\./i.test(cleaned) || /\b\w+\.\w+\.\w+/i.test(cleaned)) {
    throw new Error("Schema-qualified table references are not allowed");
  }

  // Extract table names after FROM / JOIN keywords
  const tablePattern = /\b(?:FROM|JOIN)\s+(?:LATERAL\s+)?(\w+)/gi;
  let match;
  while ((match = tablePattern.exec(cleaned)) !== null) {
    const name = match[1].toLowerCase();
    // Skip SQL keywords that can follow FROM/JOIN in subquery contexts
    if (name === "select" || name === "lateral" || name === "unnest" || name === "generate_series") {
      continue;
    }
    if (!ALLOWED_TABLES.has(name)) {
      throw new Error(
        `Access to table '${name}' is not allowed. Available tables: ${Array.from(ALLOWED_TABLES).join(", ")}`
      );
    }
  }
}

/**
 * Wraps the user's query with CTEs that shadow the base tables,
 * pre-filtered to only the authenticated user's account data.
 */
function buildScopedQuery(userQuery: string, accountIds: number[]): string {
  const ids = accountIds.join(", ");

  // CTEs that shadow base table names — any reference to "posts" in the user
  // query resolves to the scoped CTE, not the underlying table.
  // NOT MATERIALIZED lets the optimizer push predicates through and use indexes
  // on the base tables instead of materializing the full filtered set.
  const scopeCtes = [
    `tiktok_accounts AS NOT MATERIALIZED (SELECT * FROM tiktok_accounts WHERE id IN (${ids}))`,
    `posts AS NOT MATERIALIZED (SELECT * FROM posts WHERE account_id IN (${ids}))`,
    `comments AS NOT MATERIALIZED (SELECT * FROM comments WHERE post_id IN (SELECT id FROM posts WHERE account_id IN (${ids})))`,
    `account_metrics_history AS NOT MATERIALIZED (SELECT * FROM account_metrics_history WHERE account_id IN (${ids}))`,
    `post_collaborators AS NOT MATERIALIZED (SELECT * FROM post_collaborators WHERE post_id IN (SELECT id FROM posts WHERE account_id IN (${ids})))`,
  ];

  const prefix = `WITH ${scopeCtes.join(", ")}`;
  const trimmed = userQuery.trim();

  // If the user query has its own WITH clause, merge them
  if (/^WITH\b/i.test(trimmed)) {
    const withoutWith = trimmed.replace(/^WITH\s+/i, "");
    return `${prefix}, ${withoutWith}`;
  }

  return `${prefix} ${trimmed}`;
}

const QUERY_TIMEOUT_MS = 10_000;

type QueryResult = {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  truncated: boolean;
};

function validateQuery(queryStr: string): string {
  const trimmed = queryStr.trim().replace(/;\s*$/, "");

  if (!/^\s*(SELECT|WITH)\b/i.test(trimmed)) {
    throw new Error("Only SELECT queries are allowed");
  }

  if (FORBIDDEN_KEYWORDS.test(trimmed)) {
    throw new Error(
      "Query contains forbidden operations (only SELECT is allowed)"
    );
  }

  const withoutStrings = trimmed
    .replace(/'[^']*'/g, "")
    .replace(/"[^"]*"/g, "");
  if (withoutStrings.includes(";")) {
    throw new Error("Multiple SQL statements are not allowed");
  }

  validateTableReferences(trimmed);
  return trimmed;
}

function coerceRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(row)) {
    if (typeof val === "string" && /^-?\d+(\.\d+)?$/.test(val)) {
      out[key] = Number(val);
    } else {
      out[key] = val;
    }
  }
  return out;
}

async function runScopedQuery(
  trimmed: string,
  accountIds: number[]
): Promise<QueryResult> {
  const scoped = buildScopedQuery(trimmed, accountIds);
  const limited = `SELECT * FROM (${scoped}) AS _q LIMIT ${MAX_ROWS}`;

  const result = await Promise.race([
    db.execute(sql.raw(limited)),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Query timed out (10s limit)")),
        QUERY_TIMEOUT_MS
      )
    ),
  ]);

  const rawRows: Record<string, unknown>[] = Array.isArray(result)
    ? result
    : ((result as Record<string, unknown>).rows as Record<string, unknown>[]) ??
      [];

  const rows = rawRows.map(coerceRow);
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return {
    columns,
    rows,
    rowCount: rows.length,
    truncated: rows.length === MAX_ROWS,
  };
}

export async function executeReadQuery(
  userId: string,
  queryStr: string
): Promise<QueryResult> {
  const trimmed = validateQuery(queryStr);

  const accountIds = await getUserAccountIds(userId);
  if (accountIds.length === 0) {
    return { columns: [], rows: [], rowCount: 0, truncated: false };
  }

  return runScopedQuery(trimmed, accountIds);
}
