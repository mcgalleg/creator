import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Astriq",
  description:
    "Simple, transparent pricing for TikTok analytics. Start free with 50 sync credits — upgrade to Creator, Pro, or Agency as you grow.",
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
