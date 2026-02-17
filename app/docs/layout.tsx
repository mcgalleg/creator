import { Nav } from "@/components/landing/nav";
import { Footer } from "@/components/landing/footer";
import { DocsSidebar } from "@/components/docs/docs-sidebar";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <Nav />
      <div className="flex flex-1">
        <DocsSidebar />
        <main className="flex-1 min-w-0">
          <div className="container mx-auto max-w-3xl px-4 py-10 lg:px-8 lg:py-12">
            {children}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
