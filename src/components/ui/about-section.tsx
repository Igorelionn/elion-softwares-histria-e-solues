'use client'

import React from 'react'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { TextGradientScroll } from '@/components/ui/text-gradient-scroll'
import WhisperText from '@/components/ui/whisper-text'
import { useTranslation } from '@/contexts/LanguageContext'

export function AboutSection() {
    const { t } = useTranslation()
    
    return (
        <section id="nosso-legado" className="relative bg-background py-16 md:py-24 lg:py-32 min-h-[100vh]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                {/* About Content */}
                <div className="max-w-6xl mx-auto">
                    <AnimatedGroup 
                        variants={{
                            container: {
                                visible: {
                                    transition: {
                                        staggerChildren: 0.2,
                                    },
                                },
                            },
                            item: {
                                hidden: {
                                    opacity: 0,
                                    y: 30,
                                },
                                visible: {
                                    opacity: 1,
                                    y: 0,
                                    transition: {
                                        type: 'spring',
                                        bounce: 0.3,
                                        duration: 0.8,
                                    },
                                },
                            },
                        }}
                        className="space-y-6 md:space-y-8 text-center"
                    >
                        <div className="flex justify-center px-4">
                            <WhisperText
                                text={t.about.title}
                                className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-bold tracking-tight"
                                delay={120}
                                duration={0.6}
                                x={-30}
                                y={20}
                                triggerStart="top 85%"
                            />
                        </div>
                        
                        <div className="text-base sm:text-lg md:text-lg lg:text-2xl leading-relaxed mb-4 md:mb-6 px-4 md:px-8 lg:px-4">
                            <TextGradientScroll 
                                text={`${t.about.quote} ${t.about.quoteAuthor}`}
                                type="word"
                                className="text-muted-foreground italic"
                            />
                        </div>

                        <div className="text-base sm:text-lg md:text-lg lg:text-2xl leading-relaxed px-4 md:px-8 lg:px-4">
                            <TextGradientScroll 
                                text={`${t.about.paragraph1}\n\n${t.about.paragraph2}\n\n${t.about.paragraph3}\n\n${t.about.paragraph4}`}
                                type="word"
                                className="text-muted-foreground"
                            />
                        </div>
                    </AnimatedGroup>
                </div>
            </div>
        </section>
    )
}

