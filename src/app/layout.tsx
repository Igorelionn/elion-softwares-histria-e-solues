import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { QueryProvider } from "@/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";
import { BlockGuard } from "@/components/BlockGuard";
import { SecurityURLCleaner } from "@/components/SecurityURLCleaner";
import SchemaOrganization from "@/components/SchemaOrganization";

export const metadata: Metadata = {
  metadataBase: new URL('https://elionsoftwares.com.br'),
  title: {
    default: "Elion Softwares - História e Soluções",
    template: "%s | Elion Softwares"
  },
  description: "Desenvolvimento de software personalizado, soluções tecnológicas inovadoras e consultoria em TI. Transformamos suas ideias em realidade com tecnologia de ponta.",
  keywords: ["desenvolvimento de software", "software personalizado", "consultoria TI", "desenvolvimento web", "soluções tecnológicas", "Elion Softwares"],
  authors: [{ name: "Elion Softwares" }],
  creator: "Elion Softwares",
  publisher: "Elion Softwares",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
    shortcut: "/favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://elionsoftwares.com.br",
    siteName: "Elion Softwares",
    title: "Elion Softwares - História e Soluções",
    description: "Desenvolvimento de software personalizado, soluções tecnológicas inovadoras e consultoria em TI",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Elion Softwares Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elion Softwares - História e Soluções",
    description: "Desenvolvimento de software personalizado, soluções tecnológicas inovadoras e consultoria em TI",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "B8ZFo1HH0h-p8pRPaG_FA5Ip2xptNEo9hsHxlhsX9n0",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Removido log excessivo - só mostrar em caso de problemas
  return (
    <html lang="pt-BR" className="relative">
      <head>
        {/* Preconnect para recursos externos críticos */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>
      <body className="antialiased relative">
        <SchemaOrganization />
        <SecurityURLCleaner />
        <QueryProvider>
        <LanguageProvider>
          <BlockGuard>
            {children}
          </BlockGuard>
        </LanguageProvider>
        </QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
