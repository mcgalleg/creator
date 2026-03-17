import Link from "next/link";
import { Button } from "@/components/ui/button";

interface FeaturePageCtaProps {
  heading: string;
  description: string;
  relatedPages: { label: string; href: string }[];
}

export function FeaturePageCta({
  heading,
  description,
  relatedPages,
}: FeaturePageCtaProps) {
  return (
    <section className="border-t bg-muted/30 py-20 md:py-28">
      <div className="container mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {heading}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          {description}
        </p>
        <div className="mt-8">
          <Button asChild size="lg">
            <Link href="/pricing">View Pricing</Link>
          </Button>
        </div>
        {relatedPages.length > 0 && (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {relatedPages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                {page.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
