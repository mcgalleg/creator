import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { LandingNav } from "@/components/landing/landing-nav";
import { Hero } from "@/components/landing/hero";
import { FeatureBento } from "@/components/landing/feature-bento";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Faq } from "@/components/landing/faq";
import { FaqJsonLd } from "@/components/landing/faq-jsonld";
import { AppJsonLd } from "@/components/landing/app-jsonld";
import { FinalCta } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";

const SampleQuestions = dynamic(() =>
  import("@/components/landing/interactive-queries").then(
    (m) => m.SampleQuestions
  )
);

const PricingPreview = dynamic(() =>
  import("@/components/landing/pricing-preview").then(
    (m) => m.PricingPreview
  )
);

export const metadata: Metadata = {
  title: {
    absolute: "Astriq — AI-Powered TikTok Analytics for Creators",
  },
  openGraph: {
    title: "Astriq — AI-Powered TikTok Analytics for Creators",
    description:
      "Turn your TikTok data into actionable growth insights with AI-powered analytics. Free to start.",
  },
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
      >
        Skip to main content
      </a>
      <FaqJsonLd />
      <AppJsonLd />
      <LandingNav />
      <main id="main-content" className="flex-1">
        <Hero />
        <FeatureBento />
        <HowItWorks />
        <SampleQuestions />
        <PricingPreview />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
