import type { Metadata } from "next";
import Script from "next/script";
import { Geist, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AccentColorProvider } from "@/contexts/accent-color-context";
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
  title: { default: "Astriq", template: "%s | Astriq" },
  description: "AI-powered analytics dashboard for content creators",
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
