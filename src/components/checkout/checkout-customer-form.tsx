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
    <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-6 space-y-5 shadow-card">
      <div className="flex items-center gap-3 pb-3 border-b border-[rgba(18,26,42,0.08)]">
        <div className="w-7 h-7 rounded-lg bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.25)] text-[#C96F55] flex items-center justify-center text-xs font-bold shadow-xs">
          1
        </div>
        <h2 className="text-base font-bold text-[#121A2A]">Informasi Akun Tujuan Lisensi</h2>
      </div>

      <div className="space-y-4 pt-1">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#121A2A] flex items-center justify-between">
            <span>Nama Lengkap Customer / Pemesan *</span>
            <span className="text-[11px] text-[#121A2A]/50 font-normal">Identitas validasi admin</span>
          </label>
          <Input
            type="text"
            required
            placeholder="contoh: Budi Santoso"
            value={customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            className="bg-white border-[rgba(18,26,42,0.12)] text-xs sm:text-sm font-medium rounded-lg text-[#121A2A]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#121A2A] flex items-center justify-between">
            <span>Email Tujuan Aktivasi / Akun *</span>
            <span className="text-[11px] text-[#121A2A]/50 font-normal">Kredensial dikirim ke email ini</span>
          </label>
          <Input
            type="email"
            required
            placeholder="contoh: akun_anda@gmail.com"
            value={targetEmail}
            onChange={(e) => onTargetEmailChange(e.target.value)}
            className="bg-white border-[rgba(18,26,42,0.12)] text-xs sm:text-sm rounded-lg text-[#121A2A]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#121A2A] flex items-center justify-between">
            <span>Nomor WhatsApp / Kontak (Opsional)</span>
            <span className="text-[11px] text-[#121A2A]/50 font-normal">Notifikasi status instan</span>
          </label>
          <Input
            type="tel"
            placeholder="contoh: 081234567890"
            value={phoneNumber}
            onChange={(e) => onPhoneNumberChange(e.target.value)}
            className="bg-white border-[rgba(18,26,42,0.12)] text-xs sm:text-sm rounded-lg text-[#121A2A]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#121A2A]">
            Catatan Khusus Pesanan (Opsional)
          </label>
          <Input
            type="text"
            placeholder="contoh: Mohon konfirmasi akun via WhatsApp juga..."
            value={customerNotes}
            onChange={(e) => onCustomerNotesChange(e.target.value)}
            className="bg-white border-[rgba(18,26,42,0.12)] text-xs sm:text-sm rounded-lg text-[#121A2A]"
          />
        </div>
      </div>
    </div>
  );
}
