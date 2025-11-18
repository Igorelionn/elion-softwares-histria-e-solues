"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatedInput } from "@/components/ui/animated-input";
import { Textarea } from "@/components/ui/textarea";
import { GlassCalendarInput } from "@/components/ui/glass-calendar-input";
import { CountrySelector, formatPhoneByCountry, countries, type Country } from "@/components/ui/country-selector";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AuthDialog } from "@/components/ui/auth-dialog";

interface Question {
  id: number;
  question: string;
  type: "text" | "email" | "phone" | "textarea" | "select" | "checkbox" | "date" | "time";
  options?: string[];
  placeholder?: string;
}

const questions: Question[] = [
  {
    id: 1,
    question: "Como devemos referir-nos à sua pessoa?",
    type: "text",
    placeholder: "Digite seu nome completo",
  },
  {
    id: 2,
    question: "A que e-mail devemos dirigir nosso contato?",
    type: "email",
    placeholder: "seuemail@exemplo.com",
  },
  {
    id: 3,
    question: "Qual telefone devemos contatar?",
    type: "phone",
    placeholder: "(00) 00000-0000",
  },
  {
    id: 4,
    question: "Que opção se alinha com seu projeto?",
    type: "select",
    options: [
      "Website Institucional",
      "E-commerce",
      "Sistema Web",
      "Aplicativo Mobile",
      "Aplicativo Desktop",
      "Outro",
    ],
  },
  {
    id: 5,
    question: "Conte-nos mais sobre seu projeto",
    type: "textarea",
    placeholder: "Descreva sua ideia, objetivos e expectativas...",
  },
  {
    id: 6,
    question: "Qual é o prazo ideal para seu projeto?",
    type: "select",
    options: [
      "Urgente (menos de 1 mês)",
      "Curto prazo (1-3 meses)",
      "Médio prazo (3-6 meses)",
      "Longo prazo (mais de 6 meses)",
      "Flexível",
    ],
  },
  {
    id: 7,
    question: "Qual é o seu orçamento estimado?",
    type: "select",
    options: [
      "Até R$ 5.000",
      "R$ 5.000 - R$ 15.000",
      "R$ 15.000 - R$ 30.000",
      "R$ 30.000 - R$ 50.000",
      "Acima de R$ 50.000",
      "Não tenho certeza",
    ],
  },
  {
    id: 8,
    question: "Em qual data deseja agendar o encontro?",
    type: "date",
    placeholder: "Selecione uma data",
  },
  {
    id: 9,
    question: "Selecione um horário para a reunião",
    type: "time",
    options: [
      "09:00",
      "11:00",
      "14:00",
      "16:00",
      "18:00",
    ],
  },
];

export default function SolicitarReuniaoPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string | string[] }>({});
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    countries.find(c => c.code === "BR") || countries[0]
  ); // Brasil como padrão
  const [validationError, setValidationError] = useState<string>("");
  const [isReviewStep, setIsReviewStep] = useState(false);
  const [isEditingFromReview, setIsEditingFromReview] = useState(false);
  const [otherDescription, setOtherDescription] = useState<{ [key: number]: string }>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [hasExistingMeeting, setHasExistingMeeting] = useState(false);
  const [isCheckingMeeting, setIsCheckingMeeting] = useState(true);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [authDialogTab, setAuthDialogTab] = useState<"login" | "signup">("signup");
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const hasCheckedSavedData = useRef(false);
  const isAdminCache = useRef<boolean | null>(null); // Cache do status de admin

  // Executar verificação inicial apenas uma vez
  useEffect(() => {
    console.log('🚀 Componente montado - iniciando verificação');
    console.log('🗑️ Limpando cache anterior');

    // RESETAR CACHE ao montar (importante para múltiplas visitas)
    isAdminCache.current = null;
    hasCheckedSavedData.current = false;

    let isMounted = true; // Flag para prevenir updates após unmount

    // TIMEOUT DE SEGURANÇA: Se após 3 segundos ainda estiver carregando, forçar parada
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn('⚠️ TIMEOUT DE SEGURANÇA: Forçando fim do carregamento após 3s');
        setIsCheckingMeeting(false);
        setHasExistingMeeting(false);
      }
    }, 3000); // Reduzido de 5s para 3s

    // Executar verificação
    const runCheck = async () => {
      try {
        await checkUser();
      } catch (error) {
        console.error('❌ Erro na verificação inicial:', error);
        if (isMounted) {
          setIsCheckingMeeting(false);
        }
      } finally {
        clearTimeout(safetyTimeout);
      }
    };

    runCheck();

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      console.log('🧹 Componente desmontado');
    };
  }, []); // Executa apenas na montagem

  // Listener separado para mudanças de autenticação
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event);

      if (event === 'SIGNED_IN' && session?.user) {
        setUserId(session.user.id);
        setIsAuthDialogOpen(false);

        // Verificar dados salvos após login
        const savedData = localStorage.getItem('pending_meeting_data');
        if (savedData && !hasCheckedSavedData.current) {
          hasCheckedSavedData.current = true;
          localStorage.removeItem('pending_meeting_data');

          try {
            const meetingData = JSON.parse(savedData);
            const now = Date.now();
            const savedTime = meetingData.timestamp || 0;
            const tenMinutes = 10 * 60 * 1000;

            if (now - savedTime <= tenMinutes) {
              setAnswers(meetingData.answers);
              setSelectedCountry(meetingData.selectedCountry);
              setOtherDescription(meetingData.otherDescription);

              setTimeout(async () => {
                await submitMeeting(session.user.id);
              }, 500);
            }
          } catch (error) {
            console.error('Erro ao processar reunião salva:', error);
          }
        }

        // Se tem submit pendente, executar agora
        if (pendingSubmit) {
          await submitMeeting(session.user.id);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pendingSubmit]); // Re-executar apenas quando pendingSubmit mudar

  const checkUser = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Erro ao verificar sessão:', error);
        setIsCheckingMeeting(false);
        return;
      }

      if (session?.user) {
        setUserId(session.user.id);
        // Verificar se já tem reunião agendada
        await checkExistingMeeting(session.user.id);
      } else {
        // Usuário não logado - permitir preencher formulário
        setUserId(null);
        setIsCheckingMeeting(false);
      }
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
      setIsCheckingMeeting(false);
    }
  };

  const checkExistingMeeting = async (userId: string) => {
    const startTime = performance.now();
    try {
      console.log('🔍 [START] Verificando reuniões para usuário:', userId);

      // Verificar cache primeiro
      let isAdmin = isAdminCache.current;

      if (isAdmin === null) {
        console.log('📥 Cache vazio - consultando BD');
        const queryStart = performance.now();

        try {
          // Verificar se o usuário é admin com timeout explícito
          const { data: userProfile, error: profileError } = await Promise.race([
            supabase
              .from('users')
              .select('role')
              .eq('id', userId)
              .single(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Query timeout após 2s')), 2000)
            )
          ]) as { data: { role: string } | null; error: any };

          const queryTime = performance.now() - queryStart;
          console.log(`⏱️ Query users levou ${queryTime.toFixed(2)}ms`);

          if (profileError) {
            console.error('⚠️ Erro ao verificar perfil:', profileError);
            isAdmin = false;
          } else {
            isAdmin = userProfile?.role === 'admin';
          }
        } catch (timeoutError) {
          console.error('❌ TIMEOUT na query users:', timeoutError);
          isAdmin = false;
        }

        // Armazenar no cache
        isAdminCache.current = isAdmin;
        console.log('💾 Cache atualizado - isAdmin:', isAdmin);
      } else {
        console.log('⚡ Usando cache - isAdmin:', isAdmin);
      }

      console.log('👤 Usuário é admin?', isAdmin);

      // Se for admin, permitir agendar múltiplas reuniões
      if (isAdmin) {
        console.log('✅ Admin detectado - permitindo agendamento');
        setHasExistingMeeting(false);
        setIsCheckingMeeting(false);
        return;
      }

      // Para usuários comuns, verificar se já tem reunião
      console.log('🔎 Verificando reuniões pendentes/confirmadas...');
      const meetingsQueryStart = performance.now();

      let data, error;
      try {
        const result = await Promise.race([
          (supabase as any)
            .from('meetings')
            .select('id, status')
            .eq('user_id', userId)
            .in('status', ['pending', 'confirmed'])
            .limit(1),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Query meetings timeout após 2s')), 2000)
          )
        ]);
        data = result.data;
        error = result.error;

        const meetingsQueryTime = performance.now() - meetingsQueryStart;
        console.log(`⏱️ Query meetings levou ${meetingsQueryTime.toFixed(2)}ms`);
      } catch (timeoutError) {
        console.error('❌ TIMEOUT na query meetings:', timeoutError);
        // Em caso de timeout, assumir que não há reuniões e permitir continuar
        data = null;
        error = null;
      }

      if (error) {
        console.error('⚠️ Erro ao verificar reunião existente:', error);
        // IMPORTANTE: Se houver erro de RLS ou qualquer outro erro,
        // permitir que o usuário continue e tente agendar.
        // O erro real será tratado na tentativa de inserção.
        console.log('⏭️ Permitindo continuar apesar do erro');
        setHasExistingMeeting(false);
        setIsCheckingMeeting(false);
        const totalTime = performance.now() - startTime;
        console.log(`⏱️ [END] Verificação completa em ${totalTime.toFixed(2)}ms`);
        return;
      }

      console.log('📊 Reuniões encontradas:', data?.length || 0);

      if (data && data.length > 0) {
        console.log('🚫 Usuário já tem reunião agendada');
        setHasExistingMeeting(true);
        // Redirecionar para página de reuniões agendadas após 2 segundos
        setTimeout(() => {
          router.push('/reunioes-agendadas');
        }, 2000);
      } else {
        // Não tem reunião - pode agendar
        console.log('✅ Usuário pode agendar nova reunião');
        setHasExistingMeeting(false);
      }
    } catch (error) {
      console.error('❌ Erro crítico ao verificar reuniões:', error);
      // Em caso de erro crítico, permitir continuar
      // O backend validará na hora de inserir
      setHasExistingMeeting(false);
    } finally {
      const totalTime = performance.now() - startTime;
      console.log(`⏱️ [END] Verificação total em ${totalTime.toFixed(2)}ms`);
      console.log('🏁 Finalizando verificação de reuniões');
      setIsCheckingMeeting(false);
    }
  };

  const currentQuestion = questions[currentStep];
  const progress = isReviewStep ? 100 : ((currentStep + 1) / questions.length) * 100;

  const validateCurrentQuestion = (): boolean => {
    setValidationError("");
    const answer = answers[currentQuestion.id];

    // Validação de nome (questão 1)
    if (currentQuestion.id === 1 && typeof answer === 'string') {
      if (!answer.trim().includes(' ')) {
        setValidationError("Digite seu nome completo, por favor!");
        return false;
      }
    }

    // Validação de email (questão 2)
    if (currentQuestion.id === 2 && typeof answer === 'string') {
      if (!answer.includes('@') || answer.indexOf('@') === 0 || answer.indexOf('@') === answer.length - 1) {
        setValidationError("Email inválido! Deve conter '@' entre caracteres");
        return false;
      }
    }

    // Validação de textarea (questão 5 - mínimo 250 caracteres)
    if (currentQuestion.id === 5 && typeof answer === 'string') {
      if (answer.trim().length < 250) {
        setValidationError("Descreva seu projeto com pelo menos 250 caracteres");
        return false;
      }
    }

    // Validação de "Outro" (questão 4)
    if (currentQuestion.id === 4 && answer === "Outro") {
      const description = otherDescription[currentQuestion.id];
      if (!description || description.trim().length < 10) {
        setValidationError("Por favor, descreva seu projeto (mínimo 10 caracteres)");
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (!validateCurrentQuestion()) {
      return;
    }

    // Se está editando a partir da revisão, volta para revisão
    if (isEditingFromReview) {
      setIsEditingFromReview(false);
      setIsReviewStep(true);
      setValidationError("");
      return;
    }

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
      setSelectedOptions([]);
      setValidationError("");
    } else {
      // Após a última pergunta, vai para revisão
      setIsReviewStep(true);
    }
  };

  const handleBack = () => {
    if (isReviewStep) {
      // Volta da revisão para a última pergunta
      setIsReviewStep(false);
      return;
    }

    // Se está voltando manualmente, cancela o modo de edição da revisão
    if (isEditingFromReview) {
      setIsEditingFromReview(false);
    }

    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      const previousAnswer = answers[questions[currentStep - 1].id];
      if (Array.isArray(previousAnswer)) {
        setSelectedOptions(previousAnswer);
      }
    }
  };

  const handleEditQuestion = (questionId: number) => {
    setIsEditingFromReview(true);
    setIsReviewStep(false);
    setCurrentStep(questionId - 1);
    const answer = answers[questionId];
    if (Array.isArray(answer)) {
      setSelectedOptions(answer);
    }
    // Limpar erro de validação ao editar
    setValidationError("");
  };

  const capitalizeFirstLetter = (text: string): string => {
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const handleAnswerChange = (value: string) => {
    let processedValue = value;

    // Capitalizar primeira letra do nome
    if (currentQuestion.id === 1 && value.length === 1) {
      processedValue = capitalizeFirstLetter(value);
    }

    // Formatar telefone baseado no país selecionado
    if (currentQuestion.id === 3) {
      processedValue = formatPhoneByCountry(value, selectedCountry);
    }

    // Limpar descrição do "Outro" se selecionar outra opção
    if (currentQuestion.type === "select" && value !== "Outro" && otherDescription[currentQuestion.id]) {
      const newOtherDescription = { ...otherDescription };
      delete newOtherDescription[currentQuestion.id];
      setOtherDescription(newOtherDescription);
    }

    setAnswers({ ...answers, [currentQuestion.id]: processedValue });
    setValidationError(""); // Limpar erro ao digitar
  };

  const handleCheckboxToggle = (option: string) => {
    const newSelected = selectedOptions.includes(option)
      ? selectedOptions.filter((item) => item !== option)
      : [...selectedOptions, option];

    setSelectedOptions(newSelected);
    setAnswers({ ...answers, [currentQuestion.id]: newSelected });
  };

  const submitMeeting = async (userIdToUse: string) => {
    setIsSubmitting(true);
    setPendingSubmit(false);

    try {
      // Formatar data para o formato correto
      const meetingDate = answers[8] as string;
      const [year, month, day] = meetingDate.split('-').map(Number);
      const formattedDate = new Date(year, month - 1, day).toISOString();

      // Verificar se já existe uma reunião muito recente com os mesmos dados (últimos 5 minutos)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: recentMeetings, error: checkError } = await (supabase as any)
        .from('meetings')
        .select('id, email, meeting_date')
        .eq('user_id', userIdToUse)
        .eq('email', answers[2] as string)
        .eq('meeting_date', formattedDate)
        .gte('created_at', fiveMinutesAgo);

      if (checkError) {
        // Silenciar erro de RLS - é esperado para usuários não autenticados
      } else if (recentMeetings && recentMeetings.length > 0) {
                router.push("/solicitar-reuniao/confirmado");
        return;
      }

      // Preparar dados para salvar
      const meetingData = {
        user_id: userIdToUse,
        full_name: answers[1] as string,
        email: answers[2] as string,
        phone: `${selectedCountry.dial_code} ${answers[3] as string}`,
        project_type: answers[4] === "Outro"
          ? `Outro: ${otherDescription[4]}`
          : answers[4] as string,
        project_description: answers[5] as string,
        timeline: answers[6] as string,
        budget: answers[7] as string,
        meeting_date: formattedDate,
        meeting_time: answers[9] as string, // Horário da reunião
        status: 'pending',
        created_at: new Date().toISOString()
      };

      // Salvar no banco de dados
      const { error } = await (supabase as any)
        .from('meetings')
        .insert([meetingData]);

      if (error) {
        console.error('Erro ao salvar reunião:', error);
        throw error;
      }

            // Redirecionar para página de confirmação
      router.push("/solicitar-reuniao/confirmado");
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao agendar reunião. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveMeetingDataToLocalStorage = () => {
    const meetingData = {
      answers,
      selectedCountry,
      otherDescription,
      timestamp: Date.now() // Adicionar timestamp para expiração
    };
    localStorage.setItem('pending_meeting_data', JSON.stringify(meetingData));
      };

  const handleSubmit = async () => {
    // Verificar se o usuário está logado
    if (!userId) {
      // Não está logado - abrir dialog de autenticação
      setPendingSubmit(true);
      setAuthDialogTab("signup");
      setIsAuthDialogOpen(true);
      return;
    }

    // Está logado - submeter diretamente
    await submitMeeting(userId);
  };

  const isAnswered = () => {
    const answer = answers[currentQuestion.id];
    if (currentQuestion.type === "checkbox") {
      return selectedOptions.length > 0;
    }

    // Validação especial para textarea (mínimo 250 caracteres)
    if (currentQuestion.type === "textarea") {
      return answer && answer.toString().trim().length >= 250;
    }

    // Validação especial para "Outro" - precisa ter descrição
    if (currentQuestion.type === "select" && answer === "Outro") {
      const description = otherDescription[currentQuestion.id];
      return description && description.trim().length >= 10;
    }

    return answer && answer.toString().trim() !== "";
  };

  const formatAnswerForReview = (questionId: number): string => {
    const answer = answers[questionId];
    const question = questions.find(q => q.id === questionId);

    if (!answer || !question) return "";

    // Formatar data
    if (question.type === "date" && typeof answer === "string") {
      try {
        const [year, month, day] = answer.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return format(date, "dd/MM/yyyy");
      } catch {
        return answer as string;
      }
    }

    // Formatar telefone
    if (question.type === "phone" && typeof answer === "string") {
      return `${selectedCountry.dial_code} ${answer}`;
    }

    // Formatar array (checkbox)
    if (Array.isArray(answer)) {
      return answer.join(", ");
    }

    // Formatar "Outro" com descrição
    if (answer === "Outro" && otherDescription[questionId]) {
      return `Outro: ${otherDescription[questionId]}`;
    }

    return answer as string;
  };

  // Mostrar tela de loading ou mensagem de reunião existente
  if (isCheckingMeeting || hasExistingMeeting) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 max-w-md"
        >
          {isCheckingMeeting ? (
            <>
              <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
              <p className="text-white/60 text-lg">Verificando suas reuniões...</p>
            </>
          ) : hasExistingMeeting ? (
            <>
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto">
                <Calendar className="w-10 h-10 text-white" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-medium text-white">
                  Você já tem uma reunião agendada
                </h1>
                <p className="text-white/60">
                  Redirecionando para suas reuniões...
                </p>
              </div>
              <div className="w-48 h-1 bg-white/10 rounded-full mx-auto overflow-hidden">
                <motion.div
                  className="h-full bg-white"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2 }}
                />
              </div>
            </>
          ) : null}
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <AuthDialog
        isOpen={isAuthDialogOpen}
        onClose={() => {
          setIsAuthDialogOpen(false);
          setPendingSubmit(false);
        }}
        defaultTab={authDialogTab}
        preventRedirect={true}
        redirectTo={`${window.location.origin}/solicitar-reuniao`}
        onBeforeGoogleLogin={saveMeetingDataToLocalStorage}
      />

      <div className="min-h-screen bg-black flex flex-col">
        {/* Header com botão voltar */}
        <div className="absolute top-8 left-8 z-50">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="text-white/60 hover:text-white hover:bg-white/5 h-12 w-12 p-0 cursor-pointer"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
      </div>

      {/* Barra de Progresso */}
      <div className="fixed top-0 left-0 right-0 z-40 px-8 pt-6">
        <div className="max-w-xl mx-auto flex gap-2">
          {questions.map((q, index) => (
            <div key={q.id} className="flex-1">
              <motion.div
                className={`h-0.5 rounded-full transition-all duration-300 ${
                  isReviewStep || index <= currentStep ? "bg-white" : "bg-white/20"
                }`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: isReviewStep || index <= currentStep ? 1 : 1 }}
                transition={{ duration: 0.3 }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex items-center justify-center px-6 pt-24 pb-12">
        <motion.div
          className="w-full"
          animate={{ maxWidth: isReviewStep ? '80rem' : '36rem' }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <AnimatePresence mode="wait">
            {isReviewStep ? (
              <motion.div
                key="review"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                className="space-y-6 pt-8"
              >
                {/* Título da Revisão */}
                <motion.div
                  className="text-center space-y-2 mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <h1 className="text-2xl md:text-3xl font-medium text-white">
                    Revise suas informações
                  </h1>
                  <p className="text-white/60 text-sm">
                    Confira se está tudo correto antes de enviar
                  </p>
                </motion.div>

                {/* Lista de Respostas */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: {
                      transition: {
                        staggerChildren: 0.08,
                        delayChildren: 0.2
                      }
                    }
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {questions.map((question) => {
                      const answer = formatAnswerForReview(question.id);
                      // Campos que devem ocupar toda a largura (questão 5 - projeto)
                      const isFullWidth = question.id === 5;

                        return (
                          <motion.div
                            key={question.id}
                            variants={{
                              hidden: { opacity: 0, y: 20 },
                              visible: {
                                opacity: 1,
                                y: 0,
                                transition: {
                                  duration: 0.5,
                                  ease: [0.25, 0.1, 0.25, 1]
                                }
                              }
                            }}
                            className={`border-l-2 border-t border-b-2 border-r border-white/15 rounded-[24px_8px_24px_8px] p-5 hover:bg-white/[0.03] hover:border-white/25 transition-all duration-200 group overflow-hidden ${isFullWidth ? 'md:col-span-2' : ''}`}
                          >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <h3 className="text-white/60 text-sm font-medium flex-1 min-w-0">
                              {question.question}
                            </h3>
                            <button
                              onClick={() => handleEditQuestion(question.id)}
                              className="text-white/40 hover:text-white text-xs px-3 py-1.5 rounded-lg border border-white/20 hover:border-white/40 transition-all cursor-pointer flex-shrink-0 whitespace-nowrap"
                            >
                              Editar
                            </button>
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-white text-base leading-relaxed break-words overflow-wrap-anywhere">
                              {answer}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Botões de Navegação */}
                <motion.div
                  className="flex gap-3 pt-6 items-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <Button
                    onClick={handleBack}
                    variant="ghost"
                    className="text-white/60 hover:text-white hover:bg-white/5 px-4 cursor-pointer w-[35%] h-10"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-white text-black hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer h-10 w-[65%]"
                  >
                    {isSubmitting ? (
                      "Enviando..."
                    ) : (
                      <>
                        Confirmar e Enviar
                        <Check className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                className="space-y-6"
              >
                {/* Pergunta */}
                <motion.h1
                  className="text-2xl md:text-3xl font-medium text-white"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  {currentQuestion.question}
                </motion.h1>

              {/* Campo de Resposta */}
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              >
                {currentQuestion.type === "text" && (
                  <div>
                    <AnimatedInput
                      label={currentQuestion.placeholder || ""}
                      value={(answers[currentQuestion.id] as string) || ""}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      maxLength={100}
                      autoFocus
                    />
                    {validationError && currentQuestion.id === 1 && (
                      <p className="text-red-400 text-sm mt-2">{validationError}</p>
                    )}
                  </div>
                )}

                {currentQuestion.type === "email" && (
                  <div>
                    <Input
                      type="email"
                      placeholder={currentQuestion.placeholder}
                      value={(answers[currentQuestion.id] as string) || ""}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      maxLength={100}
                      className="bg-transparent border-none rounded-none text-white text-base py-3 px-0 placeholder:text-white/30 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                      autoFocus
                    />
                    {validationError && currentQuestion.id === 2 && (
                      <p className="text-red-400 text-sm mt-2">{validationError}</p>
                    )}
                  </div>
                )}

                {currentQuestion.type === "phone" && (
                  <div>
                    <div className="flex items-center bg-transparent">
                      <CountrySelector
                        selectedCountry={selectedCountry}
                        onSelectCountry={(country) => {
                          setSelectedCountry(country);
                          // Reformatar o número existente para o novo formato do país
                          const currentPhone = answers[currentQuestion.id] as string || "";
                          if (currentPhone) {
                            const reformatted = formatPhoneByCountry(currentPhone, country);
                            setAnswers({ ...answers, [currentQuestion.id]: reformatted });
                          }
                        }}
                      />
                      <span className="text-white/70 text-base">{selectedCountry.dial_code}</span>
                      <Input
                        type="tel"
                        placeholder={selectedCountry.format || "(00) 00000-0000"}
                        value={(answers[currentQuestion.id] as string) || ""}
                        onChange={(e) => handleAnswerChange(e.target.value)}
                        maxLength={(selectedCountry.maxLength || 11) + (selectedCountry.format?.replace(/X/g, "").length || 4)}
                        className="flex-1 bg-transparent border-none text-white text-base py-3 px-2 placeholder:text-white/30 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                {currentQuestion.type === "textarea" && (
                  <div>
                    <Textarea
                      placeholder={currentQuestion.placeholder}
                      value={(answers[currentQuestion.id] as string) || ""}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      maxLength={3000}
                      className="bg-transparent border-none rounded-none text-white text-base py-3 px-0 placeholder:text-white/30 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none min-h-[100px] resize-none"
                      autoFocus
                    />
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-white/40 text-xs">
                        {((answers[currentQuestion.id] as string) || "").length}/3000 caracteres
                        {((answers[currentQuestion.id] as string) || "").length < 250 && " (mínimo 250)"}
                      </p>
                    </div>
                    {validationError && currentQuestion.id === 5 && (
                      <p className="text-red-400 text-sm mt-1">{validationError}</p>
                    )}
                  </div>
                )}

                {currentQuestion.type === "date" && (
                  <GlassCalendarInput
                    selectedDate={
                      answers[currentQuestion.id]
                        ? (() => {
                            const dateStr = answers[currentQuestion.id] as string;
                            const [year, month, day] = dateStr.split('-').map(Number);
                            return new Date(year, month - 1, day);
                          })()
                        : null
                    }
                    onDateSelect={(date) => handleAnswerChange(format(date, "yyyy-MM-dd"))}
                    placeholder="DD/MM/AAAA"
                    size="large"
                  />
                )}

                {currentQuestion.type === "time" && (
                  <div className="space-y-6">
                    <motion.div
                      className="grid gap-3"
                      initial="hidden"
                      animate="visible"
                      variants={{
                        visible: {
                          transition: {
                            staggerChildren: 0.08
                          }
                        }
                      }}
                    >
                      {currentQuestion.options?.map((time) => (
                        <motion.button
                          key={time}
                          variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: {
                              opacity: 1,
                              y: 0,
                              transition: {
                                duration: 0.5,
                                ease: [0.25, 0.1, 0.25, 1]
                              }
                            }
                          }}
                          onClick={() => handleAnswerChange(time)}
                          className={`text-left px-6 py-4 rounded-lg border transition-all text-base cursor-pointer flex items-center justify-between ${
                            answers[currentQuestion.id] === time
                              ? "bg-white/10 text-white border-white/40"
                              : "bg-transparent text-white/80 border-white/20 hover:border-white/50 hover:text-white"
                          }`}
                        >
                          <span className="font-medium">{time}</span>
                          {answers[currentQuestion.id] === time && (
                            <Check className="h-5 w-5 text-white" />
                          )}
                        </motion.button>
                      ))}
                    </motion.div>

                    {/* Botão para trocar data */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      className="space-y-4"
                    >
                      <button
                        onClick={handleBack}
                        className="w-full px-4 py-3 rounded-lg border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Calendar className="h-4 w-4" />
                        Trocar data
                      </button>

                      {/* Texto informativo */}
                      <p className="text-center text-white/40 text-xs leading-relaxed">
                        Nenhum desses horários se encaixam na sua agenda?<br />
                        <span className="text-white/60">Troque o dia e encontre novos horários disponíveis</span>
                      </p>
                    </motion.div>
                  </div>
                )}

                {currentQuestion.type === "select" && (
                  <div className="space-y-4">
                    <motion.div
                      className="grid gap-2"
                      initial="hidden"
                      animate="visible"
                      variants={{
                        visible: {
                          transition: {
                            staggerChildren: 0.08
                          }
                        }
                      }}
                    >
                      {currentQuestion.options?.map((option) => (
                        <motion.button
                          key={option}
                          variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: {
                              opacity: 1,
                              y: 0,
                              transition: {
                                duration: 0.5,
                                ease: [0.25, 0.1, 0.25, 1]
                              }
                            }
                          }}
                          onClick={() => handleAnswerChange(option)}
                          className={`text-left px-4 py-3 rounded-lg border transition-all text-sm cursor-pointer ${
                            answers[currentQuestion.id] === option
                              ? "bg-white/10 text-white border-white/40"
                              : "bg-transparent text-white/80 border-white/20 hover:border-white/50 hover:text-white"
                          }`}
                        >
                          {option}
                        </motion.button>
                      ))}
                    </motion.div>

                    {/* Campo de descrição para "Outro" */}
                    {answers[currentQuestion.id] === "Outro" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2">
                          <Textarea
                            placeholder="Descreva seu projeto..."
                            value={otherDescription[currentQuestion.id] || ""}
                            onChange={(e) => {
                              setOtherDescription({
                                ...otherDescription,
                                [currentQuestion.id]: e.target.value
                              });
                              setValidationError("");
                            }}
                            maxLength={500}
                            className="bg-transparent border border-white/20 rounded-lg text-white text-sm py-3 px-4 placeholder:text-white/30 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-white/50 min-h-[80px] resize-none"
                            autoFocus
                          />
                          <p className="text-white/40 text-xs mt-2">
                            {(otherDescription[currentQuestion.id] || "").length}/500 caracteres (mínimo 10)
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {validationError && currentQuestion.id === 4 && (
                      <p className="text-red-400 text-sm">{validationError}</p>
                    )}
                  </div>
                )}

                {currentQuestion.type === "checkbox" && (
                  <motion.div
                    className="grid gap-2"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      visible: {
                        transition: {
                          staggerChildren: 0.08
                        }
                      }
                    }}
                  >
                    {currentQuestion.options?.map((option) => (
                      <motion.button
                        key={option}
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          visible: {
                            opacity: 1,
                            y: 0,
                            transition: {
                              duration: 0.5,
                              ease: [0.25, 0.1, 0.25, 1]
                            }
                          }
                        }}
                        onClick={() => handleCheckboxToggle(option)}
                        className={`text-left px-4 py-3 rounded-lg border transition-all flex items-center gap-3 text-sm cursor-pointer ${
                          selectedOptions.includes(option)
                            ? "bg-white/10 text-white border-white/40"
                            : "bg-transparent text-white/80 border-white/20 hover:border-white/50 hover:text-white"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                            selectedOptions.includes(option)
                              ? "bg-white border-white"
                              : "border-white/40"
                          }`}
                        >
                          {selectedOptions.includes(option) && (
                            <Check className="h-3 w-3 text-black" />
                          )}
                        </div>
                        {option}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </motion.div>

              {/* Botões de Navegação */}
               <motion.div
                 className="space-y-4 pt-12"
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
               >
                 <div className="flex gap-3 items-center">
                   {currentStep > 0 && (
                     <Button
                       onClick={handleBack}
                       variant="ghost"
                       className="text-white/60 hover:text-white hover:bg-white/5 px-4 cursor-pointer h-10"
                     >
                       <ArrowLeft className="mr-2 h-4 w-4" />
                       Voltar
                     </Button>
                   )}
                   <Button
                     onClick={handleNext}
                     disabled={!isAnswered() || isSubmitting}
                     className="bg-white text-black hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex-1 h-10 min-w-0"
                   >
                     {isSubmitting ? (
                       "Enviando..."
                     ) : currentStep === questions.length - 1 && !isEditingFromReview ? (
                       <>
                         Revisar Informações
                         <ArrowRight className="ml-2 h-4 w-4" />
                       </>
                     ) : (
                       <>
                         Avançar
                         <ArrowRight className="ml-2 h-4 w-4" />
                       </>
                     )}
                   </Button>
                 </div>
                 {isEditingFromReview && (
                   <button
                     onClick={() => {
                       setIsEditingFromReview(false);
                       setIsReviewStep(true);
                     }}
                     className="w-full text-center text-white/50 hover:text-white text-sm py-2 transition-colors cursor-pointer"
                   >
                     Voltar para revisão
                   </button>
                 )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
    </>
  );
}

