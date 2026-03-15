import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getUserAccountIds } from "./accounts";

const MAX_ROWS = 500;

const FORBIDDEN_KEYWORDS =
  /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE|EXECUTE|COPY|SET|CALL|DO|VACUUM|EXPLAIN|LISTEN|NOTIFY|LOAD|REINDEX)\b/i;

const FORBIDDEN_PATTERNS =
  /\b(pg_read_file|pg_read_binary_file|pg_ls_dir|pg_stat_file|current_setting|set_config|pg_sleep|lo_import|lo_export|dblink|query_to_xml|pg_terminate_backend|pg_cancel_backend|information_schema|pg_catalog)\b/i;

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
    description: "Individual comments on posts, with full author details. GROUP BY author_username to find top commenters, super fans, repeat engagers, and audience demographics.",
    columns: {
      id: "integer PK",
      post_id: "integer FK → posts.id",
      tiktok_id: "text",
      text: "text — the comment body",
      author_username: "text — commenter's unique handle (group by this for top fans / repeat commenters)",
      author_display_name: "text",
      author_region: "text — 2-letter country code of commenter (nullable, useful for audience geography)",
      comment_language: "text — 2-letter language code (nullable)",
      likes: "integer — likes received on this comment",
      reply_count: "integer — replies to this comment",
      is_author_liked: "boolean — whether the creator liked/hearted this comment",
      author_follower_count: "integer — commenter's follower count at time of sync",
      sentiment: "text — pre-computed: 'supportive', 'neutral', 'unsupportive' (null if not yet classified)",
      sentiment_category: "text — theme: 'praise', 'question', 'spam', 'sarcasm', 'negative_experience', 'encouragement', 'form_safety', 'feature_request', 'general'",
      sentiment_score: "real — classification confidence 0.0–1.0",
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

export async function getAnalyticsSchema(userId: string, selectedAccountIds?: number[]) {
  const accountIds = await getUserAccountIds(
    userId,
    selectedAccountIds?.map(String)
  );
  return {
    userAccountIds: accountIds,
    instructions:
      "Write standard PostgreSQL SELECT queries. " +
      "Data is automatically scoped to the current user's accounts — do not add account_id filters. " +
      "IMPORTANT: Always qualify column references with the table name (e.g., posts.likes, posts.comments) to avoid ambiguity with the data scoping layer. " +
      "Engagement rate: (posts.likes + posts.comments + posts.shares)::numeric / NULLIF(posts.plays, 0) * 100 — use ::numeric to prevent integer division truncation. " +
      "The hashtags column is text[] — use unnest(posts.hashtags) to expand for per-hashtag analysis. " +
      "posted_at, duration, song_title, and song_artist may be NULL — use appropriate NULL handling. " +
      "Join comments to posts via comments.post_id = posts.id. " +
      "Join post_collaborators via post_collaborators.post_id = posts.id. " +
      "Use account_metrics_history for follower/following count snapshots over time. " +
      "Use comments grouped by author_username for fan/audience analysis (top fans, super fans, repeat commenters).",
    tables: ANALYTICS_SCHEMA,
    notes: [
      "Always qualify column references with the table name (e.g., posts.likes, posts.comments) to avoid ambiguity",
      "hashtags is a PostgreSQL text[] column — use unnest(posts.hashtags) to expand into rows for per-hashtag queries",
      "Engagement rate: (posts.likes + posts.comments + posts.shares)::numeric / NULLIF(posts.plays, 0) * 100",
      "posted_at, duration, song_title, song_artist can be NULL",
      "account_metrics_history contains periodic snapshots — use recorded_at for time-series analysis of follower growth",
    ],
  };
}

// ---------------------------------------------------------------------------
// Query execution with automatic data scoping via CTE shadowing
// ---------------------------------------------------------------------------

/**
 * Extracts CTE names defined in a user's WITH clause so they can be
 * allowed as valid table references alongside the base ALLOWED_TABLES.
 *
 * Scans the full query for `identifier AS [NOT MATERIALIZED] (` patterns,
 * which only appear in CTE definitions. We can't isolate just the WITH
 * preamble because CTE bodies themselves contain SELECT statements.
 */
function extractUserCteNames(query: string): Set<string> {
  const names = new Set<string>();
  if (!/^\s*WITH\b/i.test(query)) return names;

  const ctePattern = /\b(\w+)\s+AS\s*(?:NOT\s+MATERIALIZED\s*)?\(/gi;
  let m;
  while ((m = ctePattern.exec(query)) !== null) {
    const name = m[1].toLowerCase();
    // Skip base table names — those are real table references inside CTE bodies,
    // not user-defined CTE names (e.g., `posts AS NOT MATERIALIZED (SELECT ...`)
    if (!ALLOWED_TABLES.has(name)) {
      names.add(name);
    }
  }
  return names;
}

/**
 * Validates that a SQL query only references allowed tables.
 * Strips string literals and comments, then checks FROM/JOIN targets.
 * User-defined CTEs (from WITH clauses) are permitted.
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

  // Allow user-defined CTE names in addition to the base tables
  const userCtes = extractUserCteNames(cleaned);

  // Extract table names after FROM / JOIN keywords
  const tablePattern = /\b(?:FROM|JOIN)\s+(?:LATERAL\s+)?(\w+)/gi;
  let match;
  while ((match = tablePattern.exec(cleaned)) !== null) {
    const name = match[1].toLowerCase();
    // Skip SQL keywords that can follow FROM/JOIN in subquery contexts
    if (name === "select" || name === "lateral" || name === "unnest" || name === "generate_series") {
      continue;
    }
    if (!ALLOWED_TABLES.has(name) && !userCtes.has(name)) {
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
  const ids = accountIds.map(id => {
    if (!Number.isFinite(id) || id !== Math.floor(id)) throw new Error("Invalid account ID");
    return id;
  }).join(", ");

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

  if (FORBIDDEN_PATTERNS.test(trimmed)) {
    throw new Error("Query contains forbidden functions or system references");
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
      // For integers, only convert if within safe integer range to avoid
      // losing precision on large numeric IDs (e.g. TikTok IDs > 2^53)
      if (val.includes(".")) {
        out[key] = Number(val);
      } else {
        const n = BigInt(val);
        if (n >= BigInt(Number.MIN_SAFE_INTEGER) && n <= BigInt(Number.MAX_SAFE_INTEGER)) {
          out[key] = Number(val);
        } else {
          out[key] = val;
        }
      }
    } else {
      out[key] = val;
    }
  }
  return out;
}

/**
 * Extracts a clean PostgreSQL error message from a database error.
 * node-postgres errors include the full query text which is unhelpful
 * (and confusing) when returned to the AI agent.
 */
function cleanDbError(err: unknown, userQuery: string): string {
  if (!(err instanceof Error)) return "Query execution failed";

  // Drizzle wraps DB errors in DrizzleQueryError with the original as `cause`.
  // The cause (NeonDbError) has the actual Postgres message; the wrapper's
  // message just echoes the full SQL which is unhelpful for the AI agent.
  const cause = (err as Error & { cause?: Error }).cause;
  const dbErr = (cause ?? err) as Error & {
    severity?: string;
    detail?: string;
    hint?: string;
    position?: string;
    code?: string;
  };

  const parts: string[] = [];
  parts.push(dbErr.message);

  if (dbErr.detail) parts.push(`Detail: ${dbErr.detail}`);
  if (dbErr.hint) parts.push(`Hint: ${dbErr.hint}`);

  parts.push(`Query: ${userQuery}`);

  return parts.join("\n");
}

async function runScopedQuery(
  trimmed: string,
  accountIds: number[]
): Promise<QueryResult> {
  const scoped = buildScopedQuery(trimmed, accountIds);
  const limited = `SELECT * FROM (${scoped}) AS _q LIMIT ${MAX_ROWS}`;

  let result;
  try {
    result = await Promise.race([
      db.execute(sql.raw(limited)),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Query timed out (10s limit)")),
          QUERY_TIMEOUT_MS
        )
      ),
    ]);
  } catch (err) {
    throw new Error(cleanDbError(err, trimmed));
  }

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
  queryStr: string,
  selectedAccountIds?: number[]
): Promise<QueryResult> {
  const trimmed = validateQuery(queryStr);

  const accountIds = await getUserAccountIds(
    userId,
    selectedAccountIds?.map(String)
  );
  if (accountIds.length === 0) {
    return { columns: [], rows: [], rowCount: 0, truncated: false };
  }

  return runScopedQuery(trimmed, accountIds);
}
