'use client';

import { useState, useEffect, useCallback } from 'react';
import { UITree } from './use-analytics-chat';

interface PinnedComponent {
  id: number;
  componentType: string;
  title: string;
  configuration: Record<string, unknown>;
  gridPosition?: { x: number; y: number; w: number; h: number };
  createdAt: string;
}

export function usePinnedComponents() {
  const [components, setComponents] = useState<PinnedComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchComponents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/pinned');
      if (!res.ok) throw new Error('Failed to fetch pinned components');
      const data = await res.json();
      setComponents(data.components);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComponents();
  }, [fetchComponents]);

  const pinComponent = useCallback(async (tree: UITree, title: string) => {
    const res = await fetch('/api/pinned', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        componentType: tree.component,
        title,
        configuration: tree.props,
      }),
    });
    if (!res.ok) throw new Error('Failed to pin component');
    await fetchComponents();
  }, [fetchComponents]);

  const unpinComponent = useCallback(async (id: number) => {
    const res = await fetch(`/api/pinned/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to unpin component');
    setComponents((c) => c.filter((comp) => comp.id !== id));
  }, []);

  const updateComponent = useCallback(async (
    id: number,
    updates: Partial<Pick<PinnedComponent, 'title' | 'gridPosition' | 'configuration'>>
  ) => {
    const res = await fetch(`/api/pinned/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update component');
    await fetchComponents();
  }, [fetchComponents]);

  return {
    components,
    loading,
    error,
    pinComponent,
    unpinComponent,
    updateComponent,
    refresh: fetchComponents,
  };
}

export type { PinnedComponent };
