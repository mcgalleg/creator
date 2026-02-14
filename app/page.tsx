import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { StatsBar } from "@/components/landing/stats-bar";
import { FeatureBento } from "@/components/landing/feature-bento";
import { Showcase } from "@/components/landing/showcase";
import { HowItWorks } from "@/components/landing/how-it-works";
import { InteractiveQueries } from "@/components/landing/interactive-queries";
import { PricingPreview } from "@/components/landing/pricing-preview";
import { Faq } from "@/components/landing/faq";
import { FinalCta } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <Nav />
      <main className="flex-1">
        <Hero />
        <StatsBar />
        <FeatureBento />
        <Showcase />
        <HowItWorks />
        <InteractiveQueries />
        <PricingPreview />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
