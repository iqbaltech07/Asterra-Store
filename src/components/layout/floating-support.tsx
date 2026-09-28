'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Headphones, Mail, MessageCircle, X, ExternalLink } from 'lucide-react';

export function FloatingSupport() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('6281234567890');
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Do not show on admin pages
  const isAdmin = pathname?.startsWith('/admin');

  // Load configured WhatsApp number from backend
  useEffect(() => {
    if (isAdmin) return;

    fetch('/api/v1/payment-config')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.confirmation_whatsapp) {
          setWhatsappNumber(json.data.confirmation_whatsapp);
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

  const cleanWa = whatsappNumber.replace(/\D/g, '');
  const formattedWa = cleanWa.startsWith('62')
    ? `+62 ${cleanWa.slice(2, 5)}-${cleanWa.slice(5, 9)}-${cleanWa.slice(9)}`
    : cleanWa.startsWith('0')
    ? `0${cleanWa.slice(1, 4)}-${cleanWa.slice(4, 8)}-${cleanWa.slice(8)}`
    : `+${cleanWa}`;

  const supportEmail = 'support@asterrastore.com';
  const waUrl = `https://wa.me/${cleanWa}?text=Halo%20Admin%20Asterra%20Store%2C%20saya%20butuh%20bantuan%20pesanan.`;
  const mailUrl = `mailto:${supportEmail}?subject=Bantuan%20Asterra%20Store`;

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

          <div className="space-y-2">
            {/* WhatsApp Contact Item */}
            <a
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
                  <span className="text-[11px] font-semibold text-foreground block">WhatsApp CS</span>
                  <span className="text-xs font-mono text-foreground-muted group-hover:text-primary transition-colors block truncate">
                    {formattedWa}
                  </span>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-foreground-muted group-hover:text-foreground shrink-0 ml-2" />
            </a>

            {/* Email Contact Item */}
            <a
              href={mailUrl}
              className="flex items-center justify-between p-2.5 rounded-lg bg-surface-raised hover:bg-surface-hover border border-border hover:border-primary/40 transition-all group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold text-foreground block">Email Support</span>
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
