import { pgTable, pgEnum, text, boolean, timestamp, serial, jsonb, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users";

export const connectorCategoryEnum = pgEnum("connector_category", [
  "productivity",
  "design",
  "development",
  "data",
  "communication",
  "other",
]);

/**
 * Global connector registry — each row defines an MCP connector that users
 * can enable. Replaces the old hard-coded CONNECTOR_REGISTRY array.
 */
export const connectors = pgTable("connectors", {
  /** Slug used as stable identifier (e.g. "excalidraw", "notion") */
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  /** URL to connector icon image, or null for generic fallback */
  iconUrl: text("icon_url"),
  category: connectorCategoryEnum("category").default("other").notNull(),
  /** Remote MCP server endpoint */
  mcpServerUrl: text("mcp_server_url").notNull().unique(),
  /** Whether this connector requires OAuth to function */
  requiresAuth: boolean("requires_auth").default(false).notNull(),
  /** OAuth configuration (clientId, authUrl, tokenUrl, scopes, etc.) */
  oauthConfig: jsonb("oauth_config").$type<{
    clientId?: string;
    authUrl: string;
    tokenUrl: string;
    scopes?: string[];
    usePkce?: boolean;
  } | null>(),
  /** Extra sandbox permissions for iframe rendering */
  sandboxPermissions: text("sandbox_permissions"),
  /** Hint injected into the system prompt when this connector is active */
  systemPromptHint: text("system_prompt_hint"),
  /** Feature key required to use this connector (e.g. "canvas") */
  requiredFeature: text("required_feature"),
  /** Whether this connector is featured in the directory */
  featured: boolean("featured").default(false).notNull(),
  /** Global kill switch — admins can disable a connector for all users */
  enabled: boolean("enabled").default(true).notNull(),
  /** Sort order in the directory (lower = first) */
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Per-user connector state — tracks which connectors a user has enabled
 * and stores encrypted OAuth tokens for auth-required connectors.
 */
export const userConnectors = pgTable("user_connectors", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  connectorId: text("connector_id").notNull().references(() => connectors.id, { onDelete: "cascade" }),
  enabled: boolean("enabled").default(true).notNull(),
  /** Encrypted OAuth access token */
  accessToken: text("access_token"),
  /** Encrypted OAuth refresh token */
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  tokenScope: text("token_scope"),
  connectedAt: timestamp("connected_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("user_connectors_user_connector_idx").on(table.userId, table.connectorId),
]);
