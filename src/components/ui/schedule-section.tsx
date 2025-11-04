"use client";
import React from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { Calendar, Clock, Target, CheckCircle2, Video, TrendingUp } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";

export const ScheduleSection = () => {
  const { t } = useTranslation()
  
  const benefits = React.useMemo(() => [
    t.schedule.benefit1,
    t.schedule.benefit2,
    t.schedule.benefit3,
    t.schedule.benefit4,
  ], [t.schedule.benefit1, t.schedule.benefit2, t.schedule.benefit3, t.schedule.benefit4]);

  const handleScheduleClick = React.useCallback(() => {
    // Redireciona para a página de solicitação de reunião
    window.location.href = "/solicitar-reuniao";
  }, []);

  return (
    <section className="relative bg-black pt-16 md:pt-20 lg:pt-24 pb-20 md:pb-28 lg:pb-32 overflow-hidden" style={{ position: 'relative' }}>
      {/* Background decorativo */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900/20 to-black"></div>
      
      <div className="container z-10 mx-auto relative px-4 sm:px-6">
        {/* Título e descrição */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[640px] mx-auto text-center mb-10 md:mb-12"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-white px-4">
            {t.schedule.title}
          </h2>
          <p className="text-center mt-4 md:mt-6 opacity-75 text-white/70 text-sm sm:text-base md:text-lg px-4">
            {t.schedule.subtitle}
          </p>
        </motion.div>

        {/* Grid com conteúdo */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 md:gap-10 lg:gap-12 xl:gap-16 items-center max-w-7xl mx-auto mt-12 md:mt-16 lg:mt-20 xl:mt-24">
          {/* Lado esquerdo - Imagens */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="relative xl:-ml-16 2xl:-ml-32 px-4 md:px-6 lg:px-6 xl:pl-2"
          >
            <div className="relative max-w-2xl mx-auto xl:max-w-none">
              {/* Imagem principal */}
              <div className="relative rounded-xl md:rounded-2xl overflow-hidden border border-white/10">
                <Image
                  src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=600&fit=crop"
                  alt="Reunião de negócios"
                  className="w-full h-[280px] sm:h-[350px] md:h-[400px] lg:h-[450px] xl:h-[450px] object-cover"
                  width={800}
                  height={600}
                  loading="lazy"
                  quality={85}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>

              {/* Card flutuante */}
              <div className="absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-4 md:-bottom-5 md:-right-5 lg:-bottom-6 lg:-right-6 bg-white rounded-lg md:rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-2xl max-w-[140px] sm:max-w-[160px] md:max-w-[180px] lg:max-w-[200px]">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="bg-green-500 rounded-full p-1.5 md:p-2">
                    <Video className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-white" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] sm:text-xs md:text-sm font-semibold text-gray-900 leading-tight truncate">{t.schedule.meetingType}</span>
                    <span className="text-[9px] sm:text-[10px] md:text-xs text-gray-600 truncate">{t.schedule.meetingPlatform}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Lado direito - Informações e CTA */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="space-y-6 md:space-y-8"
          >
            {/* Timeline de Benefícios */}
            <div className="relative space-y-8">              
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ 
                    duration: 0.9,
                    ease: "easeOut" 
                  }}
                  viewport={{ once: true, amount: 0.9 }}
                  className="flex items-start gap-4 relative"
                >
                  {/* Linha vertical individual */}
                  {index < benefits.length - 1 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      whileInView={{ height: "calc(100% + 2rem)", opacity: 1 }}
                      transition={{ 
                        duration: 1.2,
                        delay: 0.4,
                        ease: "easeInOut"
                      }}
                      viewport={{ once: true, amount: 0.9 }}
                      className="absolute left-[15px] top-8 w-[2px] bg-gradient-to-b from-white/50 via-white/30 to-white/10"
                    />
                  )}
                  
                  {/* Marcador da timeline */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ 
                      duration: 0.6,
                      delay: 0.3,
                      type: "spring",
                      stiffness: 150
                    }}
                    viewport={{ once: true, amount: 0.9 }}
                    className="relative z-10 flex-shrink-0"
                  >
                    {/* Número do passo com transição de cor */}
                    <motion.div
                      initial={{ backgroundColor: "rgb(0, 0, 0)" }}
                      whileInView={{ backgroundColor: "rgb(255, 255, 255)" }}
                      transition={{
                        duration: 0.9,
                        delay: 1.2,
                        ease: "easeOut"
                      }}
                      viewport={{ once: true, amount: 0.9 }}
                      className="w-8 h-8 rounded-lg border border-white/20 shadow-lg flex items-center justify-center"
                    >
                      <motion.span
                        initial={{ color: "rgb(255, 255, 255)" }}
                        whileInView={{ color: "rgb(0, 0, 0)" }}
                        transition={{
                          duration: 0.9,
                          delay: 1.2,
                          ease: "easeOut"
                        }}
                        viewport={{ once: true, amount: 0.9 }}
                        className="font-bold text-sm"
                      >
                        {index + 1}
                      </motion.span>
                    </motion.div>
                  </motion.div>
                  
                  {/* Texto do benefício */}
                  <div className="flex-1 pt-0.5">
                    <span className="text-white/90 text-sm sm:text-base md:text-lg leading-relaxed">
                      {benefit}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Informações adicionais */}
            <div className="grid grid-cols-2 gap-3 md:gap-4 pt-4 md:pt-6 border-t border-white/10">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="bg-white/5 rounded-lg p-2 md:p-3 border border-white/10">
                  <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-white/70" />
                </div>
                <div>
                  <p className="text-[10px] md:text-xs text-white/50">{t.schedule.objective}</p>
                  <p className="text-xs md:text-sm font-semibold text-white">{t.schedule.objectiveValue}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <div className="bg-white/5 rounded-lg p-2 md:p-3 border border-white/10">
                  <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-white/70" />
                </div>
                <div>
                  <p className="text-[10px] md:text-xs text-white/50">{t.schedule.investment}</p>
                  <p className="text-xs md:text-sm font-semibold text-white">{t.schedule.investmentValue}</p>
                </div>
              </div>
            </div>

            {/* Botão de CTA */}
            <button
              onClick={handleScheduleClick}
              className="w-full py-3 md:py-4 px-6 md:px-8 bg-black text-white text-sm md:text-base font-bold rounded-lg md:rounded-xl focus:outline-none hover:bg-white hover:text-black transition-colors duration-300 shadow-lg border border-white/20 cursor-pointer"
            >
              {t.schedule.ctaButton}
            </button>

              <p className="text-center text-xs md:text-sm text-white/50">
                {t.schedule.disclaimer}
              </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

