"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface GlassCalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  selectedTime?: string | null;
  onTimeSelect?: (time: string) => void;
  className?: string;
  variant?: "dark" | "light";
  size?: "normal" | "large";
}

export function GlassCalendar({
  selectedDate,
  onDateSelect,
  selectedTime = null,
  onTimeSelect,
  className,
  variant = "dark",
  size = "normal",
}: GlassCalendarProps) {
  // Se houver data selecionada, mostrar o mês dela, senão o mês atual
  const [currentMonth, setCurrentMonth] = React.useState(selectedDate || new Date());
  const [direction, setDirection] = React.useState(0);

  // Atualizar o mês quando o componente montar
  React.useEffect(() => {
    // Se houver data selecionada, mostrar o mês dela, senão o mês atual
    setCurrentMonth(selectedDate || new Date());
  }, [selectedDate]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => {
    setDirection(1);
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setDirection(-1);
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // Horários disponíveis para agendamento
  const availableTimes = ["09:00", "11:00", "14:00", "16:00", "18:00"];

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -100 : 100,
      opacity: 0,
    }),
  };

  return (
    <div
      className={cn(
        "relative rounded-xl sm:rounded-2xl border shadow-2xl backdrop-blur-xl",
        "p-3 sm:p-4 md:p-6",
        "w-[min(95vw,340px)] sm:w-[400px]",
        size === "large" && "sm:w-[500px] md:w-[580px]",
        variant === "dark"
          ? "border-white/20 bg-black/40"
          : "border-gray-200 bg-white/95",
        className
      )}
    >
      {/* Efeito de brilho */}
      <div className={cn(
        "absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br via-transparent to-transparent opacity-50",
        variant === "dark" ? "from-white/10" : "from-gray-100/50"
      )} />

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-3 sm:mb-4 flex items-center justify-between">
          <button
            onClick={prevMonth}
            className={cn(
              "flex items-center justify-center rounded-full transition-all hover:scale-110 cursor-pointer",
              "h-7 w-7 sm:h-8 sm:w-8",
              variant === "dark"
                ? "bg-white/10 text-white hover:bg-white/20"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>

          <h2 className={cn(
            "font-semibold capitalize",
            "text-sm sm:text-base",
            variant === "dark" ? "text-white" : "text-gray-900"
          )}>
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </h2>

          <button
            onClick={nextMonth}
            className={cn(
              "flex items-center justify-center rounded-full transition-all hover:scale-110 cursor-pointer",
              "h-7 w-7 sm:h-8 sm:w-8",
              variant === "dark"
                ? "bg-white/10 text-white hover:bg-white/20"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
            aria-label="Próximo mês"
          >
            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>

        {/* Dias da semana */}
        <div className={cn(
          "mb-1.5 sm:mb-2 grid grid-cols-7",
          "gap-x-1 gap-y-1 sm:gap-x-2 sm:gap-y-1.5",
          size === "large" && "md:gap-x-5 md:gap-y-2.5"
        )}>
          {weekDays.map((day) => (
            <div
              key={day}
              className={cn(
                "text-center font-medium",
                "text-[10px] sm:text-xs",
                size === "large" && "md:text-sm",
                variant === "dark" ? "text-white/60" : "text-gray-500"
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grade de dias */}
        <div className="overflow-visible">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentMonth.toISOString()}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className={cn(
                "grid grid-cols-7",
                "gap-x-1 gap-y-1 sm:gap-x-2 sm:gap-y-1.5",
                size === "large" && "md:gap-x-5 md:gap-y-2.5"
              )}
            >
            {dateRange.map((day, idx) => {
              const isCurrentMonth = isSameMonth(day, currentMonth);

              // Normalizar datas para comparação (apenas ano, mês, dia)
              const normalizedDay = new Date(day.getFullYear(), day.getMonth(), day.getDate());
              const normalizedSelected = selectedDate ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()) : null;
              const isSelected = normalizedSelected ? normalizedDay.getTime() === normalizedSelected.getTime() : false;

              const isTodayDate = isToday(day);
              const today = new Date();
              const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
              const isPast = normalizedDay.getTime() < normalizedToday.getTime();

              return (
                <motion.button
                  key={day.toISOString()}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.01 }}
                  onClick={() => {
                    // Normaliza a data para evitar problemas de timezone
                    const normalizedDate = new Date(day.getFullYear(), day.getMonth(), day.getDate());
                    onDateSelect(normalizedDate);
                  }}
                  disabled={isPast}
                  className={cn(
                    "relative flex items-center justify-center rounded-lg font-medium transition-all duration-200",
                    "h-8 w-8 text-xs sm:h-10 sm:w-10 sm:text-sm",
                    size === "large" && "md:h-12 md:w-12 md:text-sm",
                    variant === "dark" ? (
                      isCurrentMonth
                        ? "text-white"
                        : "text-white/30"
                    ) : (
                      isCurrentMonth
                        ? "text-gray-900"
                        : "text-gray-300"
                    ),
                    isSelected && (
                      variant === "dark"
                        ? "bg-white text-black shadow-lg shadow-white/20 scale-110"
                        : "bg-black text-white shadow-lg shadow-black/20 scale-110"
                    ),
                    !isSelected && isCurrentMonth && !isPast && (
                      variant === "dark"
                        ? "hover:bg-white/20 hover:scale-105 cursor-pointer"
                        : "hover:bg-gray-100 hover:scale-105 cursor-pointer"
                    ),
                    isTodayDate &&
                      !isSelected && (
                        variant === "dark"
                          ? "ring-1 sm:ring-2 ring-white/50"
                          : "ring-1 sm:ring-2 ring-gray-300"
                      ),
                    isPast ? "cursor-not-allowed opacity-40" : isCurrentMonth && "cursor-pointer"
                  )}
                >
                  {format(day, "d")}
                  {isTodayDate && !isSelected && (
                    <span className={cn(
                      "absolute h-1 w-1 rounded-full",
                      "bottom-0.5 sm:bottom-1",
                      variant === "dark" ? "bg-white" : "bg-black"
                    )} />
                  )}
                </motion.button>
              );
            })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Legenda */}
        <div className={cn(
          "mt-3 sm:mt-4 flex items-center justify-center gap-2 sm:gap-3 text-[9px] sm:text-[10px]",
          variant === "dark" ? "text-white/60" : "text-gray-500"
        )}>
          <div className="flex items-center gap-1">
            <div className={cn(
              "h-1.5 w-1.5 rounded-full",
              variant === "dark" ? "bg-white" : "bg-black"
            )} />
            <span>Selecionado</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={cn(
              "h-1.5 w-1.5 rounded-full border",
              variant === "dark" ? "border-white/50" : "border-gray-300"
            )} />
            <span>Hoje</span>
          </div>
        </div>

        {/* Seleção de Horários */}
        {selectedDate && onTimeSelect && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 sm:mt-5"
          >
            <div className={cn(
              "mb-2 text-center text-xs sm:text-sm font-medium",
              variant === "dark" ? "text-white/80" : "text-gray-700"
            )}>
              Selecione um horário
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {availableTimes.map((time) => (
                <motion.button
                  key={time}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onTimeSelect(time)}
                  className={cn(
                    "px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all duration-200",
                    "text-xs sm:text-sm",
                    selectedTime === time
                      ? variant === "dark"
                        ? "bg-white text-black shadow-lg shadow-white/20"
                        : "bg-black text-white shadow-lg shadow-black/20"
                      : variant === "dark"
                      ? "bg-white/10 text-white hover:bg-white/20"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  {time}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

