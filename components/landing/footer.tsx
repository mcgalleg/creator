import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { AccentColorPicker } from "@/components/accent-color-picker";
import { AnimateOnScroll } from "@/components/landing/animate-on-scroll";
import { AstriqLogo } from "@/components/astriq-logo";

export function Footer() {
  return (
    <footer className="border-t bg-muted/20">
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <AnimateOnScroll>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand column */}
            <div className="space-y-4">
              <AstriqLogo variant="combo" size="sm" />
              <p className="text-sm text-muted-foreground">
                AI-powered TikTok analytics for creators and brands.
              </p>
              <AccentColorPicker />
            </div>

            {/* Product column */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="/#ai-copilot"
                    className="hover:text-foreground transition-colors"
                  >
                    AI Copilot
                  </a>
                </li>
                <li>
                  <a
                    href="/#pricing"
                    className="hover:text-foreground transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="/#canvas"
                    className="hover:text-foreground transition-colors"
                  >
                    Canvas
                  </a>
                </li>
              </ul>
            </div>

            {/* Resources column */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/docs"
                    className="hover:text-foreground transition-colors"
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <a
                    href="/#faq"
                    className="hover:text-foreground transition-colors"
                  >
                    FAQ
                  </a>
                </li>
                <li>
                  <Link
                    href="/support"
                    className="hover:text-foreground transition-colors"
                  >
                    Contact Support
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal column */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-foreground transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-foreground transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </AnimateOnScroll>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; 2026 Astriq. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Built with AI. Designed for creators.
          </p>
        </div>
      </div>
    </footer>
  );
}
