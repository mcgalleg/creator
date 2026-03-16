import dynamic from "next/dynamic";
import { LandingNav } from "@/components/landing/landing-nav";
import { Hero } from "@/components/landing/hero";
import { FeatureBento } from "@/components/landing/feature-bento";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Faq } from "@/components/landing/faq";
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

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <LandingNav />
      <main className="flex-1">
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
