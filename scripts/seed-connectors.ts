/**
 * Seed script for populating the connectors table.
 *
 * Run with: npx tsx scripts/seed-connectors.ts
 *
 * Uses onConflictDoUpdate for idempotency — safe to re-run.
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { db } from "@/lib/db";
import { connectors } from "@/lib/db/schema/connectors";

const SEED_CONNECTORS: (typeof connectors.$inferInsert)[] = [
  {
    id: "excalidraw",
    name: "Excalidraw",
    description: "Hand-drawn diagrams and flowcharts",
    iconUrl: null,
    category: "design",
    mcpServerUrl: "https://mcp.excalidraw.com/mcp",
    requiresAuth: false,
    sandboxPermissions: "allow-popups allow-popups-to-escape-sandbox allow-forms",
    systemPromptHint: `You have access to Excalidraw drawing tools. When the user asks you to create a drawing, diagram, sketch, flowchart, mind map, wireframe, or any hand-drawn visual — use the Excalidraw tools instead of rendering data cards or charts. Excalidraw is ideal for:
- Architecture diagrams, flowcharts, and process flows
- Quadrant/matrix layouts and comparisons
- Mind maps and brainstorming visuals
- Wireframes and UI sketches
- Any request that explicitly says "draw", "drawing", or "diagram"
Query the data you need first, then pass it to the Excalidraw tool to create an interactive canvas.`,
    requiredFeature: "canvas",
    featured: true,
    enabled: true,
    sortOrder: 10,
  },
  {
    id: "notion",
    name: "Notion",
    description: "Connect your Notion workspace for notes and documents",
    iconUrl: null,
    category: "productivity",
    mcpServerUrl: "https://mcp.notion.so/mcp",
    requiresAuth: true,
    oauthConfig: {
      authUrl: "https://api.notion.com/v1/oauth/authorize",
      tokenUrl: "https://api.notion.com/v1/oauth/token",
      scopes: [],
    },
    featured: true,
    enabled: false, // Disabled until OAuth is fully configured
    sortOrder: 20,
  },
  {
    id: "figma",
    name: "Figma",
    description: "Access Figma designs and design tokens",
    iconUrl: null,
    category: "design",
    mcpServerUrl: "https://mcp.figma.com/mcp",
    requiresAuth: true,
    oauthConfig: {
      authUrl: "https://www.figma.com/oauth",
      tokenUrl: "https://api.figma.com/v1/oauth/token",
      scopes: ["files:read"],
    },
    featured: true,
    enabled: false,
    sortOrder: 30,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Send and receive Slack messages",
    iconUrl: null,
    category: "communication",
    mcpServerUrl: "https://mcp.slack.com/mcp",
    requiresAuth: true,
    oauthConfig: {
      authUrl: "https://slack.com/oauth/v2/authorize",
      tokenUrl: "https://slack.com/api/oauth.v2.access",
      scopes: ["chat:write", "channels:read"],
    },
    featured: false,
    enabled: false,
    sortOrder: 40,
  },
];

async function seedConnectors() {
  console.log("Seeding connectors...");

  for (const connector of SEED_CONNECTORS) {
    await db
      .insert(connectors)
      .values(connector)
      .onConflictDoUpdate({
        target: connectors.id,
        set: {
          name: connector.name,
          description: connector.description,
          iconUrl: connector.iconUrl,
          category: connector.category,
          mcpServerUrl: connector.mcpServerUrl,
          requiresAuth: connector.requiresAuth,
          oauthConfig: connector.oauthConfig,
          sandboxPermissions: connector.sandboxPermissions,
          systemPromptHint: connector.systemPromptHint,
          requiredFeature: connector.requiredFeature,
          featured: connector.featured,
          enabled: connector.enabled,
          sortOrder: connector.sortOrder,
          updatedAt: new Date(),
        },
      });
    console.log(`  ✓ ${connector.id}`);
  }

  console.log(`\nSeeded ${SEED_CONNECTORS.length} connectors.`);
}

seedConnectors()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
