'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { motion } from 'framer-motion';

const faqs = [
  {
    question: 'Is ChairTime really free?',
    answer: 'Yes! Our Free plan is genuinely free forever — no hidden fees, no commissions, no credit card required. You can manage up to 50 bookings per month at no cost. For unlimited bookings and advanced features, our Pro plan is €29/month.',
  },
  {
    question: 'How is this different from Fresha?',
    answer: 'Fresha charges up to 20% commission on new client bookings made through their marketplace. ChairTime charges 0% commission — ever. We believe you should keep what you earn. We\'re also built specifically for independent stylists, not as a client discovery platform.',
  },
  {
    question: 'Can I import my existing clients?',
    answer: 'Absolutely! You can import clients from a CSV file, or add them manually. We also provide tools to help you migrate from other booking systems.',
  },
  {
    question: 'Do my clients need to create an account?',
    answer: 'No! Your clients can book without creating an account. They simply enter their details and choose a time. Quick and easy — the way booking should be.',
  },
  {
    question: 'What happens to my data if I cancel?',
    answer: 'Your data is yours. If you ever decide to leave, you can export all your client data, booking history, and notes. We believe in data portability.',
  },
  {
    question: 'Is there a contract or minimum term?',
    answer: 'No contracts, ever. You can cancel your Pro subscription at any time, and you\'ll keep access until the end of your billing period. The Free plan requires no commitment at all.',
  },
  {
    question: 'Does ChairTime work on mobile?',
    answer: 'Yes! ChairTime is fully responsive and works beautifully on phones and tablets. Manage your bookings between clients, on the go, or from your salon chair.',
  },
  {
    question: 'Can I customise my booking page?',
    answer: 'On the Pro plan, you can add your logo, choose your colours, and create a booking experience that matches your brand. Free users get a clean, professional booking page with ChairTime branding.',
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20 md:py-32 bg-cream">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-warm-brown mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Got questions? We&apos;ve got answers. If you can&apos;t find what you&apos;re looking for, 
            drop us a message.
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-white rounded-xl px-6 shadow-soft border-none"
              >
                <AccordionTrigger className="text-left font-medium text-warm-brown hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
