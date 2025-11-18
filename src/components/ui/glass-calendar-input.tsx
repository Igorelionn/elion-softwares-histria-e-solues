"use client";

import * as React from "react";
import { Calendar, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { GlassCalendar } from "./glass-calendar";
import { cn } from "@/lib/utils";

interface GlassCalendarInputProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  selectedTime?: string | null;
  onTimeSelect?: (time: string) => void;
  placeholder?: string;
  className?: string;
  variant?: "dark" | "light";
  size?: "normal" | "large";
  noOverlayBlur?: boolean;
}

export function GlassCalendarInput({
  selectedDate,
  onDateSelect,
  selectedTime = null,
  onTimeSelect,
  placeholder = "DD/MM/AAAA",
  className,
  variant = "dark",
  size = "normal",
  noOverlayBlur = false,
}: GlassCalendarInputProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  React.useEffect(() => {
    if (selectedDate) {
      const dateStr = format(selectedDate, "dd/MM/yyyy");
      setInputValue(selectedTime ? `${dateStr} às ${selectedTime}` : dateStr);
    }
  }, [selectedDate, selectedTime]);

  const handleDateSelect = (date: Date) => {
    onDateSelect(date);
    // Só fecha se não houver seleção de horário ou se já tiver selecionado um horário
    if (!onTimeSelect || selectedTime) {
      setIsOpen(false);
    }
  };

  const handleTimeSelect = (time: string) => {
    if (onTimeSelect) {
      onTimeSelect(time);
      // Fecha o calendário após selecionar o horário
      setIsOpen(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove tudo que não é número
    
    // Se não houver números, limpar completamente
    if (value.length === 0) {
      setInputValue("");
      return;
    }
    
    // Aplica a máscara DD/MM/AAAA
    if (value.length >= 2) {
      value = value.slice(0, 2) + "/" + value.slice(2);
    }
    if (value.length >= 5) {
      value = value.slice(0, 5) + "/" + value.slice(5);
    }
    if (value.length > 10) {
      value = value.slice(0, 10);
    }

    setInputValue(value);

    // Tenta validar e aplicar a data se estiver completa
    if (value.length === 10) {
      try {
        const parsedDate = parse(value, "dd/MM/yyyy", new Date());
        if (isValid(parsedDate)) {
          onDateSelect(parsedDate);
        }
      } catch (error) {
        // Ignora erro de parsing
      }
    }
  };

  const handleClearInput = () => {
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const cursorPos = input.selectionStart || 0;
    const value = input.value;
    
    // Backspace
    if (e.key === 'Backspace' && cursorPos > 0) {
      e.preventDefault();
      
      // Se todo o texto está selecionado, limpar tudo
      if (input.selectionStart === 0 && input.selectionEnd === value.length) {
        handleClearInput();
        return;
      }
      
      // Remove apenas números, pulando as barras
      const numbersOnly = value.replace(/\D/g, "");
      const newNumbers = numbersOnly.slice(0, numbersOnly.length - 1);
      
      // Reaplica a máscara
      let newValue = newNumbers;
      if (newNumbers.length >= 2) {
        newValue = newNumbers.slice(0, 2) + "/" + newNumbers.slice(2);
      }
      if (newNumbers.length >= 4) {
        newValue = newNumbers.slice(0, 2) + "/" + newNumbers.slice(2, 4) + "/" + newNumbers.slice(4);
      }
      
      setInputValue(newValue);
      
      // Define a posição do cursor
      setTimeout(() => {
        const newPos = Math.max(0, newValue.length);
        input.setSelectionRange(newPos, newPos);
      }, 0);
      
      return;
    }
    
    // Delete
    if (e.key === 'Delete') {
      e.preventDefault();
      
      // Se todo o texto está selecionado, limpar tudo
      if (input.selectionStart === 0 && input.selectionEnd === value.length) {
        handleClearInput();
        return;
      }
      
      // Para Delete, também remove do final
      const numbersOnly = value.replace(/\D/g, "");
      const newNumbers = numbersOnly.slice(0, numbersOnly.length - 1);
      
      let newValue = newNumbers;
      if (newNumbers.length >= 2) {
        newValue = newNumbers.slice(0, 2) + "/" + newNumbers.slice(2);
      }
      if (newNumbers.length >= 4) {
        newValue = newNumbers.slice(0, 2) + "/" + newNumbers.slice(2, 4) + "/" + newNumbers.slice(4);
      }
      
      setInputValue(newValue);
      
      setTimeout(() => {
        const newPos = Math.max(0, newValue.length);
        input.setSelectionRange(newPos, newPos);
      }, 0);
      
      return;
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Input editável com ícones */}
      <div className="relative flex items-center">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "w-full px-4 py-3 pr-20 bg-transparent text-sm placeholder:text-sm focus:outline-none border-none",
            variant === "dark" 
              ? "text-white placeholder:text-white/40" 
              : "text-gray-900 placeholder:text-gray-400"
          )}
        />
        <div className="absolute right-3 flex items-center gap-1">
          {inputValue && (
            <button
              type="button"
              onClick={handleClearInput}
              className={cn(
                "p-1 transition-colors cursor-pointer",
                variant === "dark"
                  ? "text-white/60 hover:text-white"
                  : "text-gray-400 hover:text-gray-600"
              )}
              aria-label="Limpar data"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "p-1 transition-colors cursor-pointer",
              variant === "dark"
                ? "text-white/60 hover:text-white"
                : "text-gray-500 hover:text-gray-700"
            )}
            aria-label="Abrir calendário"
          >
            <Calendar className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Popup do calendário */}
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

            {/* Calendário - Mobile: ocupa quase tela toda, Desktop: centralizado */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] max-h-[90vh] overflow-auto"
            >
              <GlassCalendar
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                variant={variant}
                size={size}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

