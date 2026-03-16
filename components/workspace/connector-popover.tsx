'use client';

import { useState, useEffect } from 'react';
import { Blocks, Settings } from 'lucide-react';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { useHasFeatureOptional } from '@/contexts/feature-context';
import useSWR from 'swr';
import type { FeatureKey } from '@/lib/auth';

interface CatalogConnector {
  id: string;
  name: string;
  description: string;
  iconUrl: string | null;
  mcpServerUrl: string;
  requiredFeature: string | null;
  requiresAuth: boolean;
  category: string;
}

interface ConnectorPopoverProps {
  enabledConnectors: string[];
  onToggle: (id: string, enabled: boolean) => void;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/**
 * Individual connector row that checks its own feature gate.
 * Returns null if the user doesn't have access to the required feature.
 */
function ConnectorRow({
  connector,
  enabled,
  onToggle,
}: {
  connector: CatalogConnector;
  enabled: boolean;
  onToggle: (id: string, enabled: boolean) => void;
}) {
  const hasAccess = useHasFeatureOptional(
    (connector.requiredFeature ?? "analytics_assistant") as FeatureKey
  );

  // If the connector has a required feature and the user doesn't have it, hide it
  if (connector.requiredFeature && !hasAccess) return null;

  return (
    <label
      htmlFor={`connector-${connector.id}`}
      className="flex items-center gap-3 rounded-md p-2 hover:bg-muted/50 cursor-pointer transition-colors"
    >
      {connector.iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={connector.iconUrl} alt="" className="h-4 w-4 shrink-0" />
      ) : (
        <Blocks className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{connector.name}</div>
        <div className="text-xs text-muted-foreground">{connector.description}</div>
      </div>
      <Switch
        id={`connector-${connector.id}`}
        checked={enabled}
        onCheckedChange={(checked) => onToggle(connector.id, checked)}
        disabled={connector.requiresAuth && !enabled}
      />
    </label>
  );
}

export function ConnectorPopover({ enabledConnectors, onToggle }: ConnectorPopoverProps) {
  const enabledCount = enabledConnectors.length;
  const { data: catalog = [] } = useSWR<CatalogConnector[]>('/api/connectors', fetcher);

  // Radix generates dynamic aria-controls IDs that differ between SSR and
  // client, causing hydration mismatches. Defer the Popover mount to avoid this.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Render a static placeholder that matches the trigger's visual appearance
    return (
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
    );
  }

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
          {catalog.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">No connectors available</div>
          ) : (
            catalog.map((connector) => (
              <ConnectorRow
                key={connector.id}
                connector={connector}
                enabled={enabledConnectors.includes(connector.id)}
                onToggle={onToggle}
              />
            ))
          )}
        </div>
        <div className="border-t mt-1 pt-1">
          <Link
            href="/workspace/connectors"
            className="flex items-center gap-2 rounded-md p-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Settings className="h-3.5 w-3.5" />
            Manage connectors
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
