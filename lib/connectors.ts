import { PenTool, type LucideIcon } from "lucide-react";
import type { FeatureKey } from "@/lib/auth";

export interface ConnectorDefinition {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  mcpServerUrl: string;
  requiredFeature?: FeatureKey;
  defaultEnabled: boolean;
  /** Instructions injected into the system prompt when this connector is active */
  systemPromptHint?: string;
  /** Extra sandbox permissions for this connector's iframe (e.g. "allow-popups allow-popups-to-escape-sandbox") */
  sandboxPermissions?: string;
}

export const CONNECTOR_REGISTRY: ConnectorDefinition[] = [
  {
    id: "excalidraw",
    name: "Excalidraw",
    description: "Hand-drawn diagrams and flowcharts",
    icon: PenTool,
    mcpServerUrl: "https://mcp.excalidraw.com/mcp",
    requiredFeature: "canvas",
    defaultEnabled: false,
    sandboxPermissions: 'allow-popups allow-popups-to-escape-sandbox allow-forms',
    systemPromptHint: `You have access to Excalidraw drawing tools. When the user asks you to create a drawing, diagram, sketch, flowchart, mind map, wireframe, or any hand-drawn visual — use the Excalidraw tools instead of rendering data cards or charts. Excalidraw is ideal for:
- Architecture diagrams, flowcharts, and process flows
- Quadrant/matrix layouts and comparisons
- Mind maps and brainstorming visuals
- Wireframes and UI sketches
- Any request that explicitly says "draw", "drawing", or "diagram"
Query the data you need first, then pass it to the Excalidraw tool to create an interactive canvas.`,
  },
];

export const CONNECTORS_STORAGE_KEY = "enabled-connectors";

/** Look up a connector definition by ID */
export function getConnectorById(id: string): ConnectorDefinition | undefined {
  return CONNECTOR_REGISTRY.find((c) => c.id === id);
}

/** Validate that a server URL belongs to a registered connector */
export function isRegisteredServerUrl(url: string): boolean {
  return CONNECTOR_REGISTRY.some((c) => c.mcpServerUrl === url);
}
