"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, TrendingUp, Lock, Zap } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"

export default function Projects() {
  const projects = [
    {
      title: "GlobalTrade Platform",
      category: "Financial Services",
      description: "Enterprise-grade trading platform processing $2B+ in daily transactions with 99.99% uptime. Built for a Fortune 100 financial institution.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
      stats: [
        { label: "Daily Transactions", value: "$2B+" },
        { label: "Uptime", value: "99.99%" },
        { label: "Users", value: "500K+" }
      ],
      tags: ["React", "Node.js", "PostgreSQL", "AWS"],
      icon: TrendingUp
    },
    {
      title: "HealthConnect EMR",
      category: "Healthcare Technology",
      description: "HIPAA-compliant electronic medical records system serving 200+ hospitals with AI-powered diagnostics and real-time patient monitoring.",
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
      stats: [
        { label: "Hospitals", value: "200+" },
        { label: "Patient Records", value: "5M+" },
        { label: "Daily Users", value: "50K+" }
      ],
      tags: ["Next.js", "Python", "MongoDB", "Azure"],
      icon: Lock
    },
    {
      title: "LogiFlow Network",
      category: "Supply Chain",
      description: "AI-powered logistics optimization platform reducing delivery times by 40% and operational costs by $50M annually for global enterprise.",
      image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80",
      stats: [
        { label: "Time Saved", value: "40%" },
        { label: "Cost Reduction", value: "$50M/yr" },
        { label: "Routes Optimized", value: "1M+" }
      ],
      tags: ["TypeScript", "GraphQL", "Redis", "GCP"],
      icon: Zap
    }
  ]

  return (
    <section id="projects" className="py-24 md:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Featured Work
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Transformative Solutions
            <span className="block mt-2">That Deliver Results</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            From concept to deployment, we've partnered with industry leaders to build 
            software that drives measurable business impact.
          </p>
        </motion.div>

        {/* Projects Grid */}
        <div className="space-y-12">
          {projects.map((project, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                <div className="grid lg:grid-cols-5 gap-8">
                  {/* Image */}
                  <div className="lg:col-span-2 relative h-64 lg:h-auto">
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-6 left-6">
                      <div className="w-12 h-12 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center">
                        <project.icon className="h-6 w-6 text-foreground" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="lg:col-span-3 p-8 lg:py-12">
                    <Badge variant="secondary" className="mb-4">
                      {project.category}
                    </Badge>
                    
                    <h3 className="text-3xl font-bold mb-4">{project.title}</h3>
                    
                    <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                      {project.description}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-6 mb-6 pb-6 border-b border-border">
                      {project.stats.map((stat, idx) => (
                        <div key={idx}>
                          <div className="text-2xl font-bold text-foreground">
                            {stat.value}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {stat.label}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {project.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 text-xs font-medium bg-secondary text-secondary-foreground rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* CTA */}
                    <Button variant="outline" className="group">
                      View Case Study
                      <ArrowUpRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="text-muted-foreground mb-6">
            Interested in learning more about our work?
          </p>
          <Button size="lg">
            Explore Full Portfolio
          </Button>
        </motion.div>
      </div>
    </section>
  )
}