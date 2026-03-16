import type { Metadata } from "next";
import Script from "next/script";
import { Geist, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AccentColorProvider } from "@/contexts/accent-color-context";
import { OrganizationJsonLd } from "@/components/organization-jsonld";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Primary sans-serif font
const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

// Monospace font for code and numbers
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://astriq.app"
  ),
  title: {
    default: "Astriq — AI-Powered TikTok Analytics for Creators",
    template: "%s | Astriq",
  },
  description:
    "AI-powered TikTok analytics dashboard for content creators. Get actionable insights on your videos, audience, and engagement.",
  openGraph: {
    type: "website",
    siteName: "Astriq",
    title: "Astriq — AI-Powered TikTok Analytics for Creators",
    description:
      "AI-powered TikTok analytics dashboard for content creators. Get actionable insights on your videos, audience, and engagement.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Astriq — AI-Powered TikTok Analytics for Creators",
    description:
      "AI-powered TikTok analytics dashboard for content creators. Get actionable insights on your videos, audience, and engagement.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-accent="blue" suppressHydrationWarning>
      <head>
        <Script id="accent-color-init" strategy="beforeInteractive">
          {`(function(){try{var a=localStorage.getItem('accent-color');if(a)document.documentElement.setAttribute('data-accent',a)}catch(e){}})()`}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <OrganizationJsonLd />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AccentColorProvider>
            {children}
            <Toaster />
          </AccentColorProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
