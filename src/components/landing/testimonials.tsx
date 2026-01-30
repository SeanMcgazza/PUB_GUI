'use client';

import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah Kelly',
    role: 'Owner, Sarah\'s Hair Studio',
    location: 'Dublin',
    quote: 'I was paying Fresha nearly €300/month in commissions. With ChairTime, I keep every cent. The client formula tracking is a game-changer for my colour work.',
    avatar: 'SK',
    rating: 5,
  },
  {
    name: 'Aoife Brennan',
    role: 'Independent Stylist',
    location: 'Cork',
    quote: 'Finally, a booking system that doesn\'t treat me like a number. My clients love how easy it is to book, and I love not worrying about fees eating into my earnings.',
    avatar: 'AB',
    rating: 5,
  },
  {
    name: 'Emma Quinn',
    role: 'Mobile Hairdresser',
    location: 'Galway',
    quote: 'As a mobile stylist, I needed something simple that works on my phone. ChairTime is perfect — I can manage everything between appointments.',
    avatar: 'EQ',
    rating: 5,
  },
];

export function Testimonials() {
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
            Loved by Stylists Across Ireland
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join hundreds of independent stylists who&apos;ve made the switch to commission-free booking.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full shadow-soft hover:shadow-soft-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-soft-gold text-soft-gold" />
                    ))}
                  </div>
                  
                  <p className="text-muted-foreground mb-6 italic">
                    &quot;{testimonial.quote}&quot;
                  </p>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-lavender/20 flex items-center justify-center font-semibold text-lavender">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-warm-brown">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
