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
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon.png", sizes: "64x64", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "manifest", url: "/site.webmanifest" },
    ],
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
