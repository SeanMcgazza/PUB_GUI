'use client';

import { motion } from 'framer-motion';
import { UserPlus, Settings, Rocket } from 'lucide-react';

const steps = [
  {
    number: '1',
    icon: UserPlus,
    title: 'Create Your Account',
    description: 'Sign up in seconds. No credit card required for the free plan.',
    color: 'bg-gold',
  },
  {
    number: '2',
    icon: Settings,
    title: 'Set Up Your Services',
    description: 'Add your services, prices, and availability. Import clients or start fresh.',
    color: 'bg-lavender',
  },
  {
    number: '3',
    icon: Rocket,
    title: 'Share Your Booking Link',
    description: 'Send your unique booking page to clients. They book, you approve.',
    color: 'bg-sage',
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 md:py-32 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-warm-brown mb-4">
            Up and Running in Minutes
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Getting started is simple. Most stylists are fully set up in under 5 minutes.
          </p>
        </motion.div>
        
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative text-center"
              >
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-border to-transparent" />
                )}
                
                <div className={`w-24 h-24 ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-soft`}>
                  <step.icon className="w-10 h-10 text-white" />
                </div>
                
                <span className="inline-block bg-muted px-3 py-1 rounded-full text-sm font-medium text-muted-foreground mb-3">
                  Step {step.number}
                </span>
                
                <h3 className="text-xl font-semibold text-warm-brown mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
