import type { Metadata } from "next";
import { Play, RefreshCw, Sparkles, Layout } from "lucide-react";
import { FeaturePageHero } from "@/components/features/feature-page-hero";
import { FeatureJsonLd } from "@/components/features/feature-jsonld";
import { FeaturePageSection } from "@/components/features/feature-page-section";
import { FeaturePageCta } from "@/components/features/feature-page-cta";

export const metadata: Metadata = {
  title: "TikTok Video Analytics",
  description:
    "Analyze TikTok video performance with AI-powered analytics. Track views, likes, shares, and completion rates across all your content.",
};

export default function VideoAnalyticsPage() {
  return (
    <>
      <FeatureJsonLd
        title="TikTok Video Analytics"
        description="Analyze TikTok video performance with AI-powered analytics. Track views, likes, shares, and completion rates across all your content."
        path="/features/video-analytics"
      />

      <FeaturePageHero
        badge="Video Analytics"
        title="Every Video Tells a Story. We Help You Read It."
        subtitle="Deep video performance analysis that actually makes sense. See exactly how your TikTok content is performing, spot trends before they fade, and figure out what to post next without staring at spreadsheets."
        primaryCta={{ label: "Start Free", href: "/pricing" }}
        secondaryCta={{ label: "Read the Docs", href: "/docs/getting-started" }}
      />

      <FeaturePageSection icon={Play} heading="Video Performance Tracking">
        <p>
          Every video you publish gets a full breakdown: views, likes, comments,
          shares, saves, and engagement rate. No jumping between tabs or
          screenshotting your TikTok analytics dashboard. Astriq pulls it all in
          and organizes everything in one place so you can scan your entire
          library and immediately see what&apos;s working and what fell flat.
        </p>
        <p className="mt-3">
          You can sort and filter by any metric. Want to see your top videos by
          shares this month? Done. Curious which videos got the most saves but
          barely any comments? That&apos;s two clicks. The goal is to make your
          data easy to browse, not something you dread opening.
        </p>
        <p className="mt-3">
          Over time, patterns start to emerge. Maybe your morning posts
          consistently outperform your evening ones. Maybe duets get more
          engagement than originals. You won&apos;t know until you can see
          everything side by side, and that&apos;s exactly what the performance
          dashboard gives you. It turns a pile of numbers into something you can
          actually act on.
        </p>
      </FeaturePageSection>

      <FeaturePageSection icon={RefreshCw} heading="Smart Sync" reverse>
        <p>
          Not every sync needs to pull your entire history. That&apos;s why
          Astriq gives you three modes: full, incremental, and quick. Full sync
          grabs everything from your TikTok account, all the way back. It&apos;s
          great for your first import or when you want a complete refresh.
          Incremental sync picks up where you left off, only fetching videos and
          stats that have changed since your last pull.
        </p>
        <p className="mt-3">
          Quick sync is the lightweight option. It refreshes your most recent
          posts so you can check how today&apos;s content is doing without
          burning through credits. Each mode costs a different amount, and
          you&apos;re always in control of which one runs. No surprises on your
          credit balance.
        </p>
        <p className="mt-3">
          This matters because TikTok data shifts constantly. A video can go
          viral three weeks after you posted it. Regular syncing keeps your
          numbers fresh so you&apos;re making decisions based on what&apos;s
          happening now, not what happened when you last remembered to check. Set
          it up once and let it run, or trigger syncs manually whenever you want.
        </p>
      </FeaturePageSection>

      <FeaturePageSection icon={Sparkles} heading="AI-Powered Video Ranking">
        <p>
          This is where the copilot earns its keep. Instead of manually sorting
          through dozens of videos, just ask. &quot;Which videos performed best
          this week?&quot; &quot;Show me videos with above-average
          engagement.&quot; &quot;What&apos;s my best-performing duet?&quot; The
          AI understands your data and can slice it however you need, returning
          ranked results with the numbers to back them up.
        </p>
        <p className="mt-3">
          It goes beyond simple sorting. The copilot can compare time periods,
          highlight outliers, and surface videos that are trending upward even if
          their total numbers are still modest. That&apos;s the kind of insight
          that&apos;s hard to spot when you&apos;re scrolling through a table
          yourself. You ask a question in plain English and get a clear answer
          with context.
        </p>
        <p className="mt-3">
          The more data you sync, the smarter the answers get. After a few weeks
          of regular syncing, the copilot has enough history to spot real
          patterns. It can tell you that your how-to videos get 40% more saves
          than your vlogs, or that your average engagement drops on weekends. You
          don&apos;t have to build a spreadsheet to figure that out. Just ask.
        </p>
      </FeaturePageSection>

      <FeaturePageSection icon={Layout} heading="Canvas for Planning" reverse>
        <p>
          Analytics are only useful if they change what you do next. The Canvas
          workspace lets you take your video insights and turn them into a
          content plan. Drag your top-performing video data onto the canvas, add
          notes, group videos by theme or format, and start mapping out your next
          batch of content. It&apos;s a freeform workspace that feels like a
          whiteboard, except this one actually knows your numbers.
        </p>
        <p className="mt-3">
          Say you notice your recipe videos consistently outperform everything
          else. Pull those insights onto the canvas, brainstorm ten new recipe
          ideas around them, and organize them into a posting schedule. You can
          mix data cards with text notes, draw connections between ideas, and
          rearrange everything until it makes sense.
        </p>
        <p className="mt-3">
          The canvas is especially useful for creators who batch their content.
          Instead of deciding what to film the morning of, you have a visual plan
          built on real performance data. You know what topics your audience
          responds to, what formats work, and where the gaps are. Planning
          becomes less guesswork and more strategy, and you can update the canvas
          every time you sync new data.
        </p>
      </FeaturePageSection>

      <FeaturePageCta
        heading="See what your videos are really doing"
        description="Free to start. No credit card required."
        relatedPages={[
          {
            label: "Engagement Analytics",
            href: "/features/engagement-analytics",
          },
          {
            label: "Audience Insights",
            href: "/features/audience-insights",
          },
          {
            label: "Content Strategy",
            href: "/features/content-strategy",
          },
        ]}
      />
    </>
  );
}
