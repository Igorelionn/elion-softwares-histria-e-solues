'use client';
import React from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Mail, MapPin, Instagram, Facebook, Youtube, Phone } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';

interface FooterLink {
	title: string;
	href: string;
	icon?: React.ComponentType<{ className?: string }>;
}

interface FooterSection {
	label: string;
	links: FooterLink[];
}

export function Footer() {
	const { t } = useTranslation();
	
	const footerLinks: FooterSection[] = [
		{
			label: t.footer.resources,
			links: [
				{ title: t.footer.faqs, href: '/faq' },
				{ title: t.footer.privacy, href: '#' },
				{ title: t.footer.terms, href: '#' },
			],
		},
		{
			label: t.footer.company,
			links: [
				{ title: t.footer.aboutUs, href: '#nosso-legado' },
				{ title: t.nav.developments, href: '#desenvolvimentos' },
				{ title: t.nav.testimonials, href: '#depoimentos' },
				{ title: t.footer.requestMeeting, href: '/solicitar-reuniao' },
			],
		},
		{
			label: t.footer.contact,
			links: [
				{ title: '+55 82 98888-0909', href: 'tel:+5582988880909', icon: Phone },
				{ title: 'oficialelionsoftwares@gmail.com', href: 'mailto:oficialelionsoftwares@gmail.com', icon: Mail },
				{ title: 'Maceió, AL', href: '#', icon: MapPin },
			],
		},
		{
			label: t.footer.social,
			links: [
				{ title: 'Instagram', href: 'https://www.instagram.com/elionsoftwares', icon: Instagram },
				{ title: 'Facebook', href: 'https://www.facebook.com/share/1DFAojYNLg/', icon: Facebook },
				{ title: 'YouTube', href: 'https://www.youtube.com/channel/UCngt5-koheVlwaYmJf4rQPQ', icon: Youtube },
			],
		},
	];
	return (
		<footer className="relative w-full flex flex-col items-center justify-center border-t border-white/10 bg-black px-4 sm:px-6 md:px-16 lg:px-24 pt-12 sm:pt-14 md:pt-16 lg:pt-20 pb-6 sm:pb-8 lg:pb-12 overflow-hidden">
			{/* Iluminação sutil superior */}
			<div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[100px] bg-white/10 rounded-full blur-[80px] pointer-events-none" />

			<div className="w-full relative z-10">
				{/* Logo e descrição */}
				<AnimatedContainer className="space-y-2 sm:space-y-3 md:space-y-4 mb-10 sm:mb-12 md:mb-14 lg:mb-16">
					<div className="flex items-center gap-2">
						<img src="/logo-white.png" alt="Elion Softwares" className="h-5 sm:h-6" />
					</div>
					<p className="text-white/60 mt-4 sm:mt-6 md:mt-8 lg:mt-4 text-xs sm:text-sm max-w-xs leading-relaxed">
						{t.footer.description}
					</p>
					<p className="text-white/40 text-[10px] sm:text-xs pt-1 sm:pt-2">
						© {new Date().getFullYear()} Elion Softwares. {t.footer.rights}
					</p>
				</AnimatedContainer>

				{/* Links em grid abaixo */}
				<div className="grid grid-cols-2 gap-6 sm:gap-7 md:gap-8 md:grid-cols-4">
					{footerLinks.map((section, index) => (
						<AnimatedContainer key={section.label} delay={0.1 + index * 0.1}>
							<div className="min-w-0">
								<h3 className="text-[11px] sm:text-xs font-semibold text-white mb-3 sm:mb-4 uppercase tracking-wide">{section.label}</h3>
								<ul className="text-white/60 space-y-2 sm:space-y-2.5 md:space-y-3 text-xs sm:text-sm">
									{section.links.map((link) => (
										<li key={link.title} className="min-w-0">
											<a
												href={link.href}
												className="hover:text-white inline-flex items-start transition-all duration-300 leading-snug w-full"
											>
												{link.icon && <link.icon className="me-1.5 sm:me-2 size-3 sm:size-4 flex-shrink-0 mt-0.5" />}
												<span className="break-all min-w-0 flex-1" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{link.title}</span>
											</a>
										</li>
									))}
								</ul>
							</div>
						</AnimatedContainer>
					))}
				</div>
			</div>
		</footer>
	);
}

type ViewAnimationProps = {
	delay?: number;
	className?: ComponentProps<typeof motion.div>['className'];
	children: ReactNode;
};

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
	const shouldReduceMotion = useReducedMotion();

	if (shouldReduceMotion) {
		return children;
	}

	return (
		<motion.div
			initial={{ filter: 'blur(4px)', translateY: -8, opacity: 0 }}
			whileInView={{ filter: 'blur(0px)', translateY: 0, opacity: 1 }}
			viewport={{ once: true }}
			transition={{ delay, duration: 0.8 }}
			className={className}
		>
			{children}
		</motion.div>
	);
}



