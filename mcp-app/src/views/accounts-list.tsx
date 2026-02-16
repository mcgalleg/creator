import type { AccountsData } from "../types";
import { formatNumber, formatDate } from "../lib/formatters";
import appStyles from "../styles/app.module.css";
import { DataTable } from "../components/data-table";

export function AccountsList({ data }: { data: AccountsData }) {
  return (
    <div className={appStyles.container}>
      <div className={appStyles.header}>
        <div>
          <div className={appStyles.title}>Connected Accounts</div>
          <div className={appStyles.subtitle}>{data.accounts.length} TikTok account{data.accounts.length !== 1 ? "s" : ""}</div>
        </div>
      </div>
      <DataTable
        columns={[
          { key: "username", header: "Username", render: (r) => `@${r.username}` },
          { key: "displayName", header: "Display Name", render: (r) => r.displayName ?? "-" },
          { key: "followers", header: "Followers", render: (r) => formatNumber(r.followerCount), align: "right" },
          { key: "lastSync", header: "Last Sync", render: (r) => formatDate(r.lastSyncedAt) },
        ]}
        data={data.accounts}
      />
    </div>
  );
}
