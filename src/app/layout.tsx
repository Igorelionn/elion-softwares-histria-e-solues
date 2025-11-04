import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Toaster } from "@/components/ui/sonner";
import { BlockGuard } from "@/components/BlockGuard";
import { SecurityURLCleaner } from "@/components/SecurityURLCleaner";

export const metadata: Metadata = {
  title: "Elion Softwares",
  description: "História e Soluções",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" style={{ position: 'relative' }}>
      <head>
        {/* Preconnect para recursos externos críticos */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>
      <body className="antialiased relative" style={{ position: 'relative' }}>
        <SecurityURLCleaner />
        <LanguageProvider>
          <BlockGuard>
            {children}
          </BlockGuard>
        </LanguageProvider>
        <Toaster />
      </body>
    </html>
  );
}