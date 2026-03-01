'use client';

import { Blocks } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { CONNECTOR_REGISTRY, type ConnectorDefinition } from '@/lib/connectors';
import { useHasFeatureOptional } from '@/contexts/feature-context';

interface ConnectorPopoverProps {
  enabledConnectors: string[];
  onToggle: (id: string, enabled: boolean) => void;
}

/**
 * Individual connector row that checks its own feature gate.
 * Returns null if the user doesn't have access to the required feature.
 */
function ConnectorRow({
  connector,
  enabled,
  onToggle,
}: {
  connector: ConnectorDefinition;
  enabled: boolean;
  onToggle: (id: string, enabled: boolean) => void;
}) {
  const hasAccess = useHasFeatureOptional(
    connector.requiredFeature ?? ("analytics_assistant" as const)
  );

  // If the connector has a required feature and the user doesn't have it, hide it
  if (connector.requiredFeature && !hasAccess) return null;

  const Icon = connector.icon;

  return (
    <label
      htmlFor={`connector-${connector.id}`}
      className="flex items-center gap-3 rounded-md p-2 hover:bg-muted/50 cursor-pointer transition-colors"
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{connector.name}</div>
        <div className="text-xs text-muted-foreground">{connector.description}</div>
      </div>
      <Switch
        id={`connector-${connector.id}`}
        checked={enabled}
        onCheckedChange={(checked) => onToggle(connector.id, checked)}
      />
    </label>
  );
}

export function ConnectorPopover({ enabledConnectors, onToggle }: ConnectorPopoverProps) {
  const enabledCount = enabledConnectors.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-sm text-muted-foreground hover:bg-muted/80 transition-colors"
        >
          <Blocks className="h-3 w-3" />
          Connectors
          {enabledCount > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] leading-none h-4 min-w-4 px-1">
              {enabledCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-2">
        <div className="space-y-1">
          {CONNECTOR_REGISTRY.map((connector) => (
            <ConnectorRow
              key={connector.id}
              connector={connector}
              enabled={enabledConnectors.includes(connector.id)}
              onToggle={onToggle}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
