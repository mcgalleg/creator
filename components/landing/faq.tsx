"use client";

import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AnimateOnScroll } from "@/components/landing/animate-on-scroll";

const FAQ_ITEMS = [
  {
    question: "What is Astriq?",
    answer:
      "Astriq is an AI-powered TikTok analytics platform that helps creators understand their performance, discover trends, and grow their audience with data-driven insights.",
  },
  {
    question: "How does the AI copilot work?",
    answer:
      "Ask questions in plain English about your TikTok data and get instant, actionable insights. The AI analyzes your videos, engagement, audience, and trends to give you personalized recommendations.",
  },
  {
    question: "Is my TikTok data safe?",
    answer:
      "Your data is encrypted at rest and in transit. We never store your password, share your data with third parties, or use it for any purpose other than providing you with analytics.",
  },
  {
    question: "What are sync credits?",
    answer:
      "Sync credits are used to pull fresh data from TikTok. Each sync fetches your latest video performance, follower stats, and engagement metrics. Your plan includes monthly credits based on your tier.",
  },
  {
    question: "Can I manage multiple TikTok accounts?",
    answer:
      "Yes! Creator and Pro plans support multiple accounts. The Creator plan supports up to 5 connected accounts, while the Pro plan supports up to 25, making it ideal for agencies and multi-brand creators.",
  },
  {
    question: "What is the Canvas workspace?",
    answer:
      "Canvas is a freeform workspace where you can create custom drawings and diagrams from your data set. Add shapes, text, sticky notes, and sketches to visually map out your content strategy and insights.",
  },
  {
    question: "Do I need a credit card to start?",
    answer:
      "No! Start with a free 7-day trial with Creator-level access, no credit card required. Experience all premium features before deciding on a plan.",
  },
  {
    question: "Can I upgrade or downgrade anytime?",
    answer:
      "Absolutely. Change your plan at any time from your account settings. Upgrades take effect immediately, and downgrades apply at the end of your current billing cycle.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="bg-muted/30 border-y py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <AnimateOnScroll className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            FAQ
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about Astriq. Can&apos;t find what
            you&apos;re looking for? Reach out to our support team.
          </p>
        </AnimateOnScroll>

        <AnimateOnScroll delay={100}>
          <Accordion
            type="single"
            collapsible
            className="max-w-3xl mx-auto"
          >
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">{item.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
