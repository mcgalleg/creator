import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/themes";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={{ theme: shadcn }}>
      {children}
    </ClerkProvider>
  );
}
