'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, User, LogOut, UserCircle2, Calendar, ChevronDown, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { cn } from '@/lib/utils'
import { FlipWords } from '@/components/ui/flip-words'
import { AuthDialog } from '@/components/ui/auth-dialog'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { authSession } from '@/lib/auth-session'
import { useTranslation } from '@/contexts/LanguageContext'
import { toast } from 'sonner'
import { useAuthCheck } from '@/hooks/useAuthCheck'

const transitionVariants = {
    item: {
        hidden: {
            opacity: 0,
            filter: 'blur(12px)',
            y: 12,
        },
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: {
                type: 'spring' as const,
                bounce: 0.3,
                duration: 1.5,
            },
        },
    },
}

export function HeroSection() {
    const { t } = useTranslation()

    return (
        <>
            <HeroHeader />
            <main className="relative overflow-hidden">
                <div
                    aria-hidden
                    className="z-[2] absolute inset-0 pointer-events-none isolate opacity-50 contain-strict hidden lg:block">
                    <div className="w-[35rem] h-[80rem] -translate-y-[350px] absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
                    <div className="h-[80rem] absolute left-0 top-0 w-56 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
                    <div className="h-[80rem] -translate-y-[350px] absolute left-0 top-0 w-56 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
                </div>
                <section>
                    <div className="relative pt-32 md:pt-44">
                        <AnimatedGroup
                            variants={{
                                container: {
                                    visible: {
                                        transition: {
                                            delayChildren: 1,
                                        },
                                    },
                                },
                                item: {
                                    hidden: {
                                        opacity: 0,
                                        y: 20,
                                    },
                                    visible: {
                                        opacity: 1,
                                        y: 0,
                                        transition: {
                                            type: 'spring' as const,
                                            bounce: 0.3,
                                            duration: 2,
                                        },
                                    },
                                },
                            }}
                            className="absolute inset-0 -z-20">
                            <img
                                src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=3276&h=4095&fit=crop&q=80"
                                alt="background"
                                className="absolute inset-x-0 top-56 -z-20 hidden lg:top-32 dark:block opacity-20"
                                width="3276"
                                height="4095"
                            />
                        </AnimatedGroup>
                        <div aria-hidden className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--background)_75%)]" />
                        <div className="mx-auto max-w-7xl px-6">
                            <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                                <AnimatedGroup variants={transitionVariants}>
                                    <div className="flex justify-center px-4">
                <h1 className="text-center">
                        {/* Mobile: 2 linhas | iPad/Desktop: layout original */}
                        <span className="hero-title block md:hidden text-3xl sm:text-4xl font-light leading-tight">
                            <span className="inline">
                                {t.hero.title1} <FlipWords words={[...t.hero.flipWords]} duration={4000} className="text-[rgb(20,20,20)]" /> {t.hero.title2}
                            </span>
                            <br />
                            <span className="inline">{t.hero.title3}</span>
                        </span>

                        {/* iPad/Desktop: layout original */}
                        <span className="hidden md:block">
                            <span className="hero-title block text-5xl md:text-[48px] lg:text-7xl xl:text-8xl 2xl:text-[96px] font-light leading-tight md:leading-[1.2] lg:leading-[1.15] xl:leading-[86px]">
                                <span className="inline whitespace-nowrap">
                                    {t.hero.title1} <FlipWords words={[...t.hero.flipWords]} duration={4000} className="text-[rgb(20,20,20)]" /> {t.hero.title2}
                                </span>
                            </span>
                            <span className="hero-title block mt-2 md:mt-3 lg:mt-2 text-5xl md:text-[48px] lg:text-7xl xl:text-8xl 2xl:text-[96px] font-light leading-tight md:leading-[1.2] lg:leading-[1.15] xl:leading-[86px]">{t.hero.title3}</span>
                        </span>
                                        </h1>
                                    </div>
                                    <p className="mx-auto mt-6 md:mt-7 lg:mt-10 max-w-5xl px-4 text-balance text-sm sm:text-base md:text-base lg:text-lg xl:text-xl text-muted-foreground">
                                        {t.hero.subtitle}
                                    </p>
                                </AnimatedGroup>
                            </div>
                        </div>

                        <AnimatedGroup
                            variants={{
                                container: {
                                    visible: {
                                        transition: {
                                            staggerChildren: 0.05,
                                            delayChildren: 0.75,
                                        },
                                    },
                                },
                                ...transitionVariants,
                            }}>
                            <div className="relative mt-8 sm:mt-12 md:mt-16 lg:mt-16 xl:mt-20 overflow-visible px-2 sm:px-4 md:px-4 lg:px-6 xl:px-12 2xl:px-20">
                                <div
                                    aria-hidden
                                    className="bg-gradient-to-b to-background absolute inset-0 z-10 from-transparent from-35%"
                                />
                                <div className="flex flex-col xl:flex-row items-center xl:items-start gap-6 xl:gap-8 justify-center max-w-7xl mx-auto">
                                    {/* Imagem Principal */}
                                    <div className="inset-shadow-2xs ring-background dark:inset-shadow-white/20 bg-background relative max-w-[95%] md:max-w-[90%] lg:max-w-4xl xl:max-w-3xl overflow-hidden rounded-xl sm:rounded-2xl border p-2 sm:p-3 md:p-3 lg:p-4 shadow-lg shadow-zinc-950/15 ring-1 flex-shrink-0">
                                        <Image
                                            className="bg-background relative rounded-xl sm:rounded-2xl w-full h-auto object-contain"
                                            src="/imagem-site-app.png"
                                            alt="app screen"
                                            width={2700}
                                            height={1440}
                                            priority
                                            quality={95}
                                        />
                                    </div>
                                    {/* Texto Descritivo */}
                                    <div className="hidden xl:flex flex-col justify-center max-w-sm xl:max-w-md">
                                        <p className="text-sm lg:text-base text-white/70 dark:text-white/60 leading-relaxed">
                                            {t.developments.auction.videoDescription}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </AnimatedGroup>
                    </div>
                </section>
            </main>
        </>
    )
}

