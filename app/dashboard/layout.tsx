import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
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

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <CompactHeader />
      <div className="flex-1 overflow-hidden">
        <ResponsiveLayout>
          <Suspense>{children}</Suspense>
        </ResponsiveLayout>
      </div>
    </div>
  );
}
