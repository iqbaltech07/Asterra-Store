'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { TargetRequirement } from '@/lib/target-field-utils';

interface CheckoutCustomerFormProps {
  customerName: string;
  onCustomerNameChange: (val: string) => void;
  // Contact & Invoice Email
  customerEmail?: string;
  onCustomerEmailChange?: (val: string) => void;
  // Dynamic Target Field (Phone, Game ID, Customer ID, or Email)
  targetValue: string;
  onTargetValueChange: (val: string) => void;
  targetZone?: string;
  onTargetZoneChange?: (val: string) => void;
  // Backwards compatibility alias
  targetEmail?: string;
  onTargetEmailChange?: (val: string) => void;
  // WhatsApp Notification Contact
  phoneNumber: string;
  onPhoneNumberChange: (val: string) => void;
  customerNotes: string;
  onCustomerNotesChange: (val: string) => void;
  targetRequirement?: TargetRequirement;
}

export function CheckoutCustomerForm({
  customerName,
  onCustomerNameChange,
  customerEmail = '',
  onCustomerEmailChange,
  targetValue,
  onTargetValueChange,
  targetZone = '',
  onTargetZoneChange,
  targetEmail = '',
  onTargetEmailChange,
  phoneNumber,
  onPhoneNumberChange,
  customerNotes,
  onCustomerNotesChange,
  targetRequirement,
}: CheckoutCustomerFormProps) {
  // Sync fallback for targetValue vs targetEmail
  const activeTargetValue = targetValue || targetEmail;
  const handleTargetChange = (val: string) => {
    onTargetValueChange(val);
    if (onTargetEmailChange) {
      onTargetEmailChange(val);
    }
  };

  const reqType = targetRequirement?.type || 'email';
  const reqLabel = targetRequirement?.label || 'Email Tujuan Aktivasi / Akun *';
  const reqPlaceholder = targetRequirement?.placeholder || 'contoh: akun_anda@gmail.com';
  const reqHelper =
    targetRequirement?.helper || 'Kredensial atau lisensi akan dikaitkan ke data tujuan ini.';

  return (
    <div className="space-y-6">
      {/* CARD 1: INFORMASI DATA TUJUAN (SESUAI VIP RESELLER) */}
      <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-6 space-y-5 shadow-card">
        <div className="flex items-center gap-3 pb-3 border-b border-[rgba(18,26,42,0.08)]">
          <div className="w-7 h-7 rounded-lg bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.25)] text-[#C96F55] flex items-center justify-center text-xs font-bold shadow-xs">
            1
          </div>
          <h2 className="text-base font-bold text-[#121A2A]">Masukan Data Tujuan</h2>
        </div>

        <div className="space-y-4 pt-1">
          {/* DYNAMIC PRIMARY TARGET FIELD */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#121A2A]">
                {reqLabel}
              </label>
              {reqType === 'phone' && phoneNumber && (
                <button
                  type="button"
                  onClick={() => handleTargetChange(phoneNumber)}
                  className="text-[11px] text-[#C96F55] hover:underline font-medium transition-colors"
                >
                  Gunakan No. WhatsApp Pemesan
                </button>
              )}
              {reqType === 'email' && customerEmail && (
                <button
                  type="button"
                  onClick={() => handleTargetChange(customerEmail)}
                  className="text-[11px] text-[#C96F55] hover:underline font-medium transition-colors"
                >
                  Gunakan Email Pemesan
                </button>
              )}
            </div>

            <Input
              type={reqType === 'phone' ? 'tel' : reqType === 'email' ? 'email' : 'text'}
              required
              placeholder={reqPlaceholder}
              value={activeTargetValue}
              onChange={(e) => handleTargetChange(e.target.value)}
              className="bg-white border-[rgba(18,26,42,0.12)] text-xs sm:text-sm font-medium rounded-lg text-[#121A2A] focus:border-[#C96F55]"
            />
            <p className="text-[11px] text-[#121A2A]/60 leading-relaxed font-normal">
              {reqHelper}
            </p>
          </div>

          {/* DYNAMIC SERVER / ZONE ID (FOR GAMES) */}
          {targetRequirement?.requiresZone && onTargetZoneChange && (
            <div className="space-y-1.5 pt-1 animate-in fade-in-50 duration-200">
              <label className="text-xs font-bold text-[#121A2A] flex items-center justify-between">
                <span>{targetRequirement.zoneLabel || 'Server / Zone ID *'}</span>
                <span className="text-[11px] text-[#121A2A]/50 font-normal">Server akun game</span>
              </label>
              <Input
                type="text"
                required
                placeholder={targetRequirement.zonePlaceholder || 'contoh: 2685'}
                value={targetZone}
                onChange={(e) => onTargetZoneChange(e.target.value)}
                className="bg-white border-[rgba(18,26,42,0.12)] text-xs sm:text-sm rounded-lg text-[#121A2A] focus:border-[#C96F55]"
              />
              {targetRequirement.zoneHelper && (
                <p className="text-[11px] text-[#121A2A]/60 font-normal">
                  {targetRequirement.zoneHelper}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CARD 2: INFORMASI KONTAK PEMESAN & INVOICE */}
      <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-6 space-y-5 shadow-card">
        <div className="flex items-center gap-3 pb-3 border-b border-[rgba(18,26,42,0.08)]">
          <div className="w-7 h-7 rounded-lg bg-[rgba(18,26,42,0.06)] border border-[rgba(18,26,42,0.15)] text-[#121A2A] flex items-center justify-center text-xs font-bold shadow-xs">
            2
          </div>
          <h2 className="text-base font-bold text-[#121A2A]">Informasi Kontak Pemesan</h2>
        </div>

        <div className="space-y-4 pt-1">
          {/* NAMA PEMESAN */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#121A2A] flex items-center justify-between">
              <span>Nama Lengkap Customer / Pemesan *</span>
              <span className="text-[11px] text-[#121A2A]/50 font-normal">Identitas transaksi</span>
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

          {/* EMAIL PEMESAN (INVOICE) */}
          {onCustomerEmailChange && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#121A2A] flex items-center justify-between">
                <span>Email Pemesan (Pengiriman Invoice & Resi) *</span>
                <span className="text-[11px] text-[#121A2A]/50 font-normal">Bukti transaksi</span>
              </label>
              <Input
                type="email"
                required
                placeholder="contoh: pemesan@gmail.com"
                value={customerEmail}
                onChange={(e) => onCustomerEmailChange(e.target.value)}
                className="bg-white border-[rgba(18,26,42,0.12)] text-xs sm:text-sm rounded-lg text-[#121A2A]"
              />
            </div>
          )}

          {/* NOMOR WHATSAPP PEMESAN */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#121A2A] flex items-center justify-between">
              <span>Nomor WhatsApp / Kontak Pemesan *</span>
              <span className="text-[11px] text-[#121A2A]/50 font-normal">Notifikasi status instan</span>
            </label>
            <Input
              type="tel"
              required
              placeholder="contoh: 081234567890"
              value={phoneNumber}
              onChange={(e) => onPhoneNumberChange(e.target.value)}
              className="bg-white border-[rgba(18,26,42,0.12)] text-xs sm:text-sm rounded-lg text-[#121A2A]"
            />
          </div>

          {/* CATATAN PESANAN */}
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
    </div>
  );
}
