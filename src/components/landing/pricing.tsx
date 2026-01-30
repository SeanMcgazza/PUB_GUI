'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const plans = [
  {
    name: 'Free',
    price: '€0',
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      'Up to 50 bookings/month',
      'Basic calendar',
      'Client management',
      'Online booking page',
      'Email reminders',
    ],
    cta: 'Start Free',
    popular: false,
  },
  {
    name: 'Pro',
    price: '€29',
    period: '/month',
    description: 'For busy stylists who want it all',
    features: [
      'Unlimited bookings',
      'Advanced calendar views',
      'Hair formula tracking',
      'SMS reminders',
      'Business analytics',
      'Custom branding',
      'Priority support',
      'Client notes & history',
    ],
    cta: 'Start 14-Day Trial',
    popular: true,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-32 bg-cream">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-warm-brown mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            No hidden fees. No commission. No surprises. Just straightforward pricing 
            that lets you keep more of what you earn.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={cn(
                'h-full shadow-soft hover:shadow-soft-lg transition-all relative overflow-hidden',
                plan.popular && 'border-gold border-2'
              )}>
                {plan.popular && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-gold text-white text-xs font-medium px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl text-warm-brown">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-warm-brown">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-muted-foreground mt-2">{plan.description}</p>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-sage/20 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-sage" />
                        </div>
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link href="/app">
                    <Button 
                      className={cn(
                        'w-full btn-pill',
                        plan.popular 
                          ? 'bg-gold hover:bg-gold-dark text-white' 
                          : 'bg-muted hover:bg-muted/80 text-warm-brown'
                      )}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-muted-foreground mt-8"
        >
          All plans include a 14-day free trial. No credit card required.
        </motion.p>
      </div>
    </section>
  );
}
