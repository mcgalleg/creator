import type { Metadata } from "next";
import { BarChart3, TrendingUp, Sparkles, MessageCircle } from "lucide-react";

import { FeaturePageHero } from "@/components/features/feature-page-hero";
import { FeaturePageSection } from "@/components/features/feature-page-section";
import { FeaturePageCta } from "@/components/features/feature-page-cta";
import { FeatureJsonLd } from "@/components/features/feature-jsonld";

export const metadata: Metadata = {
  title: "TikTok Engagement Analytics",
  description:
    "Track TikTok engagement metrics — likes, comments, shares, and engagement rates. AI-powered analysis shows what drives your audience interaction.",
};

export default function EngagementAnalyticsPage() {
  return (
    <>
      <FeatureJsonLd
        title="TikTok Engagement Analytics"
        description="Track TikTok engagement metrics — likes, comments, shares, and engagement rates. AI-powered analysis shows what drives your audience interaction."
        path="/features/engagement-analytics"
      />

      <FeaturePageHero
        badge="Engagement Analytics"
        title="Understand What Makes Your Audience Engage"
        subtitle="Likes, comments, shares, saves — every interaction tells a story. Astriq pulls your TikTok engagement data into one dashboard and uses AI to help you figure out what's actually driving those numbers."
        primaryCta={{ label: "Start Free", href: "/pricing" }}
        secondaryCta={{ label: "Read the Docs", href: "/docs/getting-started" }}
      />

      <FeaturePageSection icon={BarChart3} heading="Track Every Metric">
        <p>
          Astriq pulls likes, comments, shares, saves, and engagement rates for
          every video you publish. There are no manual exports, no copying
          numbers into spreadsheets, no toggling between tabs. The data lands in
          your dashboard automatically after each sync.
        </p>
        <p className="mt-4">
          You get a clear, real-time picture of how each piece of content is
          performing. Every metric updates on its own, so by the time you sit
          down to check your numbers, everything is already there. If a video
          starts picking up traction at 2 AM, you will see the spike when you
          wake up without having to do anything.
        </p>
        <p className="mt-4">
          This matters because the creators who stay consistent are the ones
          making decisions from real data, not gut feelings. When you can see
          exactly how many saves a tutorial got versus a trending sound video,
          you stop guessing and start building on what works. The dashboard
          breaks it all down so you can compare across videos, time periods, and
          content types without any extra effort.
        </p>
      </FeaturePageSection>

      <FeaturePageSection icon={TrendingUp} heading="Spot Trends Over Time" reverse>
        <p>
          One viral video does not tell you much. Patterns do. Astriq tracks
          your engagement over weeks and months so you can see what is actually
          working, not just what got lucky once.
        </p>
        <p className="mt-4">
          Maybe your engagement rate has been climbing slowly since you started
          posting three times a week. Maybe comments drop off every time you post
          on Sundays. Maybe duets consistently outperform original content. These
          are the kinds of signals that are invisible when you are only looking
          at your latest post, but obvious when you zoom out and look at the full
          timeline.
        </p>
        <p className="mt-4">
          Astriq gives you that zoomed-out view. You can filter by date range,
          sort by any metric, and watch your numbers shift over time. It is the
          difference between reacting to every post and actually building a
          strategy. Trends take time to emerge, and having all your historical
          data in one place means you will catch them early instead of figuring
          it out months later.
        </p>
      </FeaturePageSection>

      <FeaturePageSection icon={Sparkles} heading="AI-Powered Insights">
        <p>
          Looking at charts is one thing. Getting answers is another. Astriq has
          an AI copilot built right into the dashboard that you can ask plain
          questions. Things like "which videos had the highest engagement rate
          this month?" or "what type of content gets the most comments?" and you
          get instant, data-backed answers.
        </p>
        <p className="mt-4">
          The AI does not just repeat your numbers back to you. It connects dots
          across your content and surfaces things you might not have noticed. For
          example, it might tell you that your videos with on-screen text get 40%
          more saves than ones without. Or that your audience engages more on
          weekday mornings. These are the kinds of insights that would take hours
          to find manually, and most creators never find them at all.
        </p>
        <p className="mt-4">
          You do not need to know how to analyze data or build reports. Just ask
          the question in your own words and the copilot handles the rest. It
          pulls from your full history, so even questions about older content get
          accurate answers. Think of it as having a data analyst who knows your
          account inside and out, available whenever you need them.
        </p>
      </FeaturePageSection>

      <FeaturePageSection icon={MessageCircle} heading="Comment Sentiment Analysis" reverse>
        <p>
          Comment counts only tell you part of the story. A video with 500
          comments sounds great until you realize half of them are people
          confused about your product. Astriq goes beyond counting comments by
          using AI to read the tone and intent behind what people are actually
          saying.
        </p>
        <p className="mt-4">
          The sentiment analysis groups your comments into categories so you can
          quickly tell whether people are excited, asking questions, giving
          feedback, or just dropping emoji reactions. This is useful for spotting
          content themes that genuinely resonate with your audience versus ones
          that just generate noise. When you notice that tutorial-style videos
          consistently pull positive, thoughtful comments while trend-hopping
          videos get generic reactions, that tells you something important about
          where to focus.
        </p>
        <p className="mt-4">
          It also helps you catch problems early. If a video starts getting
          confused or negative comments, you will see it in the sentiment
          breakdown before it becomes obvious from the numbers alone. You can
          respond faster, adjust your approach, or double down on what is
          landing well. Creators who pay attention to the quality of their
          engagement, not just the quantity, are the ones who build real
          communities.
        </p>
      </FeaturePageSection>

      <FeaturePageCta
        heading="Start tracking your engagement"
        description="Free to start. No credit card required."
        relatedPages={[
          { label: "Audience Insights", href: "/features/audience-insights" },
          { label: "Video Analytics", href: "/features/video-analytics" },
          { label: "Content Strategy", href: "/features/content-strategy" },
        ]}
      />
    </>
  );
}
