'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { QrCode, Copy, Check, Download, Share2, ExternalLink } from 'lucide-react';

export function BookingQRCode() {
  const { business } = useStore();
  const [copied, setCopied] = useState(false);
  
  const bookingUrl = `https://chairtime.vercel.app/book/${business.slug}`;
  
  // Generate QR code using a free API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(bookingUrl)}&bgcolor=FFFBF5&color=8B7355`;
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `Book with ${business.name}`,
        text: `Book your appointment at ${business.name}`,
        url: bookingUrl,
      });
    } else {
      handleCopy();
    }
  };
  
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `${business.slug}-booking-qr.png`;
    link.click();
  };
  
  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <QrCode className="w-5 h-5 text-gold" />
          Your Booking Link
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          {/* QR Code */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-cream p-4 rounded-2xl mb-4"
          >
            <img 
              src={qrCodeUrl} 
              alt="Booking QR Code" 
              className="w-48 h-48 rounded-lg"
            />
          </motion.div>
          
          {/* URL Display */}
          <div className="w-full bg-cream rounded-lg p-3 mb-4">
            <p className="text-xs text-muted-foreground mb-1">Booking URL</p>
            <div className="flex items-center gap-2">
              <code className="text-sm text-warm-brown flex-1 truncate">
                {bookingUrl}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-sage" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-2 w-full">
            <Button
              onClick={handleShare}
              className="flex-1 bg-gold hover:bg-gold-dark text-white"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              onClick={handleDownload}
              variant="outline"
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Download QR
            </Button>
          </div>
          
          {/* Open in new tab */}
          <a 
            href={bookingUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-3 text-sm text-muted-foreground hover:text-gold flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            Preview booking page
          </a>
        </div>
        
        {/* Tips */}
        <div className="mt-6 bg-sage/10 rounded-lg p-4">
          <p className="font-medium text-sage text-sm mb-2">💡 Tips</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Print the QR code and display at reception</li>
            <li>• Add the link to your Instagram bio</li>
            <li>• Share via WhatsApp to clients</li>
            <li>• Add to your Google Business profile</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
