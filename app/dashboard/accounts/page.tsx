"use client";

import { AccountConnectionForm } from "@/components/dashboard/account-connection-form";
import { AccountList } from "@/components/dashboard/account-list";
import { SyncStatus } from "@/components/dashboard/sync-status";
import { useAccounts } from "@/hooks/use-accounts";

export default function AccountsPage() {
  // Capture current time for filtering - intentionally impure to show time-based UI
  // eslint-disable-next-line react-hooks/purity -- Intentional time-based filtering
  const now = Date.now();
  const {
    accounts,
    loading,
    error,
    connectAccount,
    disconnectAccount,
    triggerSync,
    syncStatus,
    pollSyncStatus,
    connecting,
    syncing,
    disconnecting,
  } = useAccounts();

  const handleConnect = async (
    username: string,
    options?: { triggerSync?: boolean }
  ) => {
    const result = await connectAccount(username, options);
    return result;
  };

  const handleSync = async (accountId: number) => {
    const result = await triggerSync(accountId);
    // Start polling for status
    pollSyncStatus(accountId, result.jobId);
  };

  const handleDelete = async (accountId: number) => {
    await disconnectAccount(accountId);
  };

  // Find sync jobs to display (include completed/failed for a short time)
  const activeSyncJobs = Object.entries(syncStatus)
    .filter(([, job]) => {
      if (!job) return false;
      // Always show running/pending jobs
      if (job.status === "running" || job.status === "pending") return true;
      // Show completed/failed jobs for 10 seconds after completion
      if (job.status === "completed" || job.status === "failed") {
        if (job.completedAt) {
          const completedTime = new Date(job.completedAt).getTime();
          return now - completedTime < 10000; // 10 seconds
        }
        return true; // Show if no completedAt timestamp
      }
      return false;
    })
    .map(([accountId, job]) => ({
      accountId: parseInt(accountId),
      job,
      account: accounts.find((a) => a.id === parseInt(accountId)),
    }));

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Connected Accounts</h1>
        <p className="text-muted-foreground mt-1">
          Manage your TikTok accounts and sync your analytics data.
        </p>
      </div>

      <div className="space-y-6">
        {/* Account Connection Form */}
        <AccountConnectionForm
          onConnect={handleConnect}
          isConnecting={connecting}
        />

        {/* Active Sync Status */}
        {activeSyncJobs.map(({ accountId, job, account }) => (
          <SyncStatus
            key={accountId}
            job={job}
            accountUsername={account?.username}
          />
        ))}

        {/* Account List */}
        <AccountList
          accounts={accounts}
          loading={loading}
          error={error}
          onSync={handleSync}
          onDelete={handleDelete}
          syncing={syncing}
          disconnecting={disconnecting}
          syncStatus={syncStatus}
        />
      </div>
    </div>
  );
}
