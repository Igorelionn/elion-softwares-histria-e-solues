import dynamic from 'next/dynamic'
import { HeroSection } from '@/components/ui/hero-section-1'

// Lazy load seções abaixo do fold para melhor performance
const AboutSection = dynamic(() => import('@/components/ui/about-section').then(mod => ({ default: mod.AboutSection })), {
  loading: () => <div className="min-h-screen" />
})

const DevelopmentsSection = dynamic(() => import('@/components/ui/developments-section').then(mod => ({ default: mod.DevelopmentsSection })), {
  loading: () => <div className="min-h-screen bg-black" />
})

const TestimonialsSection = dynamic(() => import('@/components/ui/testimonials-section').then(mod => ({ default: mod.TestimonialsSection })), {
  loading: () => <div className="min-h-screen bg-black" />
})

const ScheduleSection = dynamic(() => import('@/components/ui/schedule-section').then(mod => ({ default: mod.ScheduleSection })), {
  loading: () => <div className="min-h-screen bg-black" />
})

const Footer = dynamic(() => import('@/components/ui/footer-section').then(mod => ({ default: mod.Footer })), {
  loading: () => <div className="py-12 bg-black" />
})

export default function Home() {
  return (
    <div className="relative min-h-screen" style={{ position: 'relative' }}>
      <HeroSection />
      <AboutSection />
      <DevelopmentsSection />
      <TestimonialsSection />
      <ScheduleSection />
      <Footer />
    </div>
  )
}