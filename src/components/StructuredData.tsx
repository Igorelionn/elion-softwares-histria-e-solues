"use client";

export function StructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Elion Softwares",
    "url": "https://elionsoftwares.com",
    "logo": "https://elionsoftwares.com/logo-black.png",
    "description": "Desenvolvemos plataformas sob medida que se conectam à essência do seu negócio. Excelência em engenharia de software.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Maceió",
      "addressRegion": "AL",
      "addressCountry": "BR"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+55-82-98888-0909",
      "contactType": "customer service",
      "email": "oficialelionsoftwares@gmail.com",
      "availableLanguage": ["Portuguese", "English"]
    },
    "sameAs": [
      "https://www.instagram.com/elionsoftwares",
      "https://www.facebook.com/elionsoftwares",
      "https://www.youtube.com/@elionsoftwares"
    ]
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Elion Softwares",
    "url": "https://elionsoftwares.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://elionsoftwares.com/?s={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": "Elion Softwares",
    "url": "https://elionsoftwares.com",
    "logo": "https://elionsoftwares.com/logo-black.png",
    "image": "https://elionsoftwares.com/og-image.png",
    "description": "Desenvolvimento de software sob medida, sistemas personalizados e soluções tecnológicas empresariais.",
    "priceRange": "$$",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Maceió",
      "addressRegion": "AL",
      "addressCountry": "BR"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "-9.6658",
      "longitude": "-35.7353"
    },
    "telephone": "+55-82-98888-0909",
    "email": "oficialelionsoftwares@gmail.com"
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
    </>
  );
}

