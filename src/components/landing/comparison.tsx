'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

const comparisons = [
  {
    feature: 'Commission on bookings',
    chairtime: 'No fees ever',
    fresha: '20% on new clients',
    phorest: 'Varies by plan',
  },
  {
    feature: 'Monthly cost',
    chairtime: 'Free or €29/month',
    fresha: '"Free" + commissions',
    phorest: '€100+/month',
  },
  {
    feature: 'Contract lock-in',
    chairtime: 'Cancel anytime',
    fresha: 'Cancel anytime',
    phorest: '12-24 month contracts',
  },
  {
    feature: 'Client data ownership',
    chairtime: '100% yours',
    fresha: 'Shared platform',
    phorest: '100% yours',
  },
  {
    feature: 'Setup time',
    chairtime: '5 minutes',
    fresha: '15-30 minutes',
    phorest: 'Days/weeks',
  },
  {
    feature: 'Best for',
    chairtime: 'Independent stylists',
    fresha: 'Discovery & marketing',
    phorest: 'Large salons',
  },
];

export function Comparison() {
  return (
    <section className="py-20 md:py-32 bg-cream">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-warm-brown mb-4">
            Why Stylists Choose ChairTime
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We believe you shouldn&apos;t pay a percentage of your hard-earned money 
            just to manage your bookings. Here&apos;s how we compare.
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-medium text-muted-foreground"></th>
                  <th className="text-center py-4 px-4">
                    <div className="inline-flex items-center gap-2 bg-gold/10 text-gold px-4 py-2 rounded-full font-semibold">
                      ChairTime
                    </div>
                  </th>
                  <th className="text-center py-4 px-4 font-medium text-muted-foreground">Fresha</th>
                  <th className="text-center py-4 px-4 font-medium text-muted-foreground">Phorest</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((row) => (
                  <tr key={row.feature} className="border-b border-border/50">
                    <td className="py-4 px-4 font-medium text-warm-brown">{row.feature}</td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-gold font-medium">{row.chairtime}</span>
                    </td>
                    <td className="py-4 px-4 text-center text-muted-foreground">{row.fresha}</td>
                    <td className="py-4 px-4 text-center text-muted-foreground">{row.phorest}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
