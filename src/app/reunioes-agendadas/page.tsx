'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, ArrowLeft, Calendar, Clock, Mail, Phone, Briefcase, DollarSign, FileText, ChevronDown, ChevronUp, Search, Filter, X, CalendarClock, XCircle, LayoutList, CalendarDays } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { GlassCalendarInput } from '@/components/ui/glass-calendar-input'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { toast } from 'sonner'
import { checkUserBlockStatus } from '@/middleware/auth-check'

interface Meeting {
    id: string
    full_name: string
    email: string
    phone: string
    project_type: string
    project_description: string
    timeline: string
    budget: string
    meeting_date: string
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
    created_at: string
    reschedule_count?: number
    cancelled_at?: string
}

export default function ReuniõesAgendadasPage() {
    const router = useRouter()
    const [user, setUser] = useState<SupabaseUser | null>(null)
    const [loading, setLoading] = useState(true)
    const [meetings, setMeetings] = useState<Meeting[]>([])
    const [filteredMeetings, setFilteredMeetings] = useState<Meeting[]>([])
    const [expandedMeeting, setExpandedMeeting] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('pending')
    const [sortBy, setSortBy] = useState<'date' | 'created'>('date')
    const [sortMenuOpen, setSortMenuOpen] = useState(false)
    const sortDropdownRef = useRef<HTMLDivElement>(null)
    const hasCheckedUser = useRef(false)
    const isCheckingUser = useRef(false)
    const [isAdmin, setIsAdmin] = useState(false)

    // Reagendar e Cancelar
    const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false)
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
    const [newMeetingDate, setNewMeetingDate] = useState<Date | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [actionError, setActionError] = useState('')

    // Estados do Calendário
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)

    useEffect(() => {
        // Previne múltiplas chamadas simultâneas
        if (hasCheckedUser.current || isCheckingUser.current) return

        isCheckingUser.current = true
        checkUser()

        // Listener para mudanças de autenticação
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT' || !session) {
                router.push('/')
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                setUser(session.user)
                await loadMeetings(session.user.id)
            }
        })

        // Listener para quando o usuário volta à aba
        const handleVisibilityChange = async () => {
            if (!document.hidden) {
                // Usuário voltou à aba, revalidar sessão
                const { data: { session }, error } = await supabase.auth.getSession()

                if (error || !session) {
                    router.push('/')
                    return
                }

                // Atualizar usuário se mudou
                setUser(session.user)

                // Recarregar reuniões para pegar atualizações
                await loadMeetings(session.user.id)
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            subscription.unsubscribe()
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [router])

    // Fechar dropdown ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
                setSortMenuOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const checkUser = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                router.push('/')
                return
            }

            // Verificar se o usuário está bloqueado
            const blockStatus = await checkUserBlockStatus(session.user.id)
            if (blockStatus.isBlocked) {
                await supabase.auth.signOut()
                router.push('/conta-bloqueada')
                return
            }

            setUser(session.user)

            // Verificar se é admin
            const { data: profile } = await (supabase as any)
                .from('users')
                .select('role')
                .eq('id', session.user.id)
                .single() as { data: { role: string } | null; error: any }

            setIsAdmin(profile?.role === 'admin')

            await loadMeetings(session.user.id)
        } catch (err) {
            console.error('Error loading user:', err)
        } finally {
            setLoading(false)
            hasCheckedUser.current = true
            isCheckingUser.current = false
        }
    }

    const loadMeetings = async (userId: string) => {
        try {
            const { data, error} = await (supabase as any)
                .from('meetings')
                .select('*')
                .eq('user_id', userId)
                .order('meeting_date', { ascending: true })

            if (error) throw error

            setMeetings(data || [])
        } catch (err) {
            console.error('Error loading meetings:', err)
        }
    }

    const handleRescheduleClick = (meeting: Meeting) => {
        setSelectedMeeting(meeting)
        setNewMeetingDate(null)
        setActionError('')
        setIsRescheduleDialogOpen(true)
    }

    const handleCancelClick = (meeting: Meeting) => {
        setSelectedMeeting(meeting)
        setActionError('')
        setIsCancelDialogOpen(true)
    }

    const handleReschedule = async () => {
        if (!selectedMeeting || !newMeetingDate || !user) return

        setIsProcessing(true)
        setActionError('')

        try {
            const rescheduleCount = selectedMeeting.reschedule_count || 0

            // Verificar se já atingiu o limite de reagendamentos (exceto para admins)
            if (!isAdmin && rescheduleCount >= 3) {
                setActionError('Você já atingiu o limite de 3 reagendamentos para esta reunião.')
                setIsProcessing(false)
                return
            }

            // Verificar se a nova data é diferente da data atual
            const currentDate = new Date(selectedMeeting.meeting_date)
            const normalizedCurrentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
            const normalizedNewDate = new Date(newMeetingDate.getFullYear(), newMeetingDate.getMonth(), newMeetingDate.getDate())

            if (normalizedCurrentDate.getTime() === normalizedNewDate.getTime()) {
                setActionError('A nova data não pode ser igual à data atual da reunião.')
                setIsProcessing(false)
                return
            }

            // Atualizar reunião
            const { error } = await (supabase as any)
                .from('meetings')
                .update({
                    meeting_date: newMeetingDate.toISOString(),
                    reschedule_count: rescheduleCount + 1,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedMeeting.id)

            if (error) throw error

            // Recarregar reuniões
            await loadMeetings(user.id)

            // Mostrar notificação de sucesso
            if (isAdmin) {
                toast.success('Reunião reagendada com sucesso!', {
                    description: 'Como administrador, você tem reagendamentos ilimitados.'
                })
            } else {
                // Calcular reagendamentos restantes
                const remainingReschedules = 3 - (rescheduleCount + 1)

                toast.success('Reunião reagendada com sucesso!', {
                    description: `Você ainda pode reagendar ${remainingReschedules} vez(es). Limite: 3 reagendamentos por reunião.`
                })
            }

            // Fechar dialog
            setIsRescheduleDialogOpen(false)
            setSelectedMeeting(null)
            setNewMeetingDate(null)
        } catch (err: any) {
            console.error('Erro ao reagendar:', err)
            setActionError(err.message || 'Erro ao reagendar reunião')
        } finally {
            setIsProcessing(false)
        }
    }

    const checkMonthlyCancellations = async (userId: string): Promise<number> => {
        const now = new Date()
        const month = now.getMonth() + 1
        const year = now.getFullYear()

        try {
            const { data, error } = await (supabase as any)
                .from('user_monthly_cancellations')
                .select('cancellation_count')
                .eq('user_id', userId)
                .eq('month', month)
                .eq('year', year)
                .single()

            if (error && error.code !== 'PGRST116') {
                throw error
            }

            return data?.cancellation_count || 0
        } catch (err) {
            console.error('Erro ao verificar cancelamentos mensais:', err)
            return 0
        }
    }

    const updateMonthlyCancellations = async (userId: string) => {
        const now = new Date()
        const month = now.getMonth() + 1
        const year = now.getFullYear()

        try {
            // Tentar atualizar primeiro
            const { data: existing } = await (supabase as any)
                .from('user_monthly_cancellations')
                .select('id, cancellation_count')
                .eq('user_id', userId)
                .eq('month', month)
                .eq('year', year)
                .single()

            if (existing) {
                // Atualizar contador existente
                await (supabase as any)
                    .from('user_monthly_cancellations')
                    .update({
                        cancellation_count: existing.cancellation_count + 1,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existing.id)
            } else {
                // Criar novo registro
                await (supabase as any)
                    .from('user_monthly_cancellations')
                    .insert({
                        user_id: userId,
                        month,
                        year,
                        cancellation_count: 1
                    })
            }
        } catch (err) {
            console.error('Erro ao atualizar cancelamentos mensais:', err)
        }
    }

    const handleCancelMeeting = async () => {
        if (!selectedMeeting || !user) return

        setIsProcessing(true)
        setActionError('')

        try {
            // Verificar cancelamentos do mês (exceto para admins)
            let monthlyCancellations = 0
            if (!isAdmin) {
                monthlyCancellations = await checkMonthlyCancellations(user.id)

                if (monthlyCancellations >= 2) {
                    setActionError('Você já atingiu o limite de 2 cancelamentos por mês.')
                    setIsProcessing(false)
                    return
                }
            }

            // Cancelar reunião
            const { error } = await (supabase as any)
                .from('meetings')
                .update({
                    status: 'cancelled',
                    cancelled_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedMeeting.id)

            if (error) throw error

            // Atualizar contador de cancelamentos mensais (apenas para não-admins)
            if (!isAdmin) {
                await updateMonthlyCancellations(user.id)
            }

            // Recarregar reuniões
            await loadMeetings(user.id)

            // Mostrar notificação de sucesso
            if (isAdmin) {
                toast.success('Reunião cancelada com sucesso!', {
                    description: 'Como administrador, você tem cancelamentos ilimitados.'
                })
            } else {
                // Calcular cancelamentos restantes no mês
                const remainingCancellations = 2 - (monthlyCancellations + 1)

                toast.success('Reunião cancelada com sucesso!', {
                    description: `Você ainda pode cancelar ${remainingCancellations} reunião(ões) este mês. Limite: 2 cancelamentos por mês.`
                })
            }

            // Fechar dialog
            setIsCancelDialogOpen(false)
            setSelectedMeeting(null)
        } catch (err: any) {
            console.error('Erro ao cancelar:', err)
            setActionError(err.message || 'Erro ao cancelar reunião')
        } finally {
            setIsProcessing(false)
        }
    }

    const filterMeetings = useCallback(() => {
        let filtered = [...meetings]

        // Filtrar por busca
        if (searchTerm) {
            const search = searchTerm.toLowerCase()
            filtered = filtered.filter(meeting =>
                meeting.full_name.toLowerCase().includes(search) ||
                meeting.email.toLowerCase().includes(search) ||
                meeting.project_type.toLowerCase().includes(search) ||
                meeting.phone.toLowerCase().includes(search)
            )
        }

        // Filtrar por status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(meeting => meeting.status === statusFilter)
        }

        // Ordenar
        filtered.sort((a, b) => {
            if (sortBy === 'date') {
                return new Date(a.meeting_date).getTime() - new Date(b.meeting_date).getTime()
            } else {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            }
        })

        setFilteredMeetings(filtered)
    }, [meetings, searchTerm, statusFilter, sortBy])

    // Apply filters whenever dependencies change
    useEffect(() => {
        filterMeetings()
    }, [filterMeetings])

    // Funções do Calendário
    const getConfirmedMeetings = () => {
        return meetings.filter(meeting => meeting.status === 'confirmed')
    }

    const getMeetingsForDate = (date: Date) => {
        const confirmed = getConfirmedMeetings()
        return confirmed.filter(meeting =>
            isSameDay(new Date(meeting.meeting_date), date)
        )
    }

    const getDaysInMonth = () => {
        const start = startOfWeek(startOfMonth(currentMonth), { locale: ptBR })
        const end = endOfWeek(endOfMonth(currentMonth), { locale: ptBR })
        return eachDayOfInterval({ start, end })
    }

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
    const goToToday = () => setCurrentMonth(new Date())

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-gray-50 text-gray-700 border-gray-300'
            case 'confirmed':
                return 'bg-gray-50 text-gray-700 border-gray-300'
            case 'completed':
                return 'bg-gray-50 text-gray-700 border-gray-300'
            case 'cancelled':
                return 'bg-red-50 text-red-700 border-red-200'
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending':
                return 'Pendente'
            case 'confirmed':
                return 'Confirmada'
            case 'completed':
                return 'Concluída'
            case 'cancelled':
                return 'Cancelada'
            default:
                return status
        }
    }

    const toggleMeeting = (meetingId: string) => {
        setExpandedMeeting(expandedMeeting === meetingId ? null : meetingId)
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header/Navbar */}
            <header className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20">
                    <div className="flex items-center justify-between h-full">
                        {/* Logo */}
                        <div className="flex items-center">
                            <Image
                                src="/logo.png"
                                alt="Elion Softwares"
                                width={150}
                                height={46}
                                className="h-5 w-auto cursor-pointer"
                                onClick={() => router.push('/')}
                                priority
                                style={{ height: '1.25rem', width: 'auto' }}
                            />
                        </div>

                        {/* Botão Voltar */}
                        <div className="flex items-center">
                            <button
                                onClick={() => router.push('/')}
                                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all cursor-pointer"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span className="font-medium text-sm">Voltar</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Page Title */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Reuniões Agendadas
                    </h1>
                    <p className="text-gray-600">
                        Gerencie e acompanhe todas as suas reuniões
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                {/* Filters and Search */}
                {meetings.length > 0 && (
                    <div className="mb-10 space-y-6">
                        {/* Search Bar */}
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar reuniões..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent focus:bg-white transition-all"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                                    aria-label="Limpar campo de busca"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        {/* Filters Row */}
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                            {/* Status Filter */}
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setStatusFilter('all')}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer",
                                        statusFilter === 'all'
                                            ? "bg-gray-100 text-gray-900 border border-gray-200"
                                            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                                    )}
                                >
                                    Todas
                                </button>
                                <button
                                    onClick={() => setStatusFilter('pending')}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer",
                                        statusFilter === 'pending'
                                            ? "bg-gray-100 text-gray-700 border border-gray-300"
                                            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                                    )}
                                >
                                    Pendentes
                                </button>
                                <button
                                    onClick={() => setStatusFilter('confirmed')}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer",
                                        statusFilter === 'confirmed'
                                            ? "bg-gray-100 text-gray-700 border border-gray-300"
                                            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                                    )}
                                >
                                    Confirmadas
                                </button>
                                <button
                                    onClick={() => setStatusFilter('completed')}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer",
                                        statusFilter === 'completed'
                                            ? "bg-gray-100 text-gray-700 border border-gray-300"
                                            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                                    )}
                                >
                                    Concluídas
                                </button>
                                <button
                                    onClick={() => setStatusFilter('cancelled')}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer",
                                        statusFilter === 'cancelled'
                                            ? "bg-red-50 text-red-700 border border-red-200"
                                            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                                    )}
                                >
                                    Canceladas
                                </button>
                            </div>

                            {/* Sort */}
                            <div ref={sortDropdownRef} className="relative">
                                <button
                                    onClick={() => setSortMenuOpen(!sortMenuOpen)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-sm text-gray-700 border border-gray-300 cursor-pointer transition-all"
                                >
                                    <span>{sortBy === 'date' ? 'Data da reunião' : 'Data de criação'}</span>
                                    <motion.div
                                        animate={{ rotate: sortMenuOpen ? 180 : 0 }}
                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                    >
                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                    </motion.div>
                                </button>

                                <AnimatePresence>
                                    {sortMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            transition={{ duration: 0.15, ease: "easeOut" }}
                                            className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-10"
                                        >
                                            <button
                                                onClick={() => {
                                                    setSortBy('date')
                                                    setSortMenuOpen(false)
                                                }}
                                                className={cn(
                                                    "w-full text-left px-4 py-3 text-sm transition-all cursor-pointer",
                                                    sortBy === 'date'
                                                        ? "bg-gray-50 text-gray-900 font-medium"
                                                        : "text-gray-600 hover:bg-gray-50"
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    <span>Data da reunião</span>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSortBy('created')
                                                    setSortMenuOpen(false)
                                                }}
                                                className={cn(
                                                    "w-full text-left px-4 py-3 text-sm transition-all cursor-pointer border-t border-gray-100",
                                                    sortBy === 'created'
                                                        ? "bg-gray-50 text-gray-900 font-medium"
                                                        : "text-gray-600 hover:bg-gray-50"
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    <span>Data de criação</span>
                                                </div>
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Results count */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <div className="flex items-center gap-2">
                                <div className="text-sm text-gray-600">
                                    Exibindo <span className="font-semibold text-gray-900">{filteredMeetings.length}</span> {filteredMeetings.length === 1 ? 'reunião' : 'reuniões'}
                                    {meetings.length !== filteredMeetings.length && (
                                        <span className="text-gray-400"> de {meetings.length} no total</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                            {(searchTerm || statusFilter !== 'all') && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('')
                                        setStatusFilter('all')
                                    }}
                                    className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer transition-colors font-medium"
                                >
                                    Limpar filtros
                                </button>
                            )}
                                {/* Toggle View Mode */}
                                {statusFilter === 'confirmed' && (
                                    <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={cn(
                                                "p-2 rounded-md transition-all cursor-pointer",
                                                viewMode === 'list'
                                                    ? "bg-white text-gray-900 shadow-sm"
                                                    : "text-gray-500 hover:text-gray-700"
                                            )}
                                            title="Visualização em lista"
                                        >
                                            <LayoutList className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setViewMode('calendar')}
                                            className={cn(
                                                "p-2 rounded-md transition-all cursor-pointer",
                                                viewMode === 'calendar'
                                                    ? "bg-white text-gray-900 shadow-sm"
                                                    : "text-gray-500 hover:text-gray-700"
                                            )}
                                            title="Visualização em calendário"
                                        >
                                            <CalendarDays className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    /* Skeleton Loaders */
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <div className="px-6 py-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
                                                <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse" />
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                                                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                                            </div>
                                        </div>
                                        <div className="w-9 h-9 bg-gray-200 rounded-lg animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : meetings.length === 0 ? (
                    <div className="min-h-[50vh] flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Calendar className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Nenhuma reunião agendada
                            </h3>
                            <p className="text-gray-600 mb-8 max-w-md">
                                Você ainda não tem reuniões agendadas. Agende sua primeira reunião para começar!
                            </p>
                            <Button
                                onClick={() => router.push('/solicitar-reuniao')}
                                className="bg-gray-900 text-white hover:bg-gray-800 cursor-pointer h-11 px-8"
                            >
                                Agendar Reunião
                            </Button>
                        </div>
                    </div>
                ) : filteredMeetings.length === 0 ? (
                    <div className="min-h-[40vh] flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Nenhuma reunião encontrada
                            </h3>
                            <p className="text-gray-600 mb-8 max-w-md">
                                Não encontramos reuniões com os filtros aplicados. Tente ajustar sua busca.
                            </p>
                            <Button
                                onClick={() => {
                                    setSearchTerm('')
                                    setStatusFilter('all')
                                }}
                                variant="outline"
                                className="cursor-pointer h-11 px-8"
                            >
                                Limpar filtros
                            </Button>
                        </div>
                    </div>
                ) : viewMode === 'calendar' && statusFilter === 'confirmed' ? (
                    /* Visualização em Calendário */
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        {/* Cabeçalho do Calendário */}
                        <div className="px-6 py-5 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
                                </h2>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={goToToday}
                                        className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                                    >
                                        Hoje
                                    </button>
                                    <button
                                        onClick={prevMonth}
                                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                                        title="Mês anterior"
                                    >
                                        <ChevronDown className="w-4 h-4 rotate-90" />
                                    </button>
                                    <button
                                        onClick={nextMonth}
                                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                                        title="Próximo mês"
                                    >
                                        <ChevronDown className="w-4 h-4 -rotate-90" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Grid do Calendário */}
                        <div className="p-6">
                            {/* Dias da Semana */}
                            <div className="grid grid-cols-7 gap-px mb-2">
                                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                                    <div key={day} className="text-center py-2 text-xs font-medium text-gray-500">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Dias do Mês */}
                            <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-lg overflow-hidden">
                                {getDaysInMonth().map((day, idx) => {
                                    const dayMeetings = getMeetingsForDate(day)
                                    const isCurrentMonth = isSameMonth(day, currentMonth)
                                    const isToday = isSameDay(day, new Date())
                                    const isSelected = selectedDate && isSameDay(day, selectedDate)
                                    const hasMeetings = dayMeetings.length > 0

                                    return (
                                        <motion.button
                                            key={idx}
                                            onClick={() => {
                                                if (hasMeetings) {
                                                    setSelectedDate(isSameDay(day, selectedDate || new Date()) ? null : day)
                                                }
                                            }}
                                            whileHover={hasMeetings ? { scale: 1.05 } : {}}
                                            whileTap={hasMeetings ? { scale: 0.95 } : {}}
                                            className={cn(
                                                "min-h-[80px] bg-white p-2 relative group transition-all cursor-pointer",
                                                !isCurrentMonth && "text-gray-300",
                                                isCurrentMonth && "text-gray-900",
                                                isToday && "ring-2 ring-gray-900 ring-inset",
                                                isSelected && "bg-gray-50",
                                                hasMeetings && "hover:bg-gray-50 cursor-pointer",
                                                !hasMeetings && "cursor-default"
                                            )}
                                        >
                                            {/* Número do Dia */}
                                            <div className={cn(
                                                "text-sm font-medium mb-1",
                                                isToday && "w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs"
                                            )}>
                                                {format(day, 'd')}
                                            </div>

                                            {/* Indicador de Reuniões */}
                                            {hasMeetings && (
                                                <div className="space-y-1">
                                                    {dayMeetings.slice(0, 2).map((meeting, i) => (
                                                        <div
                                                            key={meeting.id}
                                                            className="text-[10px] text-left px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded truncate group-hover:bg-gray-200 transition-colors"
                                                            title={meeting.project_type}
                                                        >
                                                            {meeting.project_type}
                                                        </div>
                                                    ))}
                                                    {dayMeetings.length > 2 && (
                                                        <div className="text-[10px] text-gray-500 px-1.5">
                                                            +{dayMeetings.length - 2} mais
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </motion.button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Reuniões do Dia Selecionado */}
                        <AnimatePresence>
                            {selectedDate && getMeetingsForDate(selectedDate).length > 0 && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden border-t border-gray-100"
                                >
                                    <div className="px-6 py-5 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-semibold text-gray-900">
                                                Reuniões em {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                                            </h3>
                                            <button
                                                onClick={() => setSelectedDate(null)}
                                                className="text-gray-400 hover:text-gray-600 cursor-pointer"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {getMeetingsForDate(selectedDate).map((meeting) => (
                                                <div
                                                    key={meeting.id}
                                                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-sm font-medium text-gray-900 mb-2">
                                                                {meeting.project_type}
                                                            </h4>
                                                            <div className="space-y-1 text-xs text-gray-600">
                                                                <div className="flex items-center gap-1.5">
                                                                    <Mail className="w-3 h-3 text-gray-400" />
                                                                    <span className="truncate">{meeting.email}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <Phone className="w-3 h-3 text-gray-400" />
                                                                    <span>{meeting.phone}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setExpandedMeeting(meeting.id)
                                                                setViewMode('list')
                                                                setSelectedDate(null)
                                                            }}
                                                            className="text-xs text-gray-600 hover:text-gray-900 font-medium cursor-pointer"
                                                        >
                                                            Ver detalhes →
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    /* Visualização em Lista */
                    <div className="space-y-4">
                        {filteredMeetings.map((meeting) => (
                            <motion.div
                                key={meeting.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 transition-all duration-300"
                            >
                                {/* Header da Reunião */}
                                <div
                                    className="px-6 py-5 cursor-pointer"
                                    onClick={() => toggleMeeting(meeting.id)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-3">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {meeting.project_type}
                                                </h3>
                                                <span className={cn(
                                                    "px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                    getStatusColor(meeting.status)
                                                )}>
                                                    {getStatusText(meeting.status)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    <span>
                                                        {format(new Date(meeting.meeting_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                                    </span>
                                                </div>
                                                <span className="text-gray-300">•</span>
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span>
                                                        Criada em {format(new Date(meeting.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <motion.button
                                            className="flex-shrink-0 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                                            animate={{ rotate: expandedMeeting === meeting.id ? 180 : 0 }}
                                            transition={{ duration: 0.3, ease: "easeOut" }}
                                        >
                                            <ChevronDown className="w-5 h-5" />
                                        </motion.button>
                                    </div>
                                </div>

                                {/* Detalhes Expandidos */}
                                <AnimatePresence>
                                    {expandedMeeting === meeting.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-6 pb-5 pt-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
                                                    {/* Informações de Contato */}
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-2">
                                                            <Mail className="w-4 h-4 text-gray-400" />
                                                            <div>
                                                                <p className="text-xs text-gray-500">Email</p>
                                                                <p className="text-sm text-gray-900">{meeting.email}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="w-4 h-4 text-gray-400" />
                                                            <div>
                                                                <p className="text-xs text-gray-500">Telefone</p>
                                                                <p className="text-sm text-gray-900">{meeting.phone}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Informações do Projeto */}
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-4 h-4 text-gray-400" />
                                                            <div>
                                                                <p className="text-xs text-gray-500">Prazo</p>
                                                                <p className="text-sm text-gray-900">{meeting.timeline}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <DollarSign className="w-4 h-4 text-gray-400" />
                                                            <div>
                                                                <p className="text-xs text-gray-500">Orçamento</p>
                                                                <p className="text-sm text-gray-900">{meeting.budget}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Descrição do Projeto */}
                                                <div className="pt-4 border-t border-gray-100">
                                                    <p className="text-xs text-gray-500 mb-2">Descrição do Projeto</p>
                                                    <p className="text-sm text-gray-700 leading-relaxed">
                                                        {meeting.project_description}
                                                    </p>
                                                </div>

                                                {/* Botões de Ação */}
                                                {(meeting.status === 'pending' || meeting.status === 'confirmed') && (
                                                    <div className="flex gap-2 pt-5 mt-5">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleRescheduleClick(meeting)
                                                            }}
                                                            disabled={!isAdmin && (meeting.reschedule_count || 0) >= 3}
                                                            className={cn(
                                                                "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer",
                                                                (!isAdmin && (meeting.reschedule_count || 0) >= 3)
                                                                    ? "text-gray-300 bg-gray-50 cursor-not-allowed"
                                                                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                                            )}
                                                        >
                                                            <CalendarClock className="w-4 h-4" />
                                                            <span>Reagendar</span>
                                                            {!isAdmin && (meeting.reschedule_count || 0) > 0 && (
                                                                <span className="text-xs text-gray-400">
                                                                    ({meeting.reschedule_count}/3)
                                                                </span>
                                                            )}
                                                            {isAdmin && (
                                                                <span className="text-xs text-blue-600 font-semibold">
                                                                    (∞)
                                                                </span>
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleCancelClick(meeting)
                                                            }}
                                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                            <span>Cancelar</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* Dialog de Reagendar */}
            <Dialog open={isRescheduleDialogOpen} onOpenChange={setIsRescheduleDialogOpen}>
                <DialogContent className="sm:max-w-2xl min-h-[500px]">
                    <DialogHeader className="space-y-3">
                        <DialogTitle className="text-2xl font-semibold text-gray-900">
                            Reagendar Reunião
                        </DialogTitle>
                        <DialogDescription className="text-base text-gray-600">
                            Escolha uma nova data para sua reunião
                        </DialogDescription>
                        {isAdmin ? (
                            <div className="bg-blue-50/50 border-l-2 border-blue-400 rounded-r-lg px-4 py-2.5">
                                <p className="text-xs text-blue-700 leading-relaxed font-medium">
                                    👑 Admin: Reagendamentos ilimitados
                                </p>
                            </div>
                        ) : (
                            selectedMeeting && (selectedMeeting.reschedule_count || 0) > 0 && (
                                <div className="bg-gray-50/50 border-l-2 border-gray-300 rounded-r-lg px-4 py-2.5">
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        Limite de reagendamentos {selectedMeeting.reschedule_count}/3
                                    </p>
                                </div>
                            )
                        )}
                    </DialogHeader>

                    {selectedMeeting && (
                        <div className="space-y-4 py-4">
                            {/* Informações da Reunião */}
                            <div className="bg-gray-50 rounded-lg p-4 space-y-2.5">
                                <div className="flex items-center gap-2 text-sm">
                                    <Briefcase className="w-4 h-4 text-gray-400" />
                                    <span className="font-medium text-gray-900">{selectedMeeting.project_type}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span className="truncate">{selectedMeeting.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span>{selectedMeeting.phone}</span>
                                </div>
                                <div className="pt-2 border-t border-gray-200">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span>
                                            Data atual: {format(new Date(selectedMeeting.meeting_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Seletor de Nova Data */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Nova data da reunião
                                </label>
                                <div className="w-full">
                                    <GlassCalendarInput
                                        selectedDate={newMeetingDate}
                                        onDateSelect={setNewMeetingDate}
                                        placeholder="Clique para selecionar a data"
                                        className="w-full h-12 bg-white border border-gray-200 hover:border-gray-300 focus:border-gray-400 rounded-xl text-base px-4"
                                        variant="light"
                                        noOverlayBlur={true}
                                    />
                                </div>
                            </div>

                            {actionError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <p className="text-sm text-red-800">{actionError}</p>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsRescheduleDialogOpen(false)
                                setActionError('')
                                setNewMeetingDate(null)
                            }}
                            className="cursor-pointer flex-1 sm:flex-initial"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleReschedule}
                            disabled={!newMeetingDate || isProcessing}
                            className="cursor-pointer flex-1 sm:flex-initial bg-gray-900 hover:bg-gray-800 text-white"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Reagendando...
                                </>
                            ) : (
                                'Confirmar Nova Data'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog de Cancelar */}
            <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader className="space-y-3">
                        <DialogTitle className="text-2xl font-semibold text-gray-900">
                            Cancelar Reunião
                        </DialogTitle>
                        <DialogDescription className="text-base text-gray-600">
                            Tem certeza que deseja cancelar esta reunião?
                        </DialogDescription>
                        <div className="bg-gray-50/50 border-l-2 border-gray-300 rounded-r-lg px-4 py-2.5">
                            <p className="text-xs text-gray-600 leading-relaxed">
                                Limite de 2 cancelamentos por mês
                            </p>
                        </div>
                    </DialogHeader>

                    {selectedMeeting && (
                        <div className="py-4">
                            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-gray-400" />
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500">Projeto</p>
                                        <p className="text-sm font-medium text-gray-900">{selectedMeeting.project_type}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500">Data da Reunião</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {format(new Date(selectedMeeting.meeting_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500">Email</p>
                                        <p className="text-sm font-medium text-gray-900">{selectedMeeting.email}</p>
                                    </div>
                                </div>
                            </div>

                            {actionError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                                    <p className="text-sm text-red-800">{actionError}</p>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsCancelDialogOpen(false)
                                setActionError('')
                            }}
                            className="cursor-pointer flex-1 sm:flex-initial"
                        >
                            Não, manter reunião
                        </Button>
                        <Button
                            onClick={handleCancelMeeting}
                            disabled={isProcessing}
                            className="cursor-pointer flex-1 sm:flex-initial bg-gray-900 hover:bg-gray-800 text-white"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Cancelando...
                                </>
                            ) : (
                                'Sim, cancelar reunião'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

