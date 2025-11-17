"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface TimeSelectorProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
}

const AVAILABLE_TIMES = ["09:00", "11:00", "14:00", "16:00"];

export function TimeSelector({ selectedDate, selectedTime, onTimeSelect }: TimeSelectorProps) {
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      checkAvailableTimes(selectedDate);
    } else {
      setAvailableTimes([]);
    }
  }, [selectedDate]);

  const checkAvailableTimes = async (date: Date) => {
    setIsLoading(true);
    
    try {
      // Formatar data para ISO string (apenas a data, sem hora)
      const dateStr = date.toISOString().split('T')[0];
      
      // Buscar reuniões já agendadas para esta data
      const { data: meetings, error } = await (supabase as any)
        .from('meetings')
        .select('meeting_time')
        .eq('meeting_date', dateStr + 'T00:00:00.000Z')
        .in('status', ['pending', 'confirmed']);

      if (error) {
        console.error('Erro ao verificar horários:', error);
        // Em caso de erro, mostrar todos os horários
        setAvailableTimes(AVAILABLE_TIMES);
        return;
      }

      // Extrair horários já ocupados
      const occupiedTimes = meetings?.map((meeting: any) => meeting.meeting_time) || [];
      
      // Filtrar horários disponíveis
      const available = AVAILABLE_TIMES.filter(time => !occupiedTimes.includes(time));
      
      setAvailableTimes(available);
    } catch (error) {
      console.error('Erro ao verificar horários:', error);
      setAvailableTimes(AVAILABLE_TIMES);
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedDate) {
    return (
      <div className="text-white/40 text-sm py-4">
        Selecione uma data para ver os horários disponíveis
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center gap-2 text-white/60 text-sm">
        <Clock className="h-4 w-4" />
        <span>Horários disponíveis</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      ) : availableTimes.length === 0 ? (
        <div className="text-white/40 text-sm py-4 text-center border border-white/10 rounded-lg">
          Não há horários disponíveis para esta data. Por favor, escolha outra data.
        </div>
      ) : (
        <motion.div 
          className="grid grid-cols-2 gap-2"
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
          {availableTimes.map((time) => (
            <motion.button
              key={time}
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { 
                  opacity: 1, 
                  y: 0,
                  transition: {
                    duration: 0.3
                  }
                }
              }}
              onClick={() => onTimeSelect(time)}
              className={`relative flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all text-sm cursor-pointer ${
                selectedTime === time
                  ? "bg-white/10 text-white border-white/40"
                  : "bg-transparent text-white/80 border-white/20 hover:border-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              <Clock className="h-4 w-4" />
              <span className="font-medium">{time}</span>
              {selectedTime === time && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-white rounded-full p-0.5"
                >
                  <Check className="h-3 w-3 text-black" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </motion.div>
      )}
    </div>
  );
}

