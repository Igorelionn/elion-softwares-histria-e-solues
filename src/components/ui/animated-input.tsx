"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface AnimatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  value: string;
  className?: string;
}

const containerVariants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
} as const;

const letterVariants = {
  initial: {
    y: 0,
    color: "rgb(255 255 255 / 0.3)",
  },
  animate: {
    y: "-120%",
    color: "rgb(255 255 255 / 0.5)",
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 20,
    },
  },
};

export const AnimatedInput = ({
  label,
  className = "",
  value,
  ...props
}: AnimatedInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const showLabel = isFocused || value.length > 0;

  // Marca que a animação já aconteceu
  useEffect(() => {
    if (showLabel && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [showLabel, hasAnimated]);

  return (
    <div className={cn("relative", className)}>
      <motion.div
        className="absolute top-1/2 -translate-y-1/2 pointer-events-none text-white/30"
        variants={containerVariants}
        initial="initial"
        animate={hasAnimated ? "animate" : "initial"}
      >
        {label.split("").map((char, index) => (
          <motion.span
            key={index}
            className="inline-block text-base"
            variants={letterVariants}
            style={{ willChange: "transform" }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </motion.div>

      <input
        type="text"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
        value={value}
        className="outline-none border-none py-3 w-full text-base font-medium text-white bg-transparent placeholder-transparent"
      />
    </div>
  );
};

