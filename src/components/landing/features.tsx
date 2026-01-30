'use client';

import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { 
  Calendar, Users, Clock, Smartphone, 
  Palette, Bell, CreditCard, BarChart 
} from 'lucide-react';

const features = [
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description: 'Intuitive calendar that shows your day at a glance. Drag, drop, and manage appointments effortlessly.',
    color: 'bg-gold/10 text-gold',
  },
  {
    icon: Users,
    title: 'Client Profiles',
    description: 'Store hair formulas, allergies, and preferences. Never forget a client\'s favourite again.',
    color: 'bg-lavender/20 text-lavender',
  },
  {
    icon: Smartphone,
    title: 'Online Booking',
    description: 'Your own branded booking page. Clients book 24/7, you approve when it suits.',
    color: 'bg-sage/20 text-sage',
  },
  {
    icon: Bell,
    title: 'Automatic Reminders',
    description: 'Reduce no-shows by 80% with SMS and email reminders sent automatically.',
    color: 'bg-soft-gold/30 text-amber-700',
  },
  {
    icon: Palette,
    title: 'Hair Formula Tracking',
    description: 'Record colour formulas, processing times, and results. Your clients\' history at your fingertips.',
    color: 'bg-dusty-rose/20 text-dusty-rose',
  },
  {
    icon: BarChart,
    title: 'Business Insights',
    description: 'Track revenue, popular services, and client retention. Make data-driven decisions.',
    color: 'bg-lavender/20 text-lavender',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export function Features() {
  return (
    <section id="features" className="py-20 md:py-32 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-warm-brown mb-4">
              Everything You Need to Run Your Salon
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Simple tools that save you time and help you focus on what you do best — 
              making your clients look and feel amazing.
            </p>
          </motion.div>
        </div>
        
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={item}>
              <Card className="h-full shadow-soft hover:shadow-soft-lg transition-all hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-warm-brown mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
