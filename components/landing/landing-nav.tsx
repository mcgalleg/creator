"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AccentColorPicker } from "@/components/accent-color-picker";
import { AstriqLogo } from "@/components/astriq-logo";
import { trackCtaClicked } from "@/lib/analytics";

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHasSession(document.cookie.includes("__session"));
    const onScroll = () => setScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-shadow ${
        scrolled ? "shadow-sm" : ""
      }`}
    >
      <div className="flex h-16 items-center justify-between px-3 md:px-4">
        <Link href="/" className="flex items-center gap-2">
          <AstriqLogo variant="combo" size="lg" />
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <a
            href="/#features"
            className="hidden text-sm text-muted-foreground hover:text-foreground transition-colors sm:inline-block"
          >
            Features
          </a>
          <a
            href="/#pricing"
            className="hidden text-sm text-muted-foreground hover:text-foreground transition-colors sm:inline-block"
          >
            Pricing
          </a>
          <a
            href="/#faq"
            className="hidden text-sm text-muted-foreground hover:text-foreground transition-colors sm:inline-block"
          >
            FAQ
          </a>
          <Link
            href="/docs"
            className="hidden text-sm text-muted-foreground hover:text-foreground transition-colors sm:inline-block"
          >
            Docs
          </Link>
          <div className="hidden sm:flex">
            {mounted && <AccentColorPicker />}
          </div>
          {mounted && hasSession ? (
            <Link href="/workspace" onClick={() => trackCtaClicked("Go to Workspace", "nav")}>
              <Button size="sm">
                <span className="sm:hidden">Workspace</span>
                <span className="hidden sm:inline">Go to Workspace</span>
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/workspace" onClick={() => trackCtaClicked("Sign In", "nav")}>
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/workspace" onClick={() => trackCtaClicked("Get Started", "nav")}>
                <Button size="sm">
                  <span className="sm:hidden">Start</span>
                  <span className="hidden sm:inline">Get Started</span>
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
