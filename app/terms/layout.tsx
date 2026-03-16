import { ContentLayout } from "@/components/content-layout";
import { Scale } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Astriq",
  description:
    "Terms of service for Astriq — AI-powered TikTok analytics for creators and brands.",
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ContentLayout badge={{ icon: Scale, label: "Legal" }}>
      {children}
    </ContentLayout>
  );
}
