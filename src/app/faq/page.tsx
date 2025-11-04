'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useTranslation } from '@/contexts/LanguageContext'

interface FAQItem {
  id: number
  question: string
  answer: string
}

const FAQAccordionItem = ({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="border-b border-white/10"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-6 text-left hover:text-white transition-colors group cursor-pointer"
      >
        <span className="text-lg font-medium text-white/90 group-hover:text-white pr-8">
          {item.question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-white/60 group-hover:text-white" />
        </motion.div>
      </button>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pb-6 text-white/70 leading-relaxed">
              {item.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function FAQPage() {
  const { t } = useTranslation()
  const [openId, setOpenId] = useState<number | null>(null)

  // Map translations to FAQ items with IDs
  const faqData: FAQItem[] = t.faq.items.map((item, index) => ({
    id: index + 1,
    question: item.question,
    answer: item.answer,
  }))

  const toggleAccordion = (id: number) => {
    setOpenId(openId === id ? null : id)
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header com logo e botão voltar */}
      <header className="bg-black sticky top-0 z-50">
        <div className="w-full px-8 md:px-16 lg:px-24 py-10 flex items-center justify-between">
          <Link 
            href="/"
            className="text-white/80 hover:text-white text-base font-medium transition-colors"
          >
            ← {t.faq.back}
          </Link>
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/logo-white.png" alt="Elion Softwares" className="h-6" />
          </Link>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t.faq.title}
          </h1>
          <p className="text-white/60 text-lg">
            {t.faq.subtitle}
          </p>
        </motion.div>

        <div className="space-y-0">
          {faqData.map((item) => (
            <FAQAccordionItem
              key={item.id}
              item={item}
              isOpen={openId === item.id}
              onToggle={() => toggleAccordion(item.id)}
            />
          ))}
        </div>
      </main>
    </div>
  )
}

