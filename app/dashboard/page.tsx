'use client';

import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PinnedGrid } from '@/components/dashboard/pinned-grid';
import { ChatContainer } from '@/components/chat/chat-container';
import { usePinnedComponents } from '@/hooks/use-pinned-components';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { components, loading, unpinComponent, refresh } = usePinnedComponents();

  return (
    <DashboardShell
      title="Dashboard"
      description="Your TikTok analytics at a glance"
    >
      {/* Pinned Components Section */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : components.length > 0 ? (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Pinned Visualizations</h2>
          <PinnedGrid
            components={components}
            onRemove={unpinComponent}
            onRefresh={refresh}
          />
        </div>
      ) : null}

      {/* Chat Interface */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">Analytics Assistant</h2>
        <ChatContainer />
      </div>
    </DashboardShell>
  );
}
