"use client";

import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AnimateOnScroll } from "@/components/landing/animate-on-scroll";
import { FAQ_ITEMS } from "@/lib/faq-data";

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
