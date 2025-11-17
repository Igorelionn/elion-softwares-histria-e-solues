"use client";

import * as React from "react";
import { Clock, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

interface GlassTimePickerProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
  placeholder?: string;
  className?: string;
  variant?: "dark" | "light";
  size?: "normal" | "large";
  noOverlayBlur?: boolean;
}

const AVAILABLE_TIMES = [
  "09:00",
  "11:00",
  "14:00",
  "16:00"
];

export function GlassTimePicker({
  selectedDate,
  selectedTime,
  onTimeSelect,
  placeholder = "Selecione um horário",
  className,
  variant = "dark",
  size = "normal",
  noOverlayBlur = false,
}: GlassTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [bookedTimes, setBookedTimes] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // Buscar horários já agendados quando abre o popup e tem data selecionada
  React.useEffect(() => {
    if (isOpen && selectedDate) {
      fetchBookedTimes();
    }
  }, [isOpen, selectedDate]);

  const fetchBookedTimes = async () => {
    if (!selectedDate) return;

    setIsLoading(true);
    try {
      // Formatar data para início e fim do dia (timezone UTC)
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Buscar reuniões confirmadas ou pendentes para esta data
      const { data, error } = await (supabase as any)
        .from('meetings')
        .select('meeting_time')
        .gte('meeting_date', startOfDay.toISOString())
        .lte('meeting_date', endOfDay.toISOString())
        .in('status', ['pending', 'confirmed']);

      if (error) {
        console.error('Erro ao buscar horários:', error);
        return;
      }

      // Extrair apenas os horários (HH:mm)
      const times = (data || []).map((meeting: any) => {
        if (meeting.meeting_time) {
          // Se o horário está no formato HH:mm:ss ou HH:mm
          return meeting.meeting_time.substring(0, 5);
        }
        return null;
      }).filter(Boolean);

      setBookedTimes(times);
    } catch (error) {
      console.error('Erro ao buscar horários:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeSelect = (time: string) => {
    onTimeSelect(time);
    setIsOpen(false);
  };

  const handleClear = () => {
    onTimeSelect("");
  };

  const isTimeBooked = (time: string) => {
    return bookedTimes.includes(time);
  };

  const canSelectTime = selectedDate !== null;

  return (
    <div className={cn("relative", className)}>
      {/* Input com display do horário selecionado */}
      <div className="relative flex items-center">
        <input
          type="text"
          value={selectedTime || ""}
          readOnly
          placeholder={placeholder}
          className={cn(
            "w-full px-4 py-3 pr-20 bg-transparent text-sm placeholder:text-sm focus:outline-none border-none cursor-pointer",
            variant === "dark" 
              ? "text-white placeholder:text-white/40" 
              : "text-gray-900 placeholder:text-gray-400"
          )}
          onClick={() => canSelectTime && setIsOpen(!isOpen)}
        />
        <div className="absolute right-3 flex items-center gap-1">
          {selectedTime && (
            <button
              type="button"
              onClick={handleClear}
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
            onClick={() => canSelectTime && setIsOpen(!isOpen)}
            disabled={!canSelectTime}
            className={cn(
              "p-1 transition-colors cursor-pointer",
              variant === "dark"
                ? canSelectTime 
                  ? "text-white/60 hover:text-white" 
                  : "text-white/30 cursor-not-allowed"
                : canSelectTime
                  ? "text-gray-500 hover:text-gray-700"
                  : "text-gray-300 cursor-not-allowed"
            )}
            aria-label="Abrir seletor de horário"
          >
            <Clock className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Popup do seletor de horário */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className={cn(
                "fixed inset-0 z-[9998]",
                noOverlayBlur 
                  ? "bg-black/20" 
                  : "bg-black/40 backdrop-blur-sm"
              )}
            />

            {/* Popup de horários */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999]"
            >
              <div 
                className={cn(
                  "rounded-2xl border shadow-2xl p-6 w-[320px]",
                  variant === "dark"
                    ? "bg-black/90 border-white/10 backdrop-blur-xl"
                    : "bg-white border-gray-200"
                )}
              >
                {/* Cabeçalho */}
                <div className="mb-4">
                  <h3 className={cn(
                    "text-lg font-semibold",
                    variant === "dark" ? "text-white" : "text-gray-900"
                  )}>
                    Selecione um horário
                  </h3>
                  {selectedDate && (
                    <p className={cn(
                      "text-sm mt-1",
                      variant === "dark" ? "text-white/60" : "text-gray-500"
                    )}>
                      {format(selectedDate, "dd/MM/yyyy")}
                    </p>
                  )}
                </div>

                {/* Loading */}
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className={cn(
                      "w-8 h-8 border-2 border-t-transparent rounded-full animate-spin",
                      variant === "dark" ? "border-white/20" : "border-gray-300"
                    )} />
                  </div>
                ) : (
                  /* Lista de horários */
                  <div className="space-y-2">
                    {AVAILABLE_TIMES.map((time) => {
                      const isBooked = isTimeBooked(time);
                      const isSelected = selectedTime === time;

                      return (
                        <motion.button
                          key={time}
                          whileHover={!isBooked ? { scale: 1.02 } : {}}
                          whileTap={!isBooked ? { scale: 0.98 } : {}}
                          onClick={() => !isBooked && handleTimeSelect(time)}
                          disabled={isBooked}
                          className={cn(
                            "w-full px-4 py-3 rounded-xl border transition-all text-sm font-medium",
                            variant === "dark" ? (
                              isSelected
                                ? "bg-white text-black border-white"
                                : isBooked
                                  ? "bg-white/5 text-white/30 border-white/10 cursor-not-allowed"
                                  : "bg-white/5 text-white border-white/20 hover:bg-white/10 hover:border-white/40 cursor-pointer"
                            ) : (
                              isSelected
                                ? "bg-gray-900 text-white border-gray-900"
                                : isBooked
                                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                  : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50 hover:border-gray-300 cursor-pointer"
                            )
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span>{time}</span>
                            {isBooked && (
                              <span className={cn(
                                "text-xs",
                                variant === "dark" ? "text-white/40" : "text-gray-400"
                              )}>
                                Indisponível
                              </span>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {/* Nota */}
                <p className={cn(
                  "text-xs mt-4 text-center",
                  variant === "dark" ? "text-white/40" : "text-gray-400"
                )}>
                  Horários indisponíveis já foram agendados
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

