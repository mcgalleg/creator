import { Nav } from "@/components/landing/nav";
import { Footer } from "@/components/landing/footer";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Scale } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Not a Bot",
  description:
    "Terms of service for Not a Bot — AI-powered TikTok analytics for creators and brands.",
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <Nav />
      <main className="flex-1">
        <div className="container mx-auto max-w-4xl px-4 py-16">
          {/* Header */}
          <div className="space-y-4">
            <Badge variant="secondary" className="gap-1.5">
              <Scale className="h-3.5 w-3.5" />
              Legal
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight">
              Terms of Service
            </h1>
            <p className="text-muted-foreground">
              Effective date: February 14, 2026
            </p>
          </div>

          <Separator className="my-8" />

          {/* 1. Acceptance of Terms */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using Not a Bot, you agree to be bound by these
              Terms of Service and all applicable laws and regulations. If you do
              not agree with any of these terms, you are prohibited from using or
              accessing the service. These terms constitute a legally binding
              agreement between you and Not a Bot.
            </p>
          </section>

          <Separator className="my-8" />

          {/* 2. Description of Service */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">2. Description of Service</h2>
            <p className="text-muted-foreground">
              Not a Bot is an AI-powered TikTok analytics platform that provides
              creators and brands with actionable insights into their content
              performance. Our service includes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>
                Customizable dashboard with 30+ widgets for tracking performance
                metrics
              </li>
              <li>
                AI copilot for natural language data queries and analysis
              </li>
              <li>
                Canvas workspace for visual data exploration and collaboration
              </li>
              <li>Comment sentiment analysis and moderation tools</li>
              <li>
                Multi-account data syncing for comprehensive analytics
              </li>
            </ul>
          </section>

          <Separator className="my-8" />

          {/* 3. Account Registration */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">3. Account Registration</h2>
            <p className="text-muted-foreground">
              To use Not a Bot, you must create an account. By registering, you
              agree to the following:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>You must be at least 18 years of age to use the service</li>
              <li>
                Only one account per person is permitted
              </li>
              <li>
                Authentication is managed via Clerk, our third-party
                authentication provider
              </li>
              <li>
                You are responsible for maintaining the security of your account
                and password
              </li>
              <li>
                You must provide accurate and complete information during
                registration and keep it up to date
              </li>
            </ul>
          </section>

          <Separator className="my-8" />

          {/* 4. Subscription Plans & Billing */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              4. Subscription Plans &amp; Billing
            </h2>
            <p className="text-muted-foreground">
              Not a Bot offers two subscription tiers:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>
                <strong>Creator</strong> — $14.99/month with expanded features
                and higher usage limits
              </li>
              <li>
                <strong>Pro</strong> — $29.99/month with full access to all
                features and maximum usage allocations
              </li>
            </ul>
            <p className="text-muted-foreground">
              New users receive a 7-day free trial with Creator-level access. All billing
              is processed via Polar. Subscriptions automatically renew at the
              end of each billing period unless cancelled. You may cancel your
              subscription at any time and will retain access to your current
              tier through the end of the billing period.
            </p>
          </section>

          <Separator className="my-8" />

          {/* 5. Credits & Usage */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">5. Credits &amp; Usage</h2>
            <p className="text-muted-foreground">
              Sync credits and AI tokens are allocated monthly based on your
              subscription tier:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>
                <strong>Creator</strong> — 250 sync credits + 1,000,000 AI
                tokens per month
              </li>
              <li>
                <strong>Pro</strong> — 750 sync credits + 3,000,000 AI tokens
                per month
              </li>
            </ul>
            <p className="text-muted-foreground">
              Unused monthly allocations do not roll over to the next billing
              period. Additional credits may be purchased as one-time credit
              packs, which never expire:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>
                <strong>Starter</strong> — 100 credits for $4.99
              </li>
              <li>
                <strong>Value</strong> — 300 credits for $9.99
              </li>
              <li>
                <strong>Power</strong> — 750 credits for $19.99
              </li>
              <li>
                <strong>Bulk</strong> — 1,500 credits for $34.99
              </li>
            </ul>
          </section>

          <Separator className="my-8" />

          {/* 6. TikTok Data & API Usage */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              6. TikTok Data &amp; API Usage
            </h2>
            <p className="text-muted-foreground">
              Not a Bot accesses TikTok data through the official TikTok API. By
              using our service, you acknowledge and agree that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>
                You must have the rights and authorization to connect and access
                data for all TikTok accounts you link to the service
              </li>
              <li>
                Not a Bot is not affiliated with, endorsed by, or sponsored by
                TikTok or ByteDance Ltd.
              </li>
              <li>
                Data accuracy and availability depend on the TikTok API and may
                be subject to changes, rate limits, or disruptions outside our
                control
              </li>
            </ul>
          </section>

          <Separator className="my-8" />

          {/* 7. AI-Generated Content */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">7. AI-Generated Content</h2>
            <p className="text-muted-foreground">
              Not a Bot uses artificial intelligence to provide analytics,
              insights, and recommendations. You acknowledge that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>
                AI-generated analysis is provided for informational purposes only
              </li>
              <li>
                AI output is not guaranteed to be accurate, complete, or
                up-to-date
              </li>
              <li>
                You are solely responsible for any decisions made based on
                AI-generated insights
              </li>
              <li>
                We do not warrant the accuracy, reliability, or suitability of
                any AI-generated content
              </li>
            </ul>
          </section>

          <Separator className="my-8" />

          {/* 8. Acceptable Use */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">8. Acceptable Use</h2>
            <p className="text-muted-foreground">
              You agree not to engage in any of the following prohibited
              activities:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>
                Reverse engineer, decompile, or disassemble any part of the
                service
              </li>
              <li>
                Use automated tools, bots, or scrapers beyond the features
                provided by the service
              </li>
              <li>
                Abuse or attempt to circumvent usage limits, rate limits, or
                credit allocations
              </li>
              <li>
                Use the service in a manner that violates TikTok&apos;s terms of
                service
              </li>
              <li>
                Share your account credentials with third parties
              </li>
              <li>
                Use the service for any illegal or unauthorized purpose
              </li>
            </ul>
          </section>

          <Separator className="my-8" />

          {/* 9. Intellectual Property */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">9. Intellectual Property</h2>
            <p className="text-muted-foreground">
              Not a Bot and its underlying technology, including software,
              algorithms, designs, and documentation, are the intellectual
              property of Not a Bot and are protected by applicable intellectual
              property laws. You retain full ownership of your TikTok data.
              Analytics, visualizations, and exports generated through the
              service are yours to use freely for any purpose.
            </p>
          </section>

          <Separator className="my-8" />

          {/* 10. Data Retention & Deletion */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              10. Data Retention &amp; Deletion
            </h2>
            <p className="text-muted-foreground">
              Data is retained based on your subscription tier:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>
                <strong>Creator</strong> — 30 days of data retention
              </li>
              <li>
                <strong>Pro</strong> — 90 days of data retention
              </li>
            </ul>
            <p className="text-muted-foreground">
              You may request full deletion of your data at any time by
              contacting us. Deleting your account will permanently remove all
              associated data, including analytics, settings, and connected
              account information.
            </p>
          </section>

          <Separator className="my-8" />

          {/* 11. Limitation of Liability */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              11. Limitation of Liability
            </h2>
            <p className="text-muted-foreground">
              The service is provided &ldquo;as is&rdquo; and &ldquo;as
              available&rdquo; without warranties of any kind, either express or
              implied. To the fullest extent permitted by law, Not a Bot shall
              not be liable for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>
                Changes, disruptions, or discontinuation of the TikTok API
              </li>
              <li>Data loss or inaccuracies in analytics</li>
              <li>
                Decisions made based on AI-generated analysis or recommendations
              </li>
              <li>
                Disruptions caused by third-party services, including payment
                processors and authentication providers
              </li>
            </ul>
            <p className="text-muted-foreground">
              Our maximum aggregate liability for any claims arising from your
              use of the service shall be limited to the total fees you have paid
              to Not a Bot in the 12 months preceding the claim.
            </p>
          </section>

          <Separator className="my-8" />

          {/* 12. Termination */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">12. Termination</h2>
            <p className="text-muted-foreground">
              We reserve the right to suspend or terminate your account at any
              time if you violate these Terms of Service. You may cancel your
              subscription and delete your account at any time. Upon termination,
              your data will be deleted in accordance with our data retention
              policy. Any prepaid fees for the current billing period are
              non-refundable.
            </p>
          </section>

          <Separator className="my-8" />

          {/* 13. Changes to Terms */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">13. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these Terms of Service at any time.
              Material changes will be communicated via email or in-app
              notification at least 30 days before they take effect. Your
              continued use of the service after changes take effect constitutes
              your acceptance of the revised terms.
            </p>
          </section>

          <Separator className="my-8" />

          {/* 14. Contact */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">14. Contact</h2>
            <p className="text-muted-foreground">
              If you have any questions about these Terms of Service, please
              contact us at{" "}
              <a
                href="mailto:support@notabot.app"
                className="text-foreground underline underline-offset-4 hover:text-foreground/80"
              >
                support@notabot.app
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
