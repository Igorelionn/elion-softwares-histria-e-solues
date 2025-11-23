import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { QueryProvider } from "@/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";
import { BlockGuard } from "@/components/BlockGuard";
import { SecurityURLCleaner } from "@/components/SecurityURLCleaner";
import { StructuredData } from "@/components/StructuredData";

export const metadata: Metadata = {
  metadataBase: new URL('https://elionsoftwares.com'),
  title: {
    default: "Elion Softwares - Desenvolvimento de Software sob Medida",
    template: "%s | Elion Softwares"
  },
  description: "Empresas modernas demandam mais do que softwares, necessitam de sistemas que evoluam em sintonia com sua trajetória. A Elion Softwares desenvolve plataformas sob medida que se conectam à essência do seu negócio.",
  keywords: ["desenvolvimento de software", "software sob medida", "sistemas personalizados", "elion softwares", "desenvolvimento web", "aplicações empresariais", "soluções tecnológicas"],
  authors: [{ name: "Elion Softwares" }],
  creator: "Elion Softwares",
  publisher: "Elion Softwares",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://elionsoftwares.com",
    siteName: "Elion Softwares",
    title: "Elion Softwares - Desenvolvimento de Software sob Medida",
    description: "Desenvolvemos plataformas sob medida que se conectam à essência do seu negócio. Excelência em engenharia de software.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Elion Softwares - Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elion Softwares - Desenvolvimento de Software sob Medida",
    description: "Desenvolvemos plataformas sob medida que se conectam à essência do seu negócio.",
    images: ["/og-image.png"],
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
    google: "8KdnGoS2iYpzuU056royOS3U2pWLOQ9UjwNgB8INe70",
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
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Elion Softwares" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />

        {/* Preconnect para recursos externos críticos */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>
      <body className="antialiased relative">
        <StructuredData />
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
