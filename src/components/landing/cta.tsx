'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight, Scissors } from 'lucide-react';
import Link from 'next/link';

export function CTA() {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-br from-gold/10 via-lavender/10 to-cream">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="w-20 h-20 bg-gold rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-soft-lg">
            <Scissors className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-warm-brown mb-4">
            Ready to Fill Your Chair?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join hundreds of independent stylists who&apos;ve taken control of their bookings. 
            Start free, upgrade when you&apos;re ready.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/app">
              <Button size="lg" className="btn-pill bg-gold hover:bg-gold-dark text-white px-8 text-lg h-14">
                Start Your Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
          
          <p className="text-sm text-muted-foreground mt-6">
            No credit card required • Set up in 5 minutes • Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
}
