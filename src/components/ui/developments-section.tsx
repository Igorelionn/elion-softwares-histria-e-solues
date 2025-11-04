 'use client'

import React from "react";
import VideoPlayer from "@/components/ui/video-player";
import { OnboardingChecklist } from "@/components/ui/onboarding-checklist";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { TextEffect } from "@/components/ui/text-effect";
import { useTranslation } from "@/contexts/LanguageContext";

export function DevelopmentsSection() {
  const { t } = useTranslation()
  
  const checklistData = React.useMemo(() => ({
    title: t.developments.auction.title,
    description: t.developments.auction.description,
    items: [
      {
        id: 1,
        text: t.developments.feature1.title,
        helperText: t.developments.feature1.description,
      },
      {
        id: 2,
        text: t.developments.feature2.title,
        helperText: t.developments.feature2.description,
      },
      {
        id: 3,
        text: t.developments.feature3.title,
        helperText: t.developments.feature3.description,
      },
      {
        id: 4,
        text: t.developments.feature4.title,
        helperText: t.developments.feature4.description,
      },
      {
        id: 5,
        text: t.developments.feature5.title,
        helperText: t.developments.feature5.description,
      },
      {
        id: 6,
        text: t.developments.feature6.title,
        helperText: t.developments.feature6.description,
      },
    ],
  }), [t.developments]);

  return (
    <section id="desenvolvimentos" className="relative bg-black py-12 md:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-12 md:mb-16 lg:mb-24 flex justify-center">
          <TextEffect
            per="line"
            as="h2"
            whileInView={true}
            viewport={{ once: true, amount: 0.3 }}
            segmentWrapperClassName="overflow-hidden block"
            className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold tracking-tight text-white text-center px-4 md:px-6 lg:px-4 leading-tight md:leading-snug lg:leading-tight"
            variants={{
              container: {
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.3 },
                },
              },
              item: {
                hidden: {
                  opacity: 0,
                  y: 40,
                },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.8,
                    ease: [0.16, 1, 0.3, 1],
                  },
                },
              },
            }}
          >
{`${t.developments.title}
${t.developments.subtitle}`}
          </TextEffect>
        </div>
      </div>
      
      {/* Layout responsivo: mobile/iPad/iPad Pro stack vertical, desktop lado a lado */}
      <div className="w-full flex flex-col xl:flex-row items-center justify-center gap-6 md:gap-6 xl:gap-6 px-4 sm:px-6 md:px-8 xl:px-8 2xl:px-12 mt-12 md:mt-14 xl:mt-24 2xl:mt-32">
        {/* Vídeo - primeiro no mobile/iPad/iPad Pro, lado direito no desktop */}
        <AnimatedGroup
          variants={{
            item: {
              hidden: {
                opacity: 0,
                x: 60,
              },
              visible: {
                opacity: 1,
                x: 0,
                transition: {
                  type: 'spring',
                  bounce: 0.3,
                  duration: 1,
                  delay: 0.2,
                },
              },
            },
          }}
          className="w-full xl:flex-[1.35] xl:max-w-3xl order-first xl:order-last"
        >
          <VideoPlayer src="/video-leilao-arthur-lira.mp4.mp4" />
        </AnimatedGroup>
        
        {/* Checklist - segunda no mobile/iPad/iPad Pro, lado esquerdo no desktop */}
        <AnimatedGroup
          variants={{
            item: {
              hidden: {
                opacity: 0,
                x: -60,
              },
              visible: {
                opacity: 1,
                x: 0,
                transition: {
                  type: 'spring',
                  bounce: 0.3,
                  duration: 0.6,
                },
              },
            },
          }}
          className="w-full xl:flex-[1.45] xl:max-w-3xl"
        >
          <OnboardingChecklist
            title={checklistData.title}
            description={checklistData.description}
            items={checklistData.items}
          />
        </AnimatedGroup>
      </div>
    </section>
  );
}

