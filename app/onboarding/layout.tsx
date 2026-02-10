import { auth, isAuthBypassed } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CompactHeader } from "@/components/dashboard/compact-header";
import { CreditsProvider } from "@/components/dashboard/credits-provider";
import { SyncProvider } from "@/contexts/sync-context";
import { ensureUserExists } from "@/lib/services/user-service";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId && !isAuthBypassed()) {
    redirect("/sign-in");
  }

  if (userId) {
    await ensureUserExists(userId);
  }

  return (
    <CreditsProvider>
      <SyncProvider>
        <div className="h-screen flex flex-col overflow-hidden">
          <CompactHeader />
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </SyncProvider>
    </CreditsProvider>
  );
}
