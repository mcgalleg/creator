'use client';

import { useState, useCallback } from 'react';
import { ConnectorCard } from './connector-card';

interface Connector {
  id: string;
  name: string;
  description: string;
  iconUrl: string | null;
  category: string;
  requiresAuth: boolean;
  featured: boolean;
}

interface ConnectorDirectoryProps {
  connectors: Connector[];
  enabledIds: string[];
}

export function ConnectorDirectory({ connectors, enabledIds }: ConnectorDirectoryProps) {
  const [enabled, setEnabled] = useState<Set<string>>(new Set(enabledIds));

  const handleToggle = useCallback(async (id: string, isEnabled: boolean) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (isEnabled) next.add(id);
      else next.delete(id);
      return next;
    });

    try {
      await fetch('/api/connectors/me/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectorId: id, enabled: isEnabled }),
      });
    } catch {
      // Revert on error
      setEnabled((prev) => {
        const next = new Set(prev);
        if (isEnabled) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {connectors.map((connector) => (
            <ConnectorCard
              key={connector.id}
              connector={connector}
              enabled={enabled.has(connector.id)}
              onToggle={handleToggle}
            />
          ))}
        </div>
    </div>
  );
}
