"use client";
import React from "react";
import { motion } from "motion/react";
import { TestimonialsColumn } from "@/components/ui/testimonials-columns-1";
import { useTranslation } from "@/contexts/LanguageContext";

const userImages = [
  "https://randomuser.me/api/portraits/women/12.jpg",
  "https://randomuser.me/api/portraits/men/32.jpg",
  "https://randomuser.me/api/portraits/women/36.jpg",
  "https://randomuser.me/api/portraits/men/52.jpg",
  "https://randomuser.me/api/portraits/women/51.jpg",
  "https://randomuser.me/api/portraits/women/19.jpg", // Amanda Silva - MANTIDA
  "https://randomuser.me/api/portraits/men/46.jpg",
  "https://randomuser.me/api/portraits/women/62.jpg",
  "https://randomuser.me/api/portraits/men/43.jpg",
];

export const TestimonialsSection = () => {
  const { t } = useTranslation()
  
  const testimonials = t.testimonials.items.map((item, index) => ({
    text: item.text,
    image: userImages[index],
    name: item.author,
    role: item.date,
  }))

  const firstColumn = testimonials.slice(0, 3);
  const secondColumn = testimonials.slice(3, 6);
  const thirdColumn = testimonials.slice(6, 9);

  return (
    <section id="depoimentos" className="relative bg-black pt-20 md:pt-28 lg:pt-32 pb-16 md:pb-20" style={{ position: 'relative' }}>
      {/* Fade de transição */}
      <div className="absolute top-0 left-0 right-0 h-20 md:h-32 bg-gradient-to-b from-black via-black/80 to-transparent"></div>
      
      <div className="container z-10 mx-auto relative px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[540px] mx-auto"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-white text-center px-4">
            {t.testimonials.title}
          </h2>
          <p className="text-center mt-3 md:mt-4 opacity-75 text-white/70 text-sm sm:text-base px-4">
            {t.testimonials.subtitle}
          </p>
        </motion.div>

        <div className="flex justify-center gap-4 sm:gap-6 mt-8 md:mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[600px] sm:max-h-[700px] md:max-h-[740px] overflow-hidden px-2">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
        </div>
      </div>
    </section>
  );
};

