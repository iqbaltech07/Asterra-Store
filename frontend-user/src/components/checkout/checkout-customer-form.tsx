'use client';

import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import {
  TargetRequirement,
  validateTargetValue,
  validateTargetZone,
  validateContactEmail,
  validateContactPhone,
} from '@/lib/target-field-utils';

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
  // Legacy alias for backwards compatibility
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
  onTargetEmailChange,
  phoneNumber,
  onPhoneNumberChange,
  customerNotes,
  onCustomerNotesChange,
  targetRequirement,
}: CheckoutCustomerFormProps) {
  const reqType = targetRequirement?.type || 'email';
  const reqLabel = targetRequirement?.label || 'Email Tujuan Aktivasi / Akun *';
  const reqPlaceholder = targetRequirement?.placeholder || 'contoh: akun_anda@gmail.com';
  const reqHelper =
    targetRequirement?.helper || 'Kredensial atau lisensi akan dikaitkan ke data tujuan ini.';

  const handleTargetChange = (val: string) => {
    onTargetValueChange(val);
    if (onTargetEmailChange) {
      onTargetEmailChange(val);
    }
  };

  // Real-time Zod Validation for Target Activation Field
  const targetValidation = useMemo(() => {
    return validateTargetValue(reqType, targetValue);
  }, [reqType, targetValue]);

  // Real-time Zod Validation for Server / Zone ID (Games)
  const zoneValidation = useMemo(() => {
    if (!targetRequirement?.requiresZone) return null;
    return validateTargetZone(targetZone);
  }, [targetRequirement?.requiresZone, targetZone]);

  // Real-time Zod Validation for Contact Info (Card 2)
  const contactEmailValidation = useMemo(() => {
    if (!customerEmail.trim()) return { isValid: false, isEmpty: true };
    return validateContactEmail(customerEmail);
  }, [customerEmail]);

  const contactPhoneValidation = useMemo(() => {
    if (!phoneNumber.trim()) return { isValid: false, isEmpty: true };
    return validateContactPhone(phoneNumber);
  }, [phoneNumber]);

  // Helper for dynamic input border/background styling based on Zod
  const getInputStateClass = (isValid: boolean, isEmpty: boolean) => {
    if (isEmpty) {
      return 'bg-white border-[rgba(18,26,42,0.12)] text-[#121A2A] focus:border-[#C96F55] focus:ring-2 focus:ring-[#C96F55]/10';
    }
    if (isValid) {
      return 'border-emerald-500 bg-emerald-50/25 text-emerald-950 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15';
    }
    return 'border-rose-500 bg-rose-50/40 text-rose-950 focus:border-rose-600 focus:ring-4 focus:ring-rose-500/15';
  };

  return (
    <div className="space-y-6">
      {/* CARD 1: INFORMASI DATA TUJUAN AKTIVASI (MANDATORI, NO AUTO-FILL) */}
      <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-6 space-y-5 shadow-card">
        <div className="flex items-center gap-3 pb-3 border-b border-[rgba(18,26,42,0.08)]">
          <div className="w-7 h-7 rounded-lg bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.25)] text-[#C96F55] flex items-center justify-center text-xs font-bold shadow-xs">
            1
          </div>
          <div>
            <h2 className="text-base font-bold text-[#121A2A]">Masukan Data Tujuan</h2>
            <p className="text-[11px] text-[#121A2A]/50">
              Pastikan data akun / nomor tujuan pengisian sudah benar sebelum checkout
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-1">
          {/* PRIMARY TARGET FIELD (EMAIL / HP / USER ID / NO. METER) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#121A2A] flex items-center justify-between">
              <span>{reqLabel}</span>
              {!targetValidation.isEmpty && (
                <span
                  className={`text-[11px] font-semibold transition-colors duration-150 ${
                    targetValidation.isValid ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {targetValidation.isValid ? '✓ Valid' : 'Format salah'}
                </span>
              )}
            </label>

            <div className="relative">
              <Input
                type={reqType === 'phone' ? 'tel' : reqType === 'email' ? 'email' : 'text'}
                required
                autoComplete="off"
                spellCheck={false}
                data-form-type="other"
                data-lpignore="true"
                placeholder={reqPlaceholder}
                value={targetValue}
                onChange={(e) => handleTargetChange(e.target.value)}
                className={`text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 pr-10 ${getInputStateClass(
                  targetValidation.isValid,
                  targetValidation.isEmpty
                )}`}
              />

              {/* Status Indicator Icon */}
              {!targetValidation.isEmpty && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-200">
                  {targetValidation.isValid ? (
                    <svg
                      className="w-4 h-4 text-emerald-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4 text-rose-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              )}
            </div>

            {/* Dynamic Status / Helper Message */}
            {!targetValidation.isEmpty ? (
              targetValidation.isValid ? (
                <p className="text-[11px] font-medium text-emerald-600 flex items-center gap-1.5 pt-0.5 animate-in fade-in-50 duration-150">
                  <svg className="w-3.5 h-3.5 shrink-0 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                  <span>{targetValidation.successMessage || 'Format valid'}</span>
                </p>
              ) : (
                <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1.5 pt-0.5 animate-in fade-in-50 duration-150">
                  <svg className="w-3.5 h-3.5 shrink-0 text-rose-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  <span>{targetValidation.error}</span>
                </p>
              )
            ) : (
              <p className="text-[11px] text-[#121A2A]/60 leading-relaxed font-normal pt-0.5">
                {reqHelper}
              </p>
            )}
          </div>

          {/* DYNAMIC SERVER / ZONE ID (GAMES LIKE MLBB) */}
          {targetRequirement?.requiresZone && onTargetZoneChange && zoneValidation && (
            <div className="space-y-1.5 pt-1 animate-in fade-in-50 duration-200">
              <label className="text-xs font-bold text-[#121A2A] flex items-center justify-between">
                <span>{targetRequirement.zoneLabel || 'Server / Zone ID *'}</span>
                {!zoneValidation.isEmpty && (
                  <span
                    className={`text-[11px] font-semibold ${
                      zoneValidation.isValid ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {zoneValidation.isValid ? '✓ Valid' : 'Format salah'}
                  </span>
                )}
              </label>

              <div className="relative">
                <Input
                  type="text"
                  required
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={targetRequirement.zonePlaceholder || 'contoh: 2685'}
                  value={targetZone}
                  onChange={(e) => onTargetZoneChange(e.target.value)}
                  className={`text-xs sm:text-sm rounded-lg pr-10 transition-all duration-200 ${getInputStateClass(
                    zoneValidation.isValid,
                    zoneValidation.isEmpty
                  )}`}
                />
                {!zoneValidation.isEmpty && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    {zoneValidation.isValid ? (
                      <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-rose-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                )}
              </div>

              {!zoneValidation.isEmpty ? (
                zoneValidation.isValid ? (
                  <p className="text-[11px] font-medium text-emerald-600 flex items-center gap-1.5 pt-0.5">
                    <svg className="w-3.5 h-3.5 shrink-0 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                    <span>Server / Zone ID valid</span>
                  </p>
                ) : (
                  <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1.5 pt-0.5">
                    <svg className="w-3.5 h-3.5 shrink-0 text-rose-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    <span>{zoneValidation.error}</span>
                  </p>
                )
              ) : (
                targetRequirement.zoneHelper && (
                  <p className="text-[11px] text-[#121A2A]/60 font-normal pt-0.5">
                    {targetRequirement.zoneHelper}
                  </p>
                )
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
          <div>
            <h2 className="text-base font-bold text-[#121A2A]">Informasi Kontak Pemesan</h2>
            <p className="text-[11px] text-[#121A2A]/50">
              Pengiriman bukti invoice transaksi dan update pesanan real-time
            </p>
          </div>
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
              className="bg-white border-[rgba(18,26,42,0.12)] text-xs sm:text-sm font-medium rounded-lg text-[#121A2A] focus:border-[#C96F55]"
            />
          </div>

          {/* EMAIL PEMESAN (INVOICE) */}
          {onCustomerEmailChange && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#121A2A] flex items-center justify-between">
                <span>Email Pemesan (Pengiriman Invoice & Resi) *</span>
                {!contactEmailValidation.isEmpty && (
                  <span
                    className={`text-[11px] font-semibold ${
                      contactEmailValidation.isValid ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {contactEmailValidation.isValid ? '✓ Valid' : 'Format salah'}
                  </span>
                )}
              </label>
              <div className="relative">
                <Input
                  type="email"
                  required
                  placeholder="contoh: pemesan@gmail.com"
                  value={customerEmail}
                  onChange={(e) => onCustomerEmailChange(e.target.value)}
                  className={`text-xs sm:text-sm rounded-lg pr-10 transition-all duration-200 ${getInputStateClass(
                    contactEmailValidation.isValid,
                    contactEmailValidation.isEmpty
                  )}`}
                />
                {!contactEmailValidation.isEmpty && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    {contactEmailValidation.isValid ? (
                      <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-rose-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                )}
              </div>
              {!contactEmailValidation.isEmpty && !contactEmailValidation.isValid && (
                <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1.5 pt-0.5">
                  <svg className="w-3.5 h-3.5 shrink-0 text-rose-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  <span>{contactEmailValidation.error}</span>
                </p>
              )}
            </div>
          )}

          {/* NOMOR WHATSAPP PEMESAN */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#121A2A] flex items-center justify-between">
              <span>Nomor WhatsApp Kontak Pemesan *</span>
              {!contactPhoneValidation.isEmpty && (
                <span
                  className={`text-[11px] font-semibold ${
                    contactPhoneValidation.isValid ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {contactPhoneValidation.isValid ? '✓ Valid' : 'Format salah'}
                </span>
              )}
            </label>
            <div className="relative">
              <Input
                type="tel"
                required
                placeholder="contoh: 081234567890"
                value={phoneNumber}
                onChange={(e) => onPhoneNumberChange(e.target.value)}
                className={`text-xs sm:text-sm rounded-lg pr-10 transition-all duration-200 ${getInputStateClass(
                  contactPhoneValidation.isValid,
                  contactPhoneValidation.isEmpty
                )}`}
              />
              {!contactPhoneValidation.isEmpty && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  {contactPhoneValidation.isValid ? (
                    <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-rose-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              )}
            </div>
            {!contactPhoneValidation.isEmpty && !contactPhoneValidation.isValid && (
              <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1.5 pt-0.5">
                <svg className="w-3.5 h-3.5 shrink-0 text-rose-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <span>{contactPhoneValidation.error}</span>
              </p>
            )}
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
              className="bg-white border-[rgba(18,26,42,0.12)] text-xs sm:text-sm rounded-lg text-[#121A2A] focus:border-[#C96F55]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
