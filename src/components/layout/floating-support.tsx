'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Headphones, Mail, MessageCircle, X, ExternalLink } from 'lucide-react';

export function FloatingSupport() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [whatsappNumbers, setWhatsappNumbers] = useState<string[]>(['6281234567890']);
  const [supportEmail, setSupportEmail] = useState('support@asterra.store');
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Do not show on admin pages
  const isAdmin = pathname?.startsWith('/admin');

  // Load configured WhatsApp numbers and email from backend
  useEffect(() => {
    if (isAdmin) return;

    fetch('/api/v1/payment-config')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          if (Array.isArray(json.data.cs_whatsapp_numbers) && json.data.cs_whatsapp_numbers.length > 0) {
            setWhatsappNumbers(json.data.cs_whatsapp_numbers);
          } else if (json.data.confirmation_whatsapp) {
            setWhatsappNumbers([json.data.confirmation_whatsapp]);
          }
          if (json.data.cs_email) {
            setSupportEmail(json.data.cs_email);
          }
        }
      })
      .catch(() => {
        // Fallback to default
      });
  }, [isAdmin]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (isAdmin) return null;

  const mailUrl = `mailto:${supportEmail}?subject=Bantuan%20Asterra%20Store`;

  const formatPhoneNumber = (num: string) => {
    const clean = num.replace(/\D/g, '');
    if (clean.startsWith('62')) {
      return `+62 ${clean.slice(2, 5)}-${clean.slice(5, 9)}-${clean.slice(9)}`;
    }
    if (clean.startsWith('0')) {
      return `0${clean.slice(1, 4)}-${clean.slice(4, 8)}-${clean.slice(8)}`;
    }
    return `+${clean}`;
  };

  return (
    <div
      ref={containerRef}
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Popover Support Card */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 w-72 sm:w-80 bg-surface border border-border rounded-xl shadow-xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <div>
              <h4 className="text-xs font-bold text-foreground">Pusat Bantuan</h4>
              <p className="text-[11px] text-foreground-muted">Hubungi tim customer service kami</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="text-foreground-muted hover:text-foreground p-1 rounded-md transition-colors"
              aria-label="Tutup bantuan"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
            {/* WhatsApp Contact Items */}
            {whatsappNumbers.map((rawNum, idx) => {
              const cleanWa = rawNum.replace(/\D/g, '');
              const waUrl = `https://wa.me/${cleanWa}?text=Halo%20CS%20Asterra%20Store%2C%20saya%20butuh%20bantuan%20layanan.`;
              const label = whatsappNumbers.length > 1 ? `WhatsApp CS ${idx + 1}` : 'WhatsApp CS';

              return (
                <a
                  key={idx}
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-lg bg-surface-raised hover:bg-surface-hover border border-border hover:border-primary/40 transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-status-success/15 text-status-success flex items-center justify-center shrink-0">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold text-foreground block">{label}</span>
                      <span className="text-xs font-mono text-foreground-muted group-hover:text-primary transition-colors block truncate">
                        {formatPhoneNumber(rawNum)}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-foreground-muted group-hover:text-foreground shrink-0 ml-2" />
                </a>
              );
            })}

            {/* Email Contact Item */}
            <a
              href={mailUrl}
              className="flex items-center justify-between p-2.5 rounded-lg bg-surface-raised hover:bg-surface-hover border border-border hover:border-primary/40 transition-all group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold text-foreground block">Email Dukungan</span>
                  <span className="text-xs font-mono text-foreground-muted group-hover:text-primary transition-colors block truncate">
                    {supportEmail}
                  </span>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-foreground-muted group-hover:text-foreground shrink-0 ml-2" />
            </a>
          </div>

          <div className="pt-1 text-[10px] text-foreground-muted text-center">
            Jam Layanan: Setiap Hari 08.00 - 23.00 WIB
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`h-11 w-11 sm:h-12 sm:w-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 border ${
          isOpen
            ? 'bg-primary text-white border-primary shadow-primary/30 rotate-90'
            : 'bg-surface hover:bg-surface-raised text-foreground border-border hover:border-primary/50'
        }`}
        aria-label="Bantuan & Kontak Customer Service"
        title="Bantuan & Kontak CS"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Headphones className="w-5 h-5 text-primary" />}
      </button>
    </div>
  );
}
