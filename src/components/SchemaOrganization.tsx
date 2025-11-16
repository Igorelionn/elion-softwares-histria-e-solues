export default function SchemaOrganization() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Elion Softwares",
    "alternateName": "Elion",
    "url": "https://elionsoftwares.com.br",
    "logo": "https://elionsoftwares.com.br/logo.png",
    "image": "https://elionsoftwares.com.br/logo.png",
    "description": "História e Soluções - Desenvolvimento de software personalizado, soluções tecnológicas inovadoras e consultoria em TI",
    "email": "contato@elionsoftwares.com.br",
    "foundingDate": "2024",
    "founder": {
      "@type": "Person",
      "name": "Elion Team"
    },
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "BR",
      "addressLocality": "Brasil"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "email": "contato@elionsoftwares.com.br",
      "availableLanguage": ["Portuguese", "English", "Spanish"]
    },
    "sameAs": [
      "https://github.com/Igorelionn/elion-softwares-histria-e-solues"
    ],
    "knowsAbout": [
      "Software Development",
      "Web Development",
      "Mobile Development",
      "Cloud Computing",
      "Database Management",
      "UI/UX Design"
    ],
    "slogan": "História e Soluções"
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

