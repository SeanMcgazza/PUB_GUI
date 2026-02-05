'use client';

import Link from 'next/link';
import { Scissors, Mail, Instagram, Facebook, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-warm-brown text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-gold rounded-xl">
                <Scissors className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-xl">ChairTime</span>
            </Link>
            <p className="text-white/70 text-sm">
              The booking system built for independent stylists. 
              No commission, no contracts, just simple salon management.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-white/70">
              <li><Link href="#features" className="hover:text-gold transition-colors">Features</Link></li>
              <li><Link href="#pricing" className="hover:text-gold transition-colors">Pricing</Link></li>
              <li><Link href="#faq" className="hover:text-gold transition-colors">FAQ</Link></li>
              <li><Link href="/blog" className="hover:text-gold transition-colors">Blog</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-white/70">
              <li><Link href="/about" className="hover:text-gold transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-gold transition-colors">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-gold transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-gold transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Get in Touch</h4>
            <div className="flex items-center gap-2 text-white/70 mb-4">
              <Mail className="w-4 h-4" />
              <a href="mailto:hello@chairtime.ie" className="hover:text-gold transition-colors">
                hello@chairtime.ie
              </a>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="text-white/70 hover:text-gold transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/70 hover:text-gold transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/70 hover:text-gold transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/50 text-sm">
            © {new Date().getFullYear()} ChairTime. Made with ❤️ in Ireland.
          </p>
          <p className="text-white/50 text-sm">
            Built for stylists, by people who get it.
          </p>
        </div>
      </div>
    </footer>
  );
}
