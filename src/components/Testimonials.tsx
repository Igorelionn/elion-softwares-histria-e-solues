"use client"

import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Star } from "lucide-react"
import { motion } from "framer-motion"

export default function Testimonials() {
  const testimonials = [
    {
      quote: "Elion Softwares delivered a platform that exceeded every expectation. Their technical expertise and unwavering commitment to excellence transformed our entire operation. The ROI has been exceptional.",
      author: "Michael Chen",
      role: "Chief Technology Officer",
      company: "Vertex Financial Group",
      initials: "MC",
      rating: 5
    },
    {
      quote: "Working with Elion was a game-changer. They didn't just build software—they became strategic partners in our digital transformation. Their attention to security and scalability is unmatched.",
      author: "Sarah Martinez",
      role: "VP of Digital Innovation",
      company: "HealthTech Solutions",
      initials: "SM",
      rating: 5
    },
    {
      quote: "In 15 years of leading technology initiatives, I've never encountered a team more dedicated to excellence. Elion's work directly contributed to a 40% increase in our operational efficiency.",
      author: "David Thompson",
      role: "Chief Operations Officer",
      company: "Global Logistics Corp",
      initials: "DT",
      rating: 5
    },
    {
      quote: "The level of professionalism and technical sophistication Elion brings is remarkable. They delivered a mission-critical system on time, on budget, and with zero compromises on quality.",
      author: "Emily Rodriguez",
      role: "Head of Engineering",
      company: "Titan Enterprise Systems",
      initials: "ER",
      rating: 5
    }
  ]

  const clients = [
    "Vertex Financial",
    "HealthTech Solutions",
    "Global Logistics",
    "Titan Enterprise",
    "Nexus Capital",
    "Zenith Systems"
  ]

  return (
    <section id="testimonials" className="py-24 md:py-32 bg-secondary/30">
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
            Client Testimonials
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Trusted by Industry
            <span className="block mt-2">Leaders Worldwide</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Don't just take our word for it. Here's what our clients say about partnering with Elion Softwares.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="p-8 h-full hover:shadow-lg transition-shadow">
                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-lg leading-relaxed mb-6 text-foreground/90">
                  "{testimonial.quote}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-4 pt-6 border-t border-border">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-foreground">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </div>
                    <div className="text-sm font-medium text-primary">
                      {testimonial.company}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Client Logos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-sm text-muted-foreground mb-8 uppercase tracking-wider font-medium">
            Trusted by Leading Organizations
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
            {clients.map((client, index) => (
              <div
                key={index}
                className="flex items-center justify-center h-16 px-4 text-muted-foreground/60 hover:text-foreground transition-colors font-semibold text-sm"
              >
                {client}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Stats Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-12">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-5xl font-bold mb-2">98%</div>
                <div className="text-primary-foreground/80">Client Retention Rate</div>
              </div>
              <div>
                <div className="text-5xl font-bold mb-2">4.9/5</div>
                <div className="text-primary-foreground/80">Average Client Rating</div>
              </div>
              <div>
                <div className="text-5xl font-bold mb-2">250+</div>
                <div className="text-primary-foreground/80">5-Star Reviews</div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}