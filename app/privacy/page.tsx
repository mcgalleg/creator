import { Nav } from "@/components/landing/nav";
import { Footer } from "@/components/landing/footer";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Astriq",
  description:
    "Privacy policy for Astriq — how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <Nav />
      <main className="flex-1">
        <div className="container mx-auto max-w-4xl px-4 py-16">
          {/* Header */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              Privacy Policy
            </h1>
            <Badge variant="secondary" className="gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              Your data, your control
            </Badge>
            <p className="text-muted-foreground">
              Effective date: February 14, 2026
            </p>
          </div>

          <Separator className="my-8" />

          {/* Introduction */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Introduction</h2>
            <p className="text-muted-foreground">
              Astriq is operated by Astriq (&ldquo;we&rdquo;,
              &ldquo;us&rdquo;, &ldquo;our&rdquo;). This Privacy Policy
              explains how we collect, use, store, and protect your information
              when you use our AI-powered TikTok analytics platform.
            </p>
            <p className="text-muted-foreground">
              By using Astriq, you agree to the collection and use of
              information in accordance with this policy.
            </p>
          </section>

          <Separator className="my-8" />

          {/* Information We Collect */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Information We Collect</h2>
            <p className="text-muted-foreground">
              We collect the following types of information to provide and
              improve our services:
            </p>
            <h3 className="text-lg font-medium">Account Information</h3>
            <p className="text-muted-foreground">
              When you create an account via Clerk, we collect your name, email
              address, and profile image.
            </p>
            <h3 className="text-lg font-medium">TikTok Data</h3>
            <p className="text-muted-foreground">
              When you connect your TikTok account, we access data via the
              TikTok API, including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Videos and video metadata</li>
              <li>Comments and replies</li>
              <li>Engagement metrics (likes, shares, views)</li>
              <li>Follower statistics</li>
            </ul>
            <h3 className="text-lg font-medium">Usage and Analytics Data</h3>
            <p className="text-muted-foreground">
              We collect information about how you interact with the platform,
              including pages visited, features used, and AI copilot queries.
            </p>
          </section>

          <Separator className="my-8" />

          {/* How We Use Your Information */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              How We Use Your Information
            </h2>
            <p className="text-muted-foreground">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Provide and maintain your analytics dashboard</li>
              <li>
                Power AI copilot analysis of your TikTok performance and content
              </li>
              <li>
                Perform comment sentiment analysis and engagement insights
              </li>
              <li>
                Run sync services to keep your TikTok data up to date
              </li>
              <li>Improve the platform and develop new features</li>
            </ul>
          </section>

          <Separator className="my-8" />

          {/* AI Processing */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">AI Processing</h2>
            <p className="text-muted-foreground">
              Astriq uses AI models to analyze your TikTok data and provide
              actionable insights, including content performance analysis,
              audience trends, and comment sentiment.
            </p>
            <p className="text-muted-foreground">
              Your queries and AI-generated results are not used to train AI
              models. Your data is processed solely to deliver insights to you.
            </p>
            <p className="text-muted-foreground">
              AI token usage is tracked on a per-account basis according to your
              subscription tier. Usage limits and quotas are clearly displayed in
              your dashboard.
            </p>
          </section>

          <Separator className="my-8" />

          {/* Data Storage & Retention */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Data Storage &amp; Retention
            </h2>
            <p className="text-muted-foreground">
              Your data is stored securely on managed infrastructure. We retain
              your TikTok data based on your subscription tier:
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
              Data beyond the retention window for your tier is automatically
              removed. Account information is retained for as long as your
              account is active.
            </p>
          </section>

          <Separator className="my-8" />

          {/* Third-Party Services */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Third-Party Services</h2>
            <p className="text-muted-foreground">
              We rely on the following third-party services to operate the
              platform:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>
                <strong>Clerk</strong> — Authentication and user management
              </li>
              <li>
                <strong>TikTok API</strong> — Data source for your TikTok
                account information
              </li>
              <li>
                <strong>Polar</strong> — Payment processing and subscription
                management
              </li>
              <li>
                <strong>AI model providers</strong> — Data analysis and insight
                generation
              </li>
            </ul>
            <p className="text-muted-foreground">
              Each third-party service operates under its own privacy policy. We
              encourage you to review their policies.
            </p>
          </section>

          <Separator className="my-8" />

          {/* Data Sharing */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Data Sharing</h2>
            <p className="text-muted-foreground">
              We do not sell your personal data. We do not share your data with
              third parties for advertising purposes.
            </p>
            <p className="text-muted-foreground">
              Data is shared only with service providers necessary for the
              operation of the platform, as described in the Third-Party
              Services section above.
            </p>
          </section>

          <Separator className="my-8" />

          {/* Your Rights */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Your Rights</h2>
            <p className="text-muted-foreground">
              You have the following rights regarding your data:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Access the data we hold about you</li>
              <li>Request corrections to inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data via dashboard export features</li>
              <li>Delete your account at any time</li>
            </ul>
            <p className="text-muted-foreground">
              To exercise any of these rights, use the relevant features in your
              dashboard or contact us at support@astriq.ai.
            </p>
          </section>

          <Separator className="my-8" />

          {/* Cookies & Tracking */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Cookies &amp; Tracking</h2>
            <p className="text-muted-foreground">
              We use essential authentication cookies provided by Clerk to keep
              you signed in and maintain your session.
            </p>
            <p className="text-muted-foreground">
              We do not use third-party advertising cookies or tracking pixels.
              No data is shared with ad networks.
            </p>
          </section>

          <Separator className="my-8" />

          {/* Security */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Security</h2>
            <p className="text-muted-foreground">
              We implement industry-standard security measures to protect your
              data, including encrypted data transmission (TLS), secure
              authentication via Clerk, and access controls on all internal
              systems.
            </p>
            <p className="text-muted-foreground">
              While no method of transmission over the Internet is 100% secure,
              we strive to use commercially acceptable means to protect your
              personal information.
            </p>
          </section>

          <Separator className="my-8" />

          {/* Children's Privacy */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Children&apos;s Privacy
            </h2>
            <p className="text-muted-foreground">
              Astriq is not directed at children under the age of 13. We do
              not knowingly collect personal information from children under 13.
              If we become aware that we have collected data from a child under
              13, we will take steps to delete that information promptly.
            </p>
          </section>

          <Separator className="my-8" />

          {/* Changes to This Policy */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. Material
              changes will be communicated via email or in-app notification.
            </p>
            <p className="text-muted-foreground">
              Your continued use of Astriq after any changes to this policy
              constitutes your acceptance of the updated terms.
            </p>
          </section>

          <Separator className="my-8" />

          {/* Contact Us */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy or how we
              handle your data, please contact us at{" "}
              <a
                href="mailto:support@astriq.ai"
                className="text-foreground underline underline-offset-4 hover:text-foreground/80"
              >
                support@astriq.ai
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
