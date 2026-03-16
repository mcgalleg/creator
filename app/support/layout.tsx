import { ContentLayout } from "@/components/content-layout";
import { LifeBuoy } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support — Astriq",
  description:
    "Get help with Astriq — contact support, browse documentation, and find answers.",
};

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ContentLayout badge={{ icon: LifeBuoy, label: "We're here to help" }}>
      {children}
    </ContentLayout>
  );
}
