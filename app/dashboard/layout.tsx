import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tiktokAccounts } from "@/lib/db/schema";
import { CompactHeader } from "@/components/dashboard/compact-header";
import { ResponsiveLayout } from "@/components/dashboard/responsive-layout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch user's TikTok accounts for the layout
  const accounts = await db
    .select({
      id: tiktokAccounts.id,
      username: tiktokAccounts.username,
    })
    .from(tiktokAccounts)
    .where(eq(tiktokAccounts.userId, userId));

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <CompactHeader />
      <div className="flex-1 overflow-hidden">
        <ResponsiveLayout accounts={accounts}>
          {children}
        </ResponsiveLayout>
      </div>
    </div>
  );
}
