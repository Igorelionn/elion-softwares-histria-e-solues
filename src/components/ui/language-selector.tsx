"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

const languages: Language[] = [
  { code: "pt", name: "Português (Brasil)", nativeName: "Português" },
  { code: "en", name: "English (US)", nativeName: "English" },
  { code: "es", name: "Español", nativeName: "Español" },
  { code: "fr", name: "Français", nativeName: "Français" },
  { code: "de", name: "Deutsch", nativeName: "Deutsch" },
  { code: "it", name: "Italiano", nativeName: "Italiano" },
  { code: "zh", name: "中文", nativeName: "中文" },
  { code: "ja", name: "日本語", nativeName: "日本語" },
];

interface LanguageSelectorProps {
  selectedLanguage: string;
  onSelectLanguage: (languageCode: string) => void;
  className?: string;
}

export function LanguageSelector({
  selectedLanguage,
  onSelectLanguage,
  className,
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredLanguages = languages.filter(
    (language) =>
      language.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      language.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectLanguage = (languageCode: string) => {
    onSelectLanguage(languageCode);
    setIsOpen(false);
    setSearchQuery("");
  };

  // Função para obter URL da bandeira usando flagcdn
  const getFlagUrl = (languageCode: string) => {
    const flagMapping: Record<string, string> = {
      pt: "br", // Brasil
      en: "us", // Estados Unidos
      es: "es", // Espanha
      fr: "fr", // França
      de: "de", // Alemanha
      it: "it", // Itália
      zh: "cn", // China
      ja: "jp", // Japão
    };
    const countryCode = flagMapping[languageCode] || languageCode;
    return `https://flagcdn.com/w40/${countryCode}.png`;
  };

  const selectedLang = languages.find((lang) => lang.code === selectedLanguage) || languages[0];

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-11 flex items-center justify-between gap-3 px-4 py-2 border border-gray-300 rounded-md bg-white hover:border-gray-400 transition-colors cursor-pointer focus:outline-none focus:ring-0 focus:border-black"
        style={{ boxShadow: 'none' }}
      >
        <div className="flex items-center gap-3">
          <img 
            src={getFlagUrl(selectedLang.code)} 
            alt={selectedLang.name}
            className="w-6 h-4 object-cover rounded-sm"
          />
          <span className="text-gray-900 text-sm">{selectedLang.name}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 right-0 top-full mt-2 z-50 rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden"
            >
              <div className="p-2 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar idioma..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 text-sm"
                    autoFocus
                  />
                </div>
              </div>

              <div className="overflow-y-auto max-h-64">
                {filteredLanguages.length > 0 ? (
                  filteredLanguages.map((language) => (
                    <button
                      key={language.code}
                      type="button"
                      onClick={() => handleSelectLanguage(language.code)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors cursor-pointer",
                        selectedLanguage === language.code && "bg-gray-50"
                      )}
                    >
                      <img 
                        src={getFlagUrl(language.code)} 
                        alt={language.name}
                        className="w-6 h-4 object-cover rounded-sm"
                      />
                      <div className="flex-1">
                        <div className="text-sm text-gray-900 font-medium">{language.name}</div>
                      </div>
                      {selectedLanguage === language.code && (
                        <Check className="h-4 w-4 text-gray-900" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-gray-400 text-sm">
                    Nenhum idioma encontrado
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export { languages };

