'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, RefreshCw, Loader2 } from 'lucide-react';
import { AnalyticsRenderer } from '@/components/chat/analytics-renderer';

interface PinnedComponent {
  id: number;
  componentType: string;
  title: string;
  configuration: Record<string, unknown>;
  gridPosition?: { x: number; y: number; w: number; h: number };
}

interface PinnedGridProps {
  components: PinnedComponent[];
  onRemove: (id: number) => Promise<void>;
  onRefresh?: (id: number) => Promise<void>;
}

export function PinnedGrid({ components, onRemove, onRefresh }: PinnedGridProps) {
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());
  const [refreshingIds, setRefreshingIds] = useState<Set<number>>(new Set());

  const handleRemove = async (id: number) => {
    setRemovingIds((prev) => new Set(prev).add(id));
    try {
      await onRemove(id);
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleRefresh = async (id: number) => {
    if (!onRefresh) return;
    setRefreshingIds((prev) => new Set(prev).add(id));
    try {
      await onRefresh(id);
    } finally {
      setRefreshingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  if (components.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {components.map((component) => (
        <Card key={component.id} className="relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {component.title}
            </CardTitle>
            <div className="flex gap-1">
              {onRefresh && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleRefresh(component.id)}
                  disabled={refreshingIds.has(component.id)}
                >
                  {refreshingIds.has(component.id) ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={() => handleRemove(component.id)}
                disabled={removingIds.has(component.id)}
              >
                {removingIds.has(component.id) ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <AnalyticsRenderer
              tree={{
                component: component.componentType,
                props: component.configuration,
              }}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
