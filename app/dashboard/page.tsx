/**
 * Dashboard page - serves as the main entry point for the dashboard.
 *
 * The actual dashboard content (DefaultDashboard, ExcalidrawView, ChatPanel)
 * is rendered by ResponsiveLayout in the layout.tsx file which handles
 * responsive layouts for desktop, tablet, and mobile views.
 *
 * This page component exists to satisfy Next.js App Router requirements
 * and can be used for page-specific metadata or loading states.
 */
export default function DashboardPage() {
  // The ResponsiveLayout in layout.tsx renders the main dashboard content
  // including ViewTabs with DefaultDashboard and ExcalidrawView
  return null;
}
