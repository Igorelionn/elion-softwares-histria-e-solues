"use client";

import * as React from "react";
import { Clock, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassTimePickerProps {
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
  availableTimes: string[];
  placeholder?: string;
  className?: string;
  variant?: "dark" | "light";
  disabled?: boolean;
}

export function GlassTimePicker({
  selectedTime,
  onTimeSelect,
  availableTimes,
  placeholder = "Selecione um horário",
  className,
  variant = "dark",
  disabled = false,
}: GlassTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleTimeSelect = (time: string) => {
    onTimeSelect(time);
    setIsOpen(false);
  };

  const handleClear = () => {
    onTimeSelect("");
  };

  return (
    <div className={cn("relative", className)}>
      {/* Input de seleção */}
      <div className="relative flex items-center">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "w-full px-4 py-3 pr-20 bg-transparent text-sm text-left focus:outline-none border-none transition-opacity",
            variant === "dark" 
              ? "text-white placeholder:text-white/40" 
              : "text-gray-900 placeholder:text-gray-400",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {selectedTime || <span className="opacity-40">{placeholder}</span>}
        </button>
        <div className="absolute right-3 flex items-center gap-1">
          {selectedTime && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className={cn(
                "p-1 transition-colors cursor-pointer",
                variant === "dark"
                  ? "text-white/60 hover:text-white"
                  : "text-gray-400 hover:text-gray-600"
              )}
              aria-label="Limpar horário"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={cn(
              "p-1 transition-colors",
              variant === "dark"
                ? "text-white/60 hover:text-white"
                : "text-gray-500 hover:text-gray-700",
              disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            )}
            aria-label="Abrir seletor de horário"
          >
            <Clock className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Popup de horários */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
            />

            {/* Lista de horários */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999]"
            >
              <div
                className={cn(
                  "relative rounded-xl sm:rounded-2xl border shadow-2xl backdrop-blur-xl",
                  "p-4 sm:p-6",
                  "w-[min(90vw,340px)] sm:w-[400px]",
                  variant === "dark"
                    ? "border-white/20 bg-black/40"
                    : "border-gray-200 bg-white/95"
                )}
              >
                {/* Efeito de brilho */}
                <div className={cn(
                  "absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br via-transparent to-transparent opacity-50",
                  variant === "dark" ? "from-white/10" : "from-gray-100/50"
                )} />

                <div className="relative z-10">
                  {/* Header */}
                  <div className="mb-4">
                    <h3 className={cn(
                      "text-lg font-semibold text-center",
                      variant === "dark" ? "text-white" : "text-gray-900"
                    )}>
                      Selecione um horário
                    </h3>
                    <p className={cn(
                      "text-xs text-center mt-1",
                      variant === "dark" ? "text-white/60" : "text-gray-500"
                    )}>
                      {availableTimes.length === 0 
                        ? "Nenhum horário disponível para esta data"
                        : `${availableTimes.length} horário${availableTimes.length > 1 ? 's' : ''} disponível${availableTimes.length > 1 ? 'eis' : ''}`
                      }
                    </p>
                  </div>

                  {/* Grid de horários */}
                  {availableTimes.length > 0 ? (
                    <motion.div
                      className="grid grid-cols-2 gap-3"
                      initial="hidden"
                      animate="visible"
                      variants={{
                        visible: {
                          transition: {
                            staggerChildren: 0.05
                          }
                        }
                      }}
                    >
                      {availableTimes.map((time, index) => (
                        <motion.button
                          key={time}
                          variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { 
                              opacity: 1, 
                              y: 0,
                              transition: {
                                duration: 0.3,
                                ease: [0.25, 0.1, 0.25, 1]
                              }
                            }
                          }}
                          onClick={() => handleTimeSelect(time)}
                          className={cn(
                            "relative flex items-center justify-center rounded-lg font-medium transition-all duration-200 cursor-pointer",
                            "py-4 text-base",
                            variant === "dark" ? (
                              selectedTime === time
                                ? "bg-white text-black shadow-lg shadow-white/20 scale-105"
                                : "bg-white/10 text-white hover:bg-white/20 hover:scale-105 border border-white/20"
                            ) : (
                              selectedTime === time
                                ? "bg-black text-white shadow-lg shadow-black/20 scale-105"
                                : "bg-gray-100 text-gray-900 hover:bg-gray-200 hover:scale-105 border border-gray-200"
                            )
                          )}
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          {time}
                        </motion.button>
                      ))}
                    </motion.div>
                  ) : (
                    <div className={cn(
                      "text-center py-8",
                      variant === "dark" ? "text-white/60" : "text-gray-500"
                    )}>
                      <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">
                        Não há horários disponíveis<br />para a data selecionada
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

