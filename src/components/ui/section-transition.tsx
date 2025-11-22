'use client'

import React, { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

interface SectionTransitionProps {
  children: [React.ReactNode, React.ReactNode]
}

export function SectionTransition({ children }: SectionTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [firstSection, secondSection] = children

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  // Controlar a opacidade da primeira seção (fade out progressivo)
  const firstSectionOpacity = useTransform(
    scrollYProgress, 
    [0, 0.5, 0.8], 
    [1, 0.6, 0]
  )
  
  // Controlar a escala da primeira seção para dar efeito de zoom out
  const firstSectionScale = useTransform(
    scrollYProgress, 
    [0, 0.8], 
    [1, 0.85]
  )
  
  // Controlar o blur da primeira seção para efeito de profundidade
  const firstSectionBlur = useTransform(
    scrollYProgress,
    [0, 0.8],
    [0, 10]
  )

  return (
    <div ref={containerRef} className="relative" style={{ height: '200vh' }}>
      {/* Primeira Seção - Nosso Legado (fixa e fade out com blur) */}
      <div className="sticky top-0 h-screen overflow-hidden">
        <motion.div
          style={{ 
            opacity: firstSectionOpacity,
            scale: firstSectionScale,
            filter: useTransform(firstSectionBlur, (value) => `blur(${value}px)`),
          }}
          className="h-full w-full will-change-transform"
        >
          {firstSection}
        </motion.div>
        
        {/* Overlay gradual escurecendo para criar transição para preto */}
        <motion.div
          style={{
            opacity: useTransform(scrollYProgress, [0.3, 0.8], [0, 1]),
          }}
          className="absolute inset-0 bg-black pointer-events-none"
        />
      </div>

      {/* Segunda Seção - Desenvolvimentos (aparece depois do scroll) */}
      <div className="relative z-20 min-h-screen">
        {secondSection}
      </div>
    </div>
  )
}

