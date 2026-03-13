import type { FeatureKey } from "@/lib/auth";

/**
 * Connector definition interface — used by UI components and rendering layer.
 * Icons are now URL strings (stored in DB) instead of React components.
 */
export interface ConnectorDefinition {
  id: string;
  name: string;
  description: string;
  iconUrl: string | null;
  mcpServerUrl: string;
  requiredFeature?: string;
  systemPromptHint?: string;
  sandboxPermissions?: string;
  category: string;
  requiresAuth: boolean;
  featured: boolean;
  enabled: boolean;
}

// Re-export service functions as the canonical connector lookups
export {
  getConnectorById,
  isRegisteredServerUrl,
  listConnectors,
  getEnabledConnectorsForUser,
  getUserConnectorIds,
  toggleUserConnector,
} from "@/lib/services/connector-service";
