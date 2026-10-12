import React from 'react';
import { ChannelType } from '@/lib/contact-channels';
import { Phone, MessageCircle, Send, Instagram } from 'lucide-react';

interface ChannelIconProps {
  type: ChannelType;
  className?: string;
}

export function ChannelIcon({ type, className = 'w-4 h-4' }: ChannelIconProps) {
  switch (type) {
    case 'PHONE':
      return <Phone className={className} />;
    case 'WHATSAPP':
      return <MessageCircle className={className} />;
    case 'TELEGRAM':
      return <Send className={className} />;
    case 'INSTAGRAM':
      return <Instagram className={className} />;
    case 'EITAA':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-2h2v2zm0-4h-2V7h2v5.5z" />
        </svg>
      );
    case 'BALE':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.07L2.1 21.9l4.98-1.25C8.5 21.52 10.19 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5zm4 4h-2v-2h2v2zm0-4h-2V7h2v5z" />
        </svg>
      );
    case 'RUBIKA':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.2l6.8 3.8-6.8 3.8-6.8-3.8L12 4.2zm-7 5.2l6 3.3v6.7l-6-3.3V9.4zm14 6.7l-6 3.3v-6.7l6-3.3v6.7z" />
        </svg>
      );
    default:
      return <Phone className={className} />;
  }
}
