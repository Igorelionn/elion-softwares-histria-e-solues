// components/ui/onboarding-checklist.tsx
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Define the type for a single checklist item
interface ChecklistItem {
  id: number | string;
  text: string;
  helperText?: string;
  helperLink?: {
    href: string;
    text: string;
  };
}

// Define the props for the main component
export interface OnboardingChecklistProps {
  title: string;
  description: string;
  items: ChecklistItem[];
  className?: string;
}

/**
 * A responsive and animated onboarding checklist component.
 * @param title - The main heading for the checklist.
 * @param description - A short description displayed below the title.
 * @param items - An array of checklist items to display.
 * @param className - Optional additional class names for the container.
 */
export const OnboardingChecklist = ({
  title,
  description,
  items,
  className,
}: OnboardingChecklistProps) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.05,
      },
    },
  };

  const titleVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.4,
        delay: 0,
      },
    },
  };

  const descriptionVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.4,
        delay: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.4,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={containerVariants}
      className={cn(
        "w-full max-w-5xl mx-auto text-white border rounded-xl md:rounded-2xl shadow-sm p-5 sm:p-6 md:p-7 overflow-hidden",
        className
      )}
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderColor: 'rgba(255, 255, 255, 0.1)'
      }}
    >
      <div className="flex flex-col">
        <motion.h2 
          variants={titleVariants}
          className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-white"
        >
          {title}
        </motion.h2>
        <motion.p 
          variants={descriptionVariants}
          className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-400 leading-snug"
        >
          {description}
        </motion.p>
        <ul className="mt-4 sm:mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-x-4 sm:gap-x-5 md:gap-x-6 gap-y-3 sm:gap-y-3.5">
          {items.map((item, index) => (
            <motion.li key={item.id} variants={itemVariants} className="flex flex-col">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 sm:h-4 sm:w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-white leading-snug">{item.text}</span>
              </div>
              {item.helperText && (
                <div className="ml-6 mt-1 text-[10px] sm:text-xs text-white/70 leading-relaxed">
                  {item.helperText}{" "}
                  {item.helperLink && (
                    <a
                      href={item.helperLink.href}
                      className="text-blue-400 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
                    >
                      {item.helperLink.text}
                    </a>
                  )}
                </div>
              )}
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
};

