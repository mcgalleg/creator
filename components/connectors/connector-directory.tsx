'use client';

import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
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

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'design', label: 'Design' },
  { value: 'development', label: 'Development' },
  { value: 'data', label: 'Data' },
  { value: 'communication', label: 'Communication' },
  { value: 'other', label: 'Other' },
];

interface ConnectorDirectoryProps {
  connectors: Connector[];
  enabledIds: string[];
}

export function ConnectorDirectory({ connectors, enabledIds }: ConnectorDirectoryProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
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

  const filtered = connectors.filter((c) => {
    if (category !== 'all' && c.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search connectors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <Badge
              key={cat.value}
              variant={category === cat.value ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setCategory(cat.value)}
            >
              {cat.label}
            </Badge>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No connectors found matching your search.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((connector) => (
            <ConnectorCard
              key={connector.id}
              connector={connector}
              enabled={enabled.has(connector.id)}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