const HeroHeader = () => {
    const { t } = useTranslation()
    const { checkAuth } = useAuthCheck()
    const [menuState, setMenuState] = React.useState(false)
    const [isScrolled, setIsScrolled] = React.useState(false)
    const [isOnDarkSection, setIsOnDarkSection] = React.useState(false)
    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)
    const [hoverStyle, setHoverStyle] = React.useState({ left: 0, width: 0, opacity: 0 })
    const menuRefs = React.useRef<(HTMLAnchorElement | null)[]>([])
    const [isAuthDialogOpen, setIsAuthDialogOpen] = React.useState(false)
    const [authDialogTab, setAuthDialogTab] = React.useState<"login" | "signup">("login")
    const [user, setUser] = React.useState<SupabaseUser | null>(null)
    const [isCheckingAuth, setIsCheckingAuth] = React.useState(true)
    const [showUserMenu, setShowUserMenu] = React.useState(false)
    const [avatarUrl, setAvatarUrl] = React.useState<string>(() => {
        // Carregar avatar do localStorage na inicialização
        if (typeof window !== 'undefined') {
            return localStorage.getItem('user_avatar_cache') || ''
        }
        return ''
    })
    const [isAdmin, setIsAdmin] = React.useState(false)
    const avatarCache = React.useRef<string>('')

    const menuItems = React.useMemo(() => [
        { name: t.nav.home, href: '#' },
        { name: t.nav.about, href: '#nosso-legado' },
        { name: t.nav.developments, href: '#desenvolvimentos' },
        { name: t.nav.testimonials, href: '#depoimentos' },
    ], [t.nav.home, t.nav.about, t.nav.developments, t.nav.testimonials])

    // Helper para salvar avatar com persistência
    const saveAvatarUrl = React.useCallback((url: string) => {
        setAvatarUrl(url)
        avatarCache.current = url
        if (typeof window !== 'undefined' && url) {
            localStorage.setItem('user_avatar_cache', url)
        }
    }, [])

    // Monitor user session using singleton
    React.useEffect(() => {
        setIsCheckingAuth(false) // Singleton já está inicializado

        // Subscribe to auth session changes
        const unsubscribe = authSession.subscribe(async (user) => {
            setUser(user)

            // Load avatar and check admin status if user exists
            if (user) {
                // Verificar se tem login Google para priorizar avatar do Google
                const identities = user.identities || []
                const hasGoogleIdentity = identities.some((identity: any) => identity.provider === 'google')
                const googleAvatarUrl = hasGoogleIdentity ? user.user_metadata?.avatar_url : null

                // @ts-ignore - role and is_blocked columns may not be in generated types
                const { data: profile, error: profileError } = await (supabase as any)
                    .from('users')
                    .select('avatar_url, role, is_blocked')
                    .eq('id', user.id)
                    .single()

                // Se usuário foi deletado ou não existe no banco
                if (profileError && profileError.code === 'PGRST116') {
                    await supabase.auth.signOut()
                    setUser(null)
                    setAvatarUrl('')
                    setIsAdmin(false)
                    return
                }

                // Se a coluna não existir (erro 406), ignorar e usar valores padrão
                if (profileError && profileError.code === '406') {
                    console.log('[HeroSection] Columns role/is_blocked not found in users table, using defaults')
                    // Priorizar Google avatar ou usar avatar do banco
                    saveAvatarUrl(googleAvatarUrl || user.user_metadata?.avatar_url || '')
                    setIsAdmin(false)
                    return
                }

                // Se usuário está bloqueado
                if (!profileError && profile?.is_blocked) {
                    await supabase.auth.signOut()
                    setUser(null)
                    saveAvatarUrl('')
                    setIsAdmin(false)
                    return
                }

                if (!profileError && profile) {
                    // Priorizar Google avatar, depois avatar do banco
                    const finalAvatarUrl = googleAvatarUrl || profile.avatar_url || ''
                    saveAvatarUrl(finalAvatarUrl)

                    const isAdminResult = profile.role === 'admin'
                    setIsAdmin(isAdminResult)
                } else {
                    const fallbackUrl = googleAvatarUrl || ''
                    saveAvatarUrl(fallbackUrl)
                    setIsAdmin(false)
                }
            } else {
                saveAvatarUrl('')
                setIsAdmin(false)
            }
        })

        return () => {
            unsubscribe()
        }
    }, [])

    // Reload avatar when user returns to tab
    React.useEffect(() => {
        const reloadAvatar = async () => {
            const user = authSession.getUser()

            if (user) {
                // Sempre garantir que o user está setado primeiro
                setUser(user)

                // Carregar avatar do localStorage primeiro (mais rápido)
                const cachedAvatar = typeof window !== 'undefined'
                    ? localStorage.getItem('user_avatar_cache')
                    : null

                if (cachedAvatar) {
                    setAvatarUrl(cachedAvatar)
                    avatarCache.current = cachedAvatar
                }

                // Verificar se tem login Google para priorizar avatar do Google
                const identities = user.identities || []
                const hasGoogleIdentity = identities.some((identity: any) => identity.provider === 'google')
                const googleAvatarUrl = hasGoogleIdentity ? user.user_metadata?.avatar_url : null

                // Se tem Google avatar, usar e salvar
                if (googleAvatarUrl) {
                    saveAvatarUrl(googleAvatarUrl)
                    return
                }

                // Caso contrário, buscar do banco
                const { data: profile } = await supabase
                    .from('users')
                    .select('avatar_url')
                    .eq('id', user.id)
                    .single()

                if (profile?.avatar_url) {
                    saveAvatarUrl(profile.avatar_url)
                }
            }
        }

        // Listener para quando a aba volta ao foco
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                reloadAvatar()
            }
        }

        const handleFocus = () => {
            reloadAvatar()
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        window.addEventListener('focus', handleFocus)

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            window.removeEventListener('focus', handleFocus)
        }
    }, [])

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)

            // Detectar se estamos sobre uma seção com fundo preto
            const navbarHeight = 80
            const scrollPosition = window.scrollY + navbarHeight

            // Selecionar todas as seções com fundo preto
            const darkSections = document.querySelectorAll('section.bg-black')
            let onDark = false

            darkSections.forEach((section) => {
                const rect = section.getBoundingClientRect()
                const sectionTop = window.scrollY + rect.top
                const sectionBottom = sectionTop + rect.height

                if (scrollPosition >= sectionTop && scrollPosition <= sectionBottom) {
                    onDark = true
                }
            })

            setIsOnDarkSection(onDark)
        }

        handleScroll()
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const handleMouseEnter = React.useCallback((index: number) => {
        const element = menuRefs.current[index]
        if (element) {
            const parent = element.parentElement?.parentElement
            if (parent) {
                const parentRect = parent.getBoundingClientRect()
                const elementRect = element.getBoundingClientRect()
                setHoverStyle({
                    left: elementRect.left - parentRect.left,
                    width: elementRect.width,
                    opacity: 1
                })
            }
        }
        setHoveredIndex(index)
    }, [])

    const handleMouseLeave = React.useCallback(() => {
        setHoverStyle(prev => ({ ...prev, opacity: 0 }))
        setHoveredIndex(null)
    }, [])

    const handleLoginClick = React.useCallback(() => {
        setAuthDialogTab("login")
        setIsAuthDialogOpen(true)
    }, [])

    const handleSignupClick = React.useCallback(() => {
        setAuthDialogTab("signup")
        setIsAuthDialogOpen(true)
    }, [])

    const handleMeetingClick = React.useCallback(async () => {
        // Verificar se usuário está logado
        const isAuthenticated = await checkAuth();

        if (isAuthenticated) {
            // Se logado, redireciona para o formulário
            window.location.href = '/solicitar-reuniao';
        } else {
            // Se não logado, abrir popup de login
            console.log('🔓 [HERO] Usuário não logado - abrindo popup de login');
            setAuthDialogTab("login");
            setIsAuthDialogOpen(true);
        }
    }, [checkAuth])

    const handleLogout = React.useCallback(async () => {
        try {
            setShowUserMenu(false)
            await supabase.auth.signOut()
            setUser(null)
            setAvatarUrl('')
            avatarCache.current = ''

            // Limpar cache do localStorage
            if (typeof window !== 'undefined') {
                localStorage.removeItem('user_avatar_cache')
            }

            // Redirecionar para página inicial
            window.location.href = '/'
        } catch (error) {
            console.error('Erro ao fazer logout:', error)
            // Mesmo com erro, limpa os estados locais
            setUser(null)
            setAvatarUrl('')
            avatarCache.current = ''
            if (typeof window !== 'undefined') {
                localStorage.removeItem('user_avatar_cache')
            }
            window.location.href = '/'
        }
    }, [])

    return (
        <header>
            <AuthDialog
                isOpen={isAuthDialogOpen}
                onClose={() => setIsAuthDialogOpen(false)}
                defaultTab={authDialogTab}
            />
            <nav
                data-state={menuState && 'active'}
                className="fixed z-20 w-full px-2 lg:px-2 group">
                <div className={cn('mx-auto transition-all duration-500 ease-in-out border',
                    // Mobile styles
                    'mt-2 px-4 py-3 rounded-xl max-w-[96%]',
                    // Desktop styles
                    'lg:mt-4 lg:px-12 lg:py-4 lg:rounded-2xl',
                    isScrolled ? (
                        isOnDarkSection
                            ? 'bg-black/90 backdrop-blur-md border-white/20 lg:bg-black/80 lg:backdrop-blur-lg lg:max-w-4xl lg:px-5'
                            : 'bg-background/90 backdrop-blur-md border-border lg:bg-background/50 lg:backdrop-blur-lg lg:max-w-4xl lg:px-5'
                    ) : 'bg-background/60 backdrop-blur-sm border-border/50 lg:max-w-6xl lg:border-transparent lg:bg-transparent lg:backdrop-blur-none')}>
                    <div className="relative flex flex-wrap items-center justify-between gap-3 lg:gap-6 lg:gap-0">
                        <div className="flex w-full justify-between lg:w-auto items-center">
                            <Link
                                href="/"
                                aria-label="home"
                                className="flex items-center space-x-2">
                                <Logo isDark={isOnDarkSection} />
                            </Link>

                            <div className="flex items-center gap-3 lg:hidden">
                                {/* Menu hamburger - agora à esquerda */}
                            <button
                                onClick={() => setMenuState(!menuState)}
                                aria-label={menuState == true ? 'Close Menu' : 'Open Menu'}
                                    className="relative z-20 -ml-2 block cursor-pointer p-2">
                                    <Menu className={cn("in-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-5 duration-200", isOnDarkSection && "text-white")} />
                                    <X className={cn("group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-5 -rotate-180 scale-0 opacity-0 duration-200", isOnDarkSection && "text-white")} />
                                </button>

                                {/* Avatar - agora à direita do menu */}
                                {user && (
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowUserMenu(!showUserMenu)}
                                            className={cn(
                                                "relative flex items-center justify-center w-8 h-8 rounded-full font-semibold text-xs border overflow-hidden transition-all duration-200",
                                                isOnDarkSection
                                                    ? "border-white/40 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/60"
                                                    : "border-black/30 text-black/70 hover:bg-black/5 hover:text-black hover:border-black/50",
                                                !avatarUrl && (isOnDarkSection ? "bg-transparent" : "bg-transparent")
                                            )}
                                        >
                                            {avatarUrl ? (
                                                <Image
                                                    src={avatarUrl}
                                                    alt="Avatar"
                                                    fill
                                                    className="object-cover bg-transparent"
                                                />
                                            ) : (
                                                (() => {
                                                    const name = user.user_metadata?.full_name || user.email || 'U'
                                                    const initials = name
                                                        .split(' ')
                                                        .map((n: string) => n[0])
                                                        .filter(Boolean)
                                                        .slice(0, 2)
                                                        .join('')
                                                        .toUpperCase()
                                                    return initials || 'U'
                                                })()
                                            )}
                                        </button>

                                        {/* Dropdown mobile - abaixo do avatar */}
                                        {showUserMenu && (
                                            <>
                                                {/* Backdrop to close menu */}
                                                <div
                                                    className="fixed inset-0 z-30"
                                                    onClick={() => setShowUserMenu(false)}
                                                />

                                                {/* Dropdown menu */}
                                                <div className={cn(
                                                    "absolute right-0 top-full mt-2 w-[240px] rounded-lg shadow-lg border z-40 overflow-hidden",
                                                    isOnDarkSection
                                                        ? "bg-black/95 border-white/20 backdrop-blur-xl"
                                                        : "bg-white border-gray-200"
                                                )}>
                                                    {/* User info */}
                                                    <div className={cn(
                                                        "px-3 py-2.5 border-b",
                                                        isOnDarkSection ? "border-white/10" : "border-gray-200"
                                                    )}>
                                                        <p className={cn(
                                                            "text-xs font-semibold truncate",
                                                            isOnDarkSection ? "text-white" : "text-gray-900"
                                                        )}>
                                                            {user.user_metadata?.full_name || 'Usuário'}
                                                        </p>
                                                        <p className={cn(
                                                            "text-[11px] truncate mt-0.5",
                                                            isOnDarkSection ? "text-gray-400" : "text-gray-500"
                                                        )}>
                                                            {user.email}
                                                        </p>
                                                    </div>

                                                    {/* Menu items */}
                                                    <div className="py-0.5">
                                                        <button
                                                            onClick={() => {
                                                                setShowUserMenu(false)
                                                                window.location.href = '/perfil'
                                                            }}
                                                            className={cn(
                                                                "w-full px-3 py-2 text-xs flex items-center gap-2 transition-colors",
                                                                isOnDarkSection
                                                                    ? "text-white hover:bg-white/10 active:bg-white/15"
                                                                    : "text-gray-700 hover:bg-gray-100 active:bg-gray-200"
                                                            )}
                                                        >
                                                            <User className="w-3.5 h-3.5" />
                                                            {t.nav.profile}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setShowUserMenu(false)
                                                                window.location.href = '/reunioes-agendadas'
                                                            }}
                                                            className={cn(
                                                                "w-full px-3 py-2 text-xs flex items-center gap-2 transition-colors",
                                                                isOnDarkSection
                                                                    ? "text-white hover:bg-white/10 active:bg-white/15"
                                                                    : "text-gray-700 hover:bg-gray-100 active:bg-gray-200"
                                                            )}
                                                        >
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            {t.nav.meetings}
                                                        </button>
                                                        {isAdmin && (
                                                            <button
                                                                onClick={async () => {
                                                                    try {
                                                                        // Verificação adicional antes de navegar
                                                                        const { data: { session } } = await supabase.auth.getSession()
                                                                        if (!session?.user) {
                                                                            toast.error('Sessão expirada. Faça login novamente.')
                                                                            return
                                                                        }

                                                                        const { data: profile } = await supabase
                                                                            .from('users')
                                                                            .select('role')
                                                                            .eq('id', session.user.id)
                                                                            .single() as { data: { role: string } | null; error: any }

                                                                        if (profile?.role !== 'admin') {
                                                                            toast.error('Acesso negado. Você não tem permissões de administrador.')
                                                                            return
                                                                        }

                                                                        setShowUserMenu(false)
                                                                        window.location.href = '/admin'
                                                                    } catch (error) {
                                                                        console.error('Erro ao verificar permissões:', error)
                                                                        toast.error('Erro ao acessar painel administrativo.')
                                                                    }
                                                                }}
                                                                className={cn(
                                                                    "w-full px-3 py-2 text-xs flex items-center gap-2 transition-colors border-t",
                                                                    isOnDarkSection
                                                                        ? "text-blue-400 hover:bg-blue-500/20 active:bg-blue-500/25 border-white/10"
                                                                        : "text-blue-600 hover:bg-blue-50 active:bg-blue-100 border-gray-200"
                                                                )}
                                                            >
                                                                <Shield className="w-3.5 h-3.5" />
                                                                Painel Admin
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={handleLogout}
                                                            className={cn(
                                                                "w-full px-3 py-2 text-xs flex items-center gap-2 transition-colors",
                                                                isOnDarkSection
                                                                    ? "text-white hover:bg-red-500/20 hover:text-red-400 active:bg-red-500/25"
                                                                    : "text-gray-700 hover:bg-red-50 hover:text-red-600 active:bg-red-100"
                                                            )}
                                                        >
                                                            <LogOut className="w-3.5 h-3.5" />
                                                            {t.nav.logout}
                            </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="absolute inset-0 m-auto hidden size-fit lg:flex items-center">
                            <ul className="flex gap-2 items-center relative" onMouseLeave={handleMouseLeave}>
                                <span
                                    className={cn(
                                        "absolute rounded-lg transition-all duration-300 ease-out pointer-events-none",
                                        isOnDarkSection ? "bg-white/10" : "bg-muted"
                                    )}
                                    style={{
                                        left: `${hoverStyle.left}px`,
                                        width: `${hoverStyle.width}px`,
                                        height: '100%',
                                        opacity: hoverStyle.opacity,
                                        top: 0,
                                    }}
                                />
                                {menuItems.map((item, index) => (
                                    <li key={index}>
                                        <Link
                                            ref={(el) => {
                                                menuRefs.current[index] = el
                                            }}
                                            href={item.href}
                                            onMouseEnter={() => handleMouseEnter(index)}
                                            className={cn(
                                                "block duration-150 px-3 py-2 rounded-lg relative z-10 text-sm font-medium",
                                                isOnDarkSection
                                                    ? "text-white/80 hover:text-white"
                                                    : "text-muted-foreground hover:text-accent-foreground"
                                            )}>
                                            <span>{item.name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className={cn(
                            "group-data-[state=active]:block lg:group-data-[state=active]:flex mb-4 hidden w-full flex-wrap items-center justify-end space-y-6 rounded-2xl border p-5 shadow-2xl md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent",
                            isOnDarkSection
                                ? "bg-black/90 backdrop-blur-md border-white/20 shadow-black/40"
                                : "bg-background shadow-zinc-300/20"
                        )}>
                            <div className="lg:hidden w-full">
                                <ul className="space-y-2 w-full">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <Link
                                                href={item.href}
                                                onClick={() => setMenuState(false)}
                                                className={cn(
                                                    "block duration-150 px-4 py-2.5 rounded-lg transition-colors text-sm font-semibold",
                                                    isOnDarkSection
                                                        ? "text-white hover:text-white hover:bg-white/10 active:bg-white/15"
                                                        : "text-foreground hover:text-foreground hover:bg-muted active:bg-muted/80"
                                                )}>
                                                <span>{item.name}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex w-full flex-col space-y-2.5 sm:flex-row sm:gap-2.5 sm:space-y-0 md:w-fit items-center">
                                {isCheckingAuth ? (
                                    // Checking auth - show placeholder to prevent layout shift
                                    <div className="hidden lg:flex gap-2.5">
                                        <div className="w-[88px] h-11 opacity-0" />
                                        <div className="w-[120px] h-11 opacity-0" />
                                    </div>
                                ) : user ? (
                                    // User logged in - show avatar with dropdown (desktop only)
                                    <div className="relative w-full sm:w-auto hidden lg:flex justify-center sm:justify-start">
                                        <button
                                            onClick={() => setShowUserMenu(!showUserMenu)}
                                            className={cn(
                                                "flex items-center gap-1 transition-all duration-300 cursor-pointer",
                                                isOnDarkSection
                                                    ? "text-white/70 hover:text-white"
                                                    : "text-black/70 hover:text-black"
                                            )}
                                        >
                                            <div className={cn(
                                                "relative flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm border overflow-hidden transition-colors",
                                                isOnDarkSection
                                                    ? "border-white/40 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/60"
                                                    : "border-black/30 text-black/70 hover:bg-black/5 hover:text-black hover:border-black/50",
                                                !avatarUrl && (isOnDarkSection ? "bg-transparent" : "bg-transparent")
                                            )}>
                                                {avatarUrl ? (
                                                    <Image
                                                        src={avatarUrl}
                                                        alt="Avatar"
                                                        fill
                                                        className="object-cover bg-transparent"
                                                    />
                                                ) : (
                                                    (() => {
                                                        const name = user.user_metadata?.full_name || user.email || 'U'
                                                        const initials = name
                                                            .split(' ')
                                                            .map((n: string) => n[0])
                                                            .filter(Boolean)
                                                            .slice(0, 2)
                                                            .join('')
                                                            .toUpperCase()
                                                        return initials || 'U'
                                                    })()
                                                )}
                                            </div>
                                            <ChevronDown className={cn(
                                                "w-4 h-4 transition-transform duration-200 flex-shrink-0",
                                                showUserMenu && "rotate-180"
                                            )} />
                                        </button>

                                        {showUserMenu && (
                                            <>
                                                {/* Backdrop to close menu */}
                                                <div
                                                    className="fixed inset-0 z-30"
                                                    onClick={() => setShowUserMenu(false)}
                                                />

                                                {/* Dropdown menu - Desktop: abaixo do avatar */}
                                                <div className={cn(
                                                    "absolute right-0 top-full mt-2 w-64 rounded-xl shadow-lg border z-40 overflow-hidden",
                                                    isOnDarkSection
                                                        ? "bg-black/95 border-white/20 backdrop-blur-xl"
                                                        : "bg-white border-gray-200"
                                                )}>
                                                    {/* User info */}
                                                    <div className={cn(
                                                        "px-4 py-3 border-b",
                                                        isOnDarkSection ? "border-white/10" : "border-gray-200"
                                                    )}>
                                                        <p className={cn(
                                                            "text-sm font-semibold truncate",
                                                            isOnDarkSection ? "text-white" : "text-gray-900"
                                                        )}>
                                                            {user.user_metadata?.full_name || 'Usuário'}
                                                        </p>
                                                        <p className={cn(
                                                            "text-xs truncate mt-1",
                                                            isOnDarkSection ? "text-gray-400" : "text-gray-500"
                                                        )}>
                                                            {user.email}
                                                        </p>
                                                    </div>

                                                    {/* Menu items */}
                                                    <div className="py-1">
                                                        <button
                                                            onClick={() => {
                                                                setShowUserMenu(false)
                                                                window.location.href = '/perfil'
                                                            }}
                                                            className={cn(
                                                                "w-full px-4 py-2 text-sm flex items-center gap-2 transition-colors",
                                                                isOnDarkSection
                                                                    ? "text-white hover:bg-white/10"
                                                                    : "text-gray-700 hover:bg-gray-100"
                                                            )}
                                                        >
                                                            <User className="w-4 h-4" />
                                                            {t.nav.profile}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setShowUserMenu(false)
                                                                window.location.href = '/reunioes-agendadas'
                                                            }}
                                                            className={cn(
                                                                "w-full px-4 py-2 text-sm flex items-center gap-2 transition-colors",
                                                                isOnDarkSection
                                                                    ? "text-white hover:bg-white/10"
                                                                    : "text-gray-700 hover:bg-gray-100"
                                                            )}
                                                        >
                                                            <Calendar className="w-4 h-4" />
                                                            {t.nav.meetings}
                                                        </button>
                                                        {isAdmin && (
                                                            <button
                                                                onClick={() => {
                                                                    setShowUserMenu(false)
                                                                    window.location.href = '/admin'
                                                                }}
                                                                className={cn(
                                                                    "w-full px-4 py-2 text-sm flex items-center gap-2 transition-colors border-t",
                                                                    isOnDarkSection
                                                                        ? "text-blue-400 hover:bg-blue-500/20 border-white/10"
                                                                        : "text-blue-600 hover:bg-blue-50 border-gray-200"
                                                                )}
                                                            >
                                                                <Shield className="w-4 h-4" />
                                                                Painel Admin
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={handleLogout}
                                                            className={cn(
                                                                "w-full px-4 py-2 text-sm flex items-center gap-2 transition-colors",
                                                                isOnDarkSection
                                                                    ? "text-white hover:bg-red-500/20 hover:text-red-400"
                                                                    : "text-gray-700 hover:bg-red-50 hover:text-red-600"
                                                            )}
                                                        >
                                                            <LogOut className="w-4 h-4" />
                                                            {t.nav.logout}
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    // User not logged in - show login/signup buttons
                                    <>
                                        <Button
                                            onClick={handleLoginClick}
                                            variant="outline"
                                            size="default"
                                            className={cn(
                                                'transition-all duration-300 cursor-pointer text-xs h-9 px-4 lg:text-sm lg:h-11 lg:px-6 w-full sm:w-auto',
                                                isScrolled && 'lg:hidden lg:w-0 lg:opacity-0 lg:pointer-events-none',
                                                isOnDarkSection && 'border-white/20 bg-white text-black hover:bg-white/90 active:bg-white/80'
                                            )}>
                                            <span>{t.nav.login}</span>
                                        </Button>
                                        <Button
                                            onClick={isScrolled ? handleMeetingClick : handleSignupClick}
                                            size="default"
                                            className={cn(
                                                'transition-all duration-300 cursor-pointer text-xs h-9 px-4 lg:text-sm lg:h-11 lg:px-6 w-full sm:w-auto',
                                                isOnDarkSection
                                                    ? 'bg-white text-black hover:bg-white/90 active:bg-white/80'
                                                    : 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80'
                                            )}>
                                            <span>{isScrolled ? t.hero.ctaSchedule : t.nav.signup}</span>
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}

const Logo = React.memo(({ className, isDark }: { className?: string; isDark?: boolean }) => {
    return (
        <Image
            src={isDark ? "/logo-white.png" : "/logo.png"}
            alt="Elion Softwares"
            width={150}
            height={46}
            className={cn('h-5 w-auto transition-none', className)}
            priority
        />
    )
})




