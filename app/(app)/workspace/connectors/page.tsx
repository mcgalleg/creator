import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listConnectors, getUserConnectorIds } from "@/lib/services/connector-service";
import { ConnectorDirectory } from "@/components/connectors/connector-directory";

export default async function ConnectorsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [allConnectors, enabledIds] = await Promise.all([
    listConnectors(),
    getUserConnectorIds(userId),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Connectors</h1>
        <p className="text-muted-foreground mt-1">
          Browse and enable MCP connectors to extend your workspace with external tools.
        </p>
      </div>
      <ConnectorDirectory
        connectors={allConnectors}
        enabledIds={enabledIds}
      />
    </div>
  );
}
