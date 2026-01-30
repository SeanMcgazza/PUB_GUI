'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, Users, Sparkles } from 'lucide-react';
import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-20 left-0 w-72 h-72 bg-lavender/20 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold/10 rounded-full blur-3xl -z-10" />
      
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-lavender/20 text-lavender px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Built for independent stylists
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-warm-brown leading-tight mb-6">
              Fill Your Chair.{' '}
              <span className="text-gold">Keep Your Clients.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              The booking system that puts you in control. No commission fees, no long contracts, 
              just simple salon management that works the way you do.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/app">
                <Button size="lg" className="btn-pill bg-gold hover:bg-gold-dark text-white px-8 text-lg h-14">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="btn-pill px-8 text-lg h-14">
                  See How It Works
                </Button>
              </Link>
            </div>
          </motion.div>
          
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-3 gap-4 md:gap-8 mt-16 max-w-lg mx-auto"
          >
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-gold">0%</p>
              <p className="text-sm text-muted-foreground">Commission fees</p>
            </div>
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-gold">24/7</p>
              <p className="text-sm text-muted-foreground">Online booking</p>
            </div>
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-gold">5 min</p>
              <p className="text-sm text-muted-foreground">Setup time</p>
            </div>
          </motion.div>
        </div>
        
        {/* Hero image placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 max-w-5xl mx-auto"
        >
          <div className="relative rounded-2xl overflow-hidden shadow-soft-lg bg-white p-4">
            <div className="aspect-video bg-gradient-to-br from-cream to-lavender/20 rounded-xl flex items-center justify-center">
              <div className="grid grid-cols-3 gap-4 p-8 w-full max-w-2xl">
                <div className="bg-white rounded-xl p-4 shadow-soft">
                  <Calendar className="w-8 h-8 text-gold mb-2" />
                  <p className="font-medium">Today&apos;s Appointments</p>
                  <p className="text-2xl font-bold text-gold">8</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-soft">
                  <Users className="w-8 h-8 text-lavender mb-2" />
                  <p className="font-medium">Active Clients</p>
                  <p className="text-2xl font-bold text-lavender">124</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-soft">
                  <Sparkles className="w-8 h-8 text-sage mb-2" />
                  <p className="font-medium">This Week</p>
                  <p className="text-2xl font-bold text-sage">€1,240</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
