import type { Metadata } from "next";
import { Users, TrendingUp, BarChart3, Sparkles } from "lucide-react";
import { FeaturePageHero } from "@/components/features/feature-page-hero";
import { FeatureJsonLd } from "@/components/features/feature-jsonld";
import { FeaturePageSection } from "@/components/features/feature-page-section";
import { FeaturePageCta } from "@/components/features/feature-page-cta";

export const metadata: Metadata = {
  title: "TikTok Audience Insights",
  description:
    "Discover who watches your TikTok content with AI-powered audience insights. Analyze follower growth, viewer behavior, and engagement patterns.",
};

export default function AudienceInsightsPage() {
  return (
    <>
      <FeatureJsonLd
        title="TikTok Audience Insights"
        description="Discover who watches your TikTok content with AI-powered audience insights. Analyze follower growth, viewer behavior, and engagement patterns."
        path="/features/audience-insights"
      />

      <FeaturePageHero
        badge="Audience Insights"
        title="Know Your Audience, Grow Your Audience"
        subtitle="Understand who watches your content and why they stick around. Astriq breaks down your TikTok audience so you can create for the people who actually care."
        primaryCta={{ label: "Start Free", href: "/pricing" }}
        secondaryCta={{ label: "Read the Docs", href: "/docs/getting-started" }}
      />

      <FeaturePageSection icon={Users} heading="Multi-Account Overview">
        <p>
          If you run multiple TikTok accounts — maybe one for your brand and one
          personal — Astriq lets you see them side by side. Compare audience
          size, growth rates, and engagement across accounts without switching
          tabs. Everything lives in one workspace, so you get the full picture
          at a glance instead of juggling logins and screenshots.
        </p>
        <p className="mt-4">
          This is especially useful if you manage content for clients or run a
          team. You can spot which account is picking up momentum and which one
          needs attention. Instead of guessing based on gut feelings from
          scrolling each profile, you have real numbers next to each other.
        </p>
        <p className="mt-4">
          The overview updates as your data syncs, so you always see the latest
          state. No manual exports, no copy-pasting into spreadsheets. Just open
          Astriq and your accounts are already there, ready to compare. It saves
          you the kind of tedious setup work that usually eats into your actual
          creative time.
        </p>
      </FeaturePageSection>

      <FeaturePageSection
        icon={TrendingUp}
        heading="Follower Growth Tracking"
        reverse
      >
        <p>
          Watch your follower count over time, not just today&apos;s number.
          Astriq charts your growth so you can connect spikes to specific videos
          or campaigns. You&apos;ll know exactly what brought people in — and
          what didn&apos;t move the needle.
        </p>
        <p className="mt-4">
          Most creator dashboards show you a single number: how many followers
          you have right now. That&apos;s like checking your bank balance
          without ever looking at transactions. Growth tracking gives you the
          full timeline so you can see trends forming before they become obvious.
          If a series of videos is slowly building your audience, you&apos;ll
          notice it here first.
        </p>
        <p className="mt-4">
          You can zoom into specific date ranges to see what happened around a
          particular post or collaboration. Did that duet actually bring in new
          followers, or did it just get views? Growth tracking answers that
          question with data, not guesswork. Over time, you build an intuition
          for what your audience responds to, backed by the numbers.
        </p>
      </FeaturePageSection>

      <FeaturePageSection icon={BarChart3} heading="Engagement-to-Viewer Ratios">
        <p>
          Raw view counts only tell half the story. A video with 100,000 views
          and 200 likes is performing very differently from one with 10,000
          views and 2,000 likes. Astriq calculates how many viewers actually
          engage — like, comment, share — so you can measure true audience
          connection, not just reach.
        </p>
        <p className="mt-4">
          These ratios help you figure out what kind of content builds
          relationships versus what just gets pushed by the algorithm
          temporarily. High reach with low engagement usually means people
          watched but didn&apos;t care enough to interact. High engagement with
          moderate reach means your existing audience is paying close attention.
          Both are worth knowing, and the difference matters for how you plan
          your next video.
        </p>
        <p className="mt-4">
          Astriq breaks this down per video and across your account as a whole.
          You can track whether your engagement ratio is improving over time or
          whether you&apos;re getting more views but losing that personal
          connection with your audience. It&apos;s one of the most honest
          metrics you can look at as a creator, and most tools just skip it
          entirely.
        </p>
      </FeaturePageSection>

      <FeaturePageSection icon={Sparkles} heading="Ask Your Data" reverse>
        <p>
          Type a question like &quot;how fast is my audience growing compared to
          last month?&quot; and the AI copilot gives you a straight answer with
          the data to back it up. No dashboards to configure, no reports to
          build. Just ask what you want to know and get a clear response.
        </p>
        <p className="mt-4">
          This works because Astriq already has your account data synced and
          organized. The copilot understands your metrics in context — it knows
          the difference between a follower spike from a viral video and steady
          organic growth. You can ask follow-up questions too, like &quot;which
          videos drove the most followers this week?&quot; and it pulls the
          answer from your actual data, not generic advice.
        </p>
        <p className="mt-4">
          For creators who don&apos;t want to become data analysts, this
          changes everything. You get the insights without learning the tools.
          Instead of spending twenty minutes clicking through charts and
          filters, you spend twenty seconds typing a question. The answers are
          specific to your account, your audience, and your content — not
          cookie-cutter tips pulled from a blog post somewhere.
        </p>
      </FeaturePageSection>

      <FeaturePageCta
        heading="Understand your audience better"
        description="Free to start. No credit card required."
        relatedPages={[
          {
            label: "Engagement Analytics",
            href: "/features/engagement-analytics",
          },
          { label: "Video Analytics", href: "/features/video-analytics" },
          { label: "Content Strategy", href: "/features/content-strategy" },
        ]}
      />
    </>
  );
}
