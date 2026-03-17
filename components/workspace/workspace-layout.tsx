'use client';

import { usePathname } from 'next/navigation';
import { WorkspaceChat } from './workspace-chat';

interface WorkspaceLayoutProps {
  accounts: Array<{ id: number; username: string; avatarUrl: string | null }>;
  goals?: string[];
  children?: React.ReactNode;
}

/**
 * Main workspace layout orchestrator. Replaces the old ResponsiveLayout.
 * On /workspace, renders the AI chat as the primary view.
 * On sub-pages (accounts, settings, mcp, reports), renders children.
 */
export function WorkspaceLayout({ accounts, goals, children }: WorkspaceLayoutProps) {
  const pathname = usePathname();
  const isMainWorkspace = pathname === '/workspace';

  if (!isMainWorkspace) {
    return <div className="h-full overflow-x-hidden overflow-y-auto p-3 md:p-6">{children}</div>;
  }

  return <WorkspaceChat accounts={accounts} goals={goals} />;
}
