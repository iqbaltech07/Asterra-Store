'use client';

import React from 'react';
import { Input } from '@/components/ui/input';

interface CheckoutCustomerFormProps {
  customerName: string;
  onCustomerNameChange: (val: string) => void;
  targetEmail: string;
  onTargetEmailChange: (val: string) => void;
  phoneNumber: string;
  onPhoneNumberChange: (val: string) => void;
  customerNotes: string;
  onCustomerNotesChange: (val: string) => void;
}

export function CheckoutCustomerForm({
  customerName,
  onCustomerNameChange,
  targetEmail,
  onTargetEmailChange,
  phoneNumber,
  onPhoneNumberChange,
  customerNotes,
  onCustomerNotesChange,
}: CheckoutCustomerFormProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2.5 pb-3 border-b border-border">
        <div className="w-6 h-6 rounded-md bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
          1
        </div>
        <h2 className="text-base font-bold text-foreground">Informasi Akun Tujuan Lisensi</h2>
      </div>

      <div className="space-y-4 pt-1">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span>Nama Lengkap Customer / Pemesan *</span>
            <span className="text-[11px] text-foreground-muted font-normal">Identitas validasi admin</span>
          </label>
          <Input
            type="text"
            required
            placeholder="contoh: Budi Santoso"
            value={customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            className="bg-surface-raised border-border text-xs sm:text-sm font-medium"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span>Email Tujuan Aktivasi / Akun *</span>
            <span className="text-[11px] text-foreground-muted font-normal">Kredensial dikirim ke email ini</span>
          </label>
          <Input
            type="email"
            required
            placeholder="contoh: akun_anda@gmail.com"
            value={targetEmail}
            onChange={(e) => onTargetEmailChange(e.target.value)}
            className="bg-surface-raised border-border text-xs sm:text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span>Nomor WhatsApp / Kontak (Opsional)</span>
            <span className="text-[11px] text-foreground-muted font-normal">Notifikasi status instan</span>
          </label>
          <Input
            type="tel"
            placeholder="contoh: 081234567890"
            value={phoneNumber}
            onChange={(e) => onPhoneNumberChange(e.target.value)}
            className="bg-surface-raised border-border text-xs sm:text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Catatan Khusus Pesanan (Opsional)
          </label>
          <Input
            type="text"
            placeholder="contoh: Mohon konfirmasi akun via WhatsApp juga..."
            value={customerNotes}
            onChange={(e) => onCustomerNotesChange(e.target.value)}
            className="bg-surface-raised border-border text-xs sm:text-sm"
          />
        </div>
      </div>
    </div>
  );
}
