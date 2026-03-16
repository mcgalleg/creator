import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="text-4xl font-bold tracking-tight">{children}</h1>
    ),
    h2: ({ children }) => (
      <>
        <Separator className="my-8" />
        <h2 className="text-xl font-semibold">{children}</h2>
      </>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-medium">{children}</h3>
    ),
    p: ({ children }) => (
      <p className="text-muted-foreground">{children}</p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-inside space-y-2 text-muted-foreground">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
        {children}
      </ol>
    ),
    li: ({ children }) => <li>{children}</li>,
    strong: ({ children }) => <strong className="text-foreground">{children}</strong>,
    a: ({ href, children }) => {
      const isExternal = href?.startsWith("http") || href?.startsWith("mailto:");
      if (isExternal) {
        return (
          <a
            href={href}
            className="text-foreground underline underline-offset-4 hover:text-foreground/80"
            target={href?.startsWith("mailto:") ? undefined : "_blank"}
            rel={href?.startsWith("mailto:") ? undefined : "noopener noreferrer"}
          >
            {children}
          </a>
        );
      }
      return (
        <Link
          href={href || "#"}
          className="text-foreground underline underline-offset-4 hover:text-foreground/80"
        >
          {children}
        </Link>
      );
    },
    hr: () => <Separator className="my-8" />,
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-accent pl-4 text-muted-foreground italic">
        {children}
      </blockquote>
    ),
    code: ({ children }) => (
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
        {children}
      </code>
    ),
    ...components,
  };
}
