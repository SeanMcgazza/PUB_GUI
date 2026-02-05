'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Scissors, X } from 'lucide-react';
import { motion } from 'framer-motion';

const navLinks = [
  { href: '/#features', label: 'Features' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/blog', label: 'Blog' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-cream/80 backdrop-blur-lg border-b border-border"
    >
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="p-2 bg-gold rounded-xl">
            <Scissors className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-xl text-warm-brown">ChairTime</span>
        </Link>
        
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-gold transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
        
        <div className="hidden md:flex items-center gap-3">
          <Link href="/app">
            <Button variant="ghost" className="text-warm-brown">
              Log in
            </Button>
          </Link>
          <Link href="/app">
            <Button className="btn-pill bg-gold hover:bg-gold-dark text-white">
              Start Free
            </Button>
          </Link>
        </div>
        
        {/* Mobile Nav */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-80 bg-cream">
            <div className="flex flex-col gap-6 mt-8">
              {navLinks.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-lg font-medium text-warm-brown hover:text-gold transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-3 mt-4">
                <Link href="/app" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Log in
                  </Button>
                </Link>
                <Link href="/app" onClick={() => setIsOpen(false)}>
                  <Button className="w-full bg-gold hover:bg-gold-dark text-white">
                    Start Free
                  </Button>
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </motion.header>
  );
}
