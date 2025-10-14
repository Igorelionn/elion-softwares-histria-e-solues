"use client"

import { Card } from "@/components/ui/card"
import { Target, Users, Lightbulb, Award } from "lucide-react"
import { motion } from "framer-motion"

export default function About() {
  const values = [
    {
      icon: Target,
      title: "Precision Engineering",
      description: "Every project is executed with meticulous attention to detail, ensuring flawless performance at scale."
    },
    {
      icon: Users,
      title: "Client Partnership",
      description: "We don't just build software—we forge lasting relationships built on trust, transparency, and shared success."
    },
    {
      icon: Lightbulb,
      title: "Innovation First",
      description: "Staying ahead of technological curves, we leverage cutting-edge solutions to solve tomorrow's challenges today."
    },
    {
      icon: Award,
      title: "Excellence Standard",
      description: "Our commitment to quality is unwavering. We deliver nothing less than exceptional, every single time."
    }
  ]

  return (
    <section id="about" className="py-24 md:py-32 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Story Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              Our Story
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Building Tomorrow's
              <span className="block mt-2">Technology Today</span>
            </h2>
            
            <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
              <p>
                Founded in 2009, Elion Softwares emerged from a singular vision: to bridge the gap 
                between complex business challenges and elegant technological solutions. What began 
                as a small team of passionate engineers has evolved into a globally recognized 
                software development powerhouse.
              </p>
              
              <p>
                Today, we serve Fortune 500 companies, innovative startups, and everything in between. 
                Our portfolio spans financial services, healthcare, logistics, and enterprise SaaS—each 
                project a testament to our ability to deliver transformative results under the most 
                demanding conditions.
              </p>
              
              <p className="font-medium text-foreground">
                At Elion, we don't chase trends. We set them.
              </p>
            </div>
          </motion.div>

          {/* Values Grid */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 gap-6"
          >
            {values.map((value, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <value.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </Card>
            ))}
          </motion.div>
        </div>

        {/* Mission Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-20 text-center max-w-4xl mx-auto"
        >
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-12 border border-primary/20">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">Our Mission</h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
              To empower organizations worldwide with software solutions that don't just meet expectations—they 
              redefine what's possible. We believe that exceptional software is the cornerstone of competitive 
              advantage, and we're dedicated to helping our clients achieve theirs.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}