import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/themes";
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
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Astriq",
  description: "AI-powered analytics dashboard for content creators",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={{ theme: shadcn }}>
      <html lang="en" data-accent="blue" suppressHydrationWarning>
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var a=localStorage.getItem('accent-color');if(a)document.documentElement.setAttribute('data-accent',a)}catch(e){}})()`,
            }}
          />
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
    </ClerkProvider>
  );
}
