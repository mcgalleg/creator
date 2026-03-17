import type { Metadata } from "next";
import { BarChart3, Clock, Tags, Layout, Users } from "lucide-react";
import { FeaturePageHero } from "@/components/features/feature-page-hero";
import { FeatureJsonLd } from "@/components/features/feature-jsonld";
import { FeaturePageSection } from "@/components/features/feature-page-section";
import { FeaturePageCta } from "@/components/features/feature-page-cta";

export const metadata: Metadata = {
  title: "TikTok Content Strategy Tool",
  description:
    "Build a data-driven TikTok content strategy with AI insights. Find best posting times, high-performing themes, and growth opportunities.",
};

export default function ContentStrategyPage() {
  return (
    <>
      <FeatureJsonLd
        title="TikTok Content Strategy Tool"
        description="Build a data-driven TikTok content strategy with AI insights. Find best posting times, high-performing themes, and growth opportunities."
        path="/features/content-strategy"
      />

      <FeaturePageHero
        badge="Content Strategy"
        title="Stop Posting Blind. Build a Strategy That Works."
        subtitle="Your TikTok growth shouldn't depend on luck. Use real performance data to decide what to post, when to post it, and which ideas deserve your energy. Astriq turns your analytics into a clear, actionable content plan."
        primaryCta={{ label: "Start Free", href: "/pricing" }}
        secondaryCta={{ label: "Read the Docs", href: "/docs/getting-started" }}
      />

      {/* Section 1: Data-Driven Decisions */}
      <FeaturePageSection icon={BarChart3} heading="Data-Driven Decisions">
        <p>
          Gut feelings are fine for choosing lunch. For your TikTok strategy, you
          want numbers. Astriq gives you the engagement data, audience patterns,
          and performance trends you need to decide what to post next — with
          confidence.
        </p>
        <p className="mt-4">
          Every video you post generates a pile of useful data: views, watch
          time, shares, saves, comments, follower conversions. Most creators
          glance at these numbers and move on. Astriq pulls them together into a
          clear picture so you can spot what&apos;s actually working. Maybe your
          storytelling videos get three times the saves of your quick tips. Maybe
          your audience drops off after 15 seconds on certain topics. You
          won&apos;t know until you look at the data properly.
        </p>
        <p className="mt-4">
          The AI copilot sits on top of all this. Ask it questions like
          &quot;which of my videos had the best engagement rate this month?&quot;
          or &quot;what&apos;s my average watch time trending toward?&quot; and
          get answers in plain language. No spreadsheets, no manual number
          crunching. Just ask and get the insight you need to make your next
          content decision a smart one.
        </p>
      </FeaturePageSection>

      {/* Section 2: Best Time to Post */}
      <FeaturePageSection icon={Clock} heading="Best Time to Post" reverse>
        <p>
          The AI copilot analyzes your historical data to find when your audience
          is most active and engaged. Ask &quot;when should I post?&quot; and get
          recommendations based on your actual performance, not generic best
          practices pulled from some blog post written in 2022.
        </p>
        <p className="mt-4">
          Timing matters more than most creators think. A great video posted when
          your audience is asleep gets buried before anyone sees it. Astriq looks
          at your specific engagement patterns — when your followers are online,
          when they actually interact with content, and when the algorithm tends
          to push your videos — to give you posting windows that make sense for
          your account, not someone else&apos;s.
        </p>
        <p className="mt-4">
          And it&apos;s not a one-time thing. Your audience&apos;s behavior
          shifts over time as you grow and attract different viewers. The copilot
          keeps learning from your latest data, so the recommendations stay
          relevant. You can also break it down by content type — maybe your
          longer videos perform better on weekday evenings while your quick clips
          do well on weekend mornings. That kind of detail changes how you plan
          your week.
        </p>
      </FeaturePageSection>

      {/* Section 3: Content Theme Analysis */}
      <FeaturePageSection icon={Tags} heading="Content Theme Analysis">
        <p>
          Some topics just hit different with your audience. Astriq helps you
          identify which content themes drive the most engagement so you can
          double down on what works and stop guessing about what to create next.
        </p>
        <p className="mt-4">
          Here&apos;s the thing about content themes: you probably have an idea
          of what your audience likes, but your assumptions might be off. Maybe
          you think your &quot;day in my life&quot; videos are your bread and
          butter, but the data shows your tutorial content actually gets twice
          the engagement and way more profile visits. Astriq groups your content
          by theme and shows you the real performance numbers side by side, so
          you can see exactly where to focus.
        </p>
        <p className="mt-4">
          The copilot can also spot emerging trends in your data. If a new type
          of content is starting to gain traction with your audience, you&apos;ll
          know about it early enough to lean in. And when something stops
          working, you&apos;ll see that too — before you waste a week producing
          content nobody watches. Think of it as having a content strategist who
          has actually read every comment and watched every analytics report you
          never had time for.
        </p>
      </FeaturePageSection>

      {/* Section 4: Visual Planning with Canvas */}
      <FeaturePageSection
        icon={Layout}
        heading="Visual Planning with Canvas"
        reverse
      >
        <p>
          Map out your content calendar on the Canvas. Drag in insights from your
          analytics, arrange ideas by theme, and build a visual plan you can
          actually stick to. Think Pinterest board meets analytics dashboard.
        </p>
        <p className="mt-4">
          Most content calendars are boring spreadsheets or rigid templates that
          don&apos;t fit how creators actually think. The Canvas is different.
          It&apos;s a freeform space where you can lay out your content ideas
          visually, group them by theme or series, and pull in data from your
          analytics to inform what goes where. Want to plan a week of posts
          around a topic that&apos;s been performing well? Drag the performance
          data right onto your board as a reference.
        </p>
        <p className="mt-4">
          You can also use the Canvas to brainstorm. Throw ideas on the board,
          rearrange them, connect related concepts, and build out content series
          that flow naturally from one video to the next. It&apos;s the kind of
          planning tool that actually feels creative instead of feeling like
          homework. And because it lives right next to your analytics, you never
          have to switch between apps to check whether an idea has legs.
        </p>
      </FeaturePageSection>

      {/* Section 5: Multi-Account Strategy */}
      <FeaturePageSection icon={Users} heading="Multi-Account Strategy">
        <p>
          Running multiple accounts? Astriq lets you compare performance across
          all of them. See which strategies work on which accounts and
          cross-pollinate your best ideas without starting from scratch every
          time.
        </p>
        <p className="mt-4">
          If you manage more than one TikTok account — maybe a personal brand
          and a business page, or accounts in different niches — you know the
          pain of context switching. What works on one account doesn&apos;t
          always work on another, and keeping track of separate strategies in
          your head gets old fast. Astriq gives you a unified view so you can
          compare engagement rates, follower growth, and content performance
          across accounts in one place.
        </p>
        <p className="mt-4">
          The real power is in the cross-pollination. Maybe a content format
          that&apos;s crushing it on your fitness account would work for your
          cooking page too. Or maybe your posting schedule on one account reveals
          a timing pattern you should try on the other. The copilot can surface
          these connections for you, pointing out what&apos;s working where and
          suggesting ways to adapt your best-performing strategies across your
          whole portfolio of accounts.
        </p>
      </FeaturePageSection>

      <FeaturePageCta
        heading="Build your content strategy with data"
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
            label: "Video Analytics",
            href: "/features/video-analytics",
          },
        ]}
      />
    </>
  );
}
