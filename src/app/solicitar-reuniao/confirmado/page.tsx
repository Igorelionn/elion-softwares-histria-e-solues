"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import Confetti, { ConfettiRef } from "@/components/ui/confetti";
import { BeamsBackground } from "@/components/ui/beams-background";

export default function ConfirmadoPage() {
  const router = useRouter();
  const confettiRef = useRef<ConfettiRef>(null);

  useEffect(() => {
    // Limpar qualquer dado pendente do localStorage
    localStorage.removeItem('pending_meeting_data');
    
    console.log('[ConfirmadoPage] Iniciando confetti...');
    
    // Dispara múltiplas explosões de confetti
    const timers: NodeJS.Timeout[] = [];
    
    // Primeira explosão
    timers.push(setTimeout(() => {
      console.log('[ConfirmadoPage] Disparando confetti 1');
      confettiRef.current?.fire({
        particleCount: 150,
        spread: 70,
        origin: { x: 0.5, y: 0.6 },
        colors: ['#0f172a', '#FFFFFF', '#64748b', '#22c55e'],
      });
    }, 500));

    // Segunda explosão (esquerda)
    timers.push(setTimeout(() => {
      console.log('[ConfirmadoPage] Disparando confetti 2');
      confettiRef.current?.fire({
        particleCount: 80,
        spread: 60,
        origin: { x: 0.3, y: 0.7 },
        colors: ['#0f172a', '#FFFFFF', '#64748b', '#22c55e'],
      });
    }, 700));

    // Terceira explosão (direita)
    timers.push(setTimeout(() => {
      console.log('[ConfirmadoPage] Disparando confetti 3');
      confettiRef.current?.fire({
        particleCount: 80,
        spread: 60,
        origin: { x: 0.7, y: 0.7 },
        colors: ['#0f172a', '#FFFFFF', '#64748b', '#22c55e'],
      });
    }, 900));

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, []);

  return (
    <BeamsBackground intensity="medium" className="bg-black">
      {/* Confetti - Posicionado fora do container para garantir visibilidade total */}
      <Confetti 
        ref={confettiRef} 
        manualstart 
        className="pointer-events-none fixed inset-0 z-[9999] h-full w-full"
      />
      
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 relative overflow-hidden">

        {/* Ícone de Verificado - Posição Fixa no Topo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="absolute top-6 sm:top-8 left-1/2 -translate-x-1/2 z-10"
        >
        <svg
          width="80"
          height="80"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-16 h-16 sm:w-20 sm:h-20 md:w-[100px] md:h-[100px]"
          style={{ overflow: 'visible' }}
        >
          {/* Círculo */}
          <motion.circle
            cx="12"
            cy="12"
            r="10"
            stroke="#22c55e"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
            pathLength="1"
            initial={{ 
              strokeDasharray: "0.7 1",
              opacity: 1 
            }}
            animate={{ 
              strokeDasharray: "1 1",
              opacity: 1 
            }}
            transition={{
              delay: 0.2,
              duration: 0.6,
              ease: "easeInOut"
            }}
          />
          {/* Check mark */}
          <motion.path
            d="M9 12l2 2 4-4"
            stroke="#22c55e"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            pathLength="1"
            initial={{ 
              strokeDasharray: "0 1",
              opacity: 0 
            }}
            animate={{ 
              strokeDasharray: "1 1",
              opacity: 1 
            }}
            transition={{
              delay: 0.2,
              duration: 0.6,
              ease: "easeOut"
            }}
          />
        </svg>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full flex flex-col items-center justify-center space-y-6 sm:space-y-8 relative z-10 mt-24 sm:mt-28 md:mt-32"
      >
        {/* Título */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          className="space-y-2 flex flex-col items-center justify-center py-3 sm:py-4 px-4"
        >
          <h1 
            className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl text-center md:whitespace-nowrap tracking-tight text-white leading-tight py-2"
            style={{ fontFamily: 'system-ui', fontWeight: 400 }}
          >
            Reunião Solicitada
          </h1>
        </motion.div>

        {/* Texto Descritivo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.9 }}
          className="space-y-3 sm:space-y-4 text-white/70 leading-relaxed max-w-xl text-center -mt-2 sm:-mt-4 px-4"
        >
          <p className="text-sm sm:text-base md:text-lg">
            Nossa equipe irá analisar seu projeto e em breve entraremos em contato
            para agendar a reunião. Fique atento ao seu e-mail.
          </p>
        </motion.div>

        {/* Botão para voltar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 1.2 }}
          className="pt-4 sm:pt-6 flex justify-center w-full px-4"
        >
          <Button
            onClick={() => router.push("/")}
            className="bg-white/5 backdrop-blur-md text-white border border-white/15 hover:bg-white/15 hover:border-white/25 px-8 sm:px-10 md:px-12 py-5 sm:py-6 md:py-7 text-sm sm:text-base md:text-lg cursor-pointer transition-all w-full sm:w-auto"
          >
            Voltar ao Início
          </Button>
        </motion.div>
      </motion.div>
      </div>
    </BeamsBackground>
  );
}

