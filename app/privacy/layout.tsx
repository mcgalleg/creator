import { ContentLayout } from "@/components/content-layout";
import { Shield } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Astriq",
  description:
    "Privacy policy for Astriq — how we collect, use, and protect your data.",
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ContentLayout badge={{ icon: Shield, label: "Your data, your control" }}>
      {children}
    </ContentLayout>
  );
}
