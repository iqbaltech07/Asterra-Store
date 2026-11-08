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
  // Dynamic Target Field (Phone, Game ID, Customer ID, Email, or Choice)
  targetValue: string;
  onTargetValueChange: (val: string) => void;
  targetZone?: string;
  onTargetZoneChange?: (val: string) => void;
  // Legacy alias for backwards compatibility
  targetEmail?: string;
  onTargetEmailChange?: (val: string) => void;
  // Choice delivery method selection ('whatsapp' | 'gmail')
  choiceMethod?: 'whatsapp' | 'gmail';
  onChoiceMethodChange?: (val: 'whatsapp' | 'gmail') => void;
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
  choiceMethod = 'whatsapp',
  onChoiceMethodChange,
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

  // Dynamically resolve label and helper when type is choice (WhatsApp vs Gmail)
  const effectiveLabel = reqType === 'choice'
    ? (choiceMethod === 'gmail'
        ? (targetRequirement?.fields?.gmail?.label || 'Email Gmail Penerima Akun *')
        : (targetRequirement?.fields?.whatsapp?.label || 'Nomor WhatsApp Penerima Akun *'))
    : reqLabel;

  const effectivePlaceholder = reqType === 'choice'
    ? (choiceMethod === 'gmail'
        ? (targetRequirement?.fields?.gmail?.placeholder || 'contoh: akun_penerima@gmail.com')
        : (targetRequirement?.fields?.whatsapp?.placeholder || 'contoh: 081234567890'))
    : reqPlaceholder;

  const effectiveHelper = reqType === 'choice'
    ? (choiceMethod === 'gmail'
        ? (targetRequirement?.fields?.gmail?.helper || 'Kredensial akun AsterraStore akan dikirimkan melalui email Gmail ini.')
        : (targetRequirement?.fields?.whatsapp?.helper || 'Kredensial akun AsterraStore akan dikirimkan melalui chat WhatsApp ini.'))
    : reqHelper;

  const handleTargetChange = (val: string) => {
    onTargetValueChange(val);
    if (onTargetEmailChange) {
      onTargetEmailChange(val);
    }
  };

  // Real-time Zod Validation for Target Activation Field
  const targetValidation = useMemo(() => {
    return validateTargetValue(reqType, targetValue, choiceMethod);
  }, [reqType, targetValue, choiceMethod]);

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
              {reqType === 'none'
                ? 'Informasi pengiriman lisensi / voucher pesanan'
                : 'Data akun / kontak penerima akun terpisah dari akun login Anda'}
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-1">
          {/* SPECIAL CASE: NO INPUT NEEDED (VOUCHER / LICENSE) */}
          {reqType === 'none' ? (
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 text-emerald-950 space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-emerald-900">Produk Langsung Terbit (Tanpa Input Akun)</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                {reqHelper || 'Produk ini berupa voucher atau lisensi siap pakai. Kredensial akan langsung terbit pada halaman rincian pesanan Anda setelah pembayaran diverifikasi.'}
              </p>
            </div>
          ) : (
            <>
              {/* SPECIAL CASE: CHOICE METHOD SELECTOR (CHATGPT, NETFLIX, SPOTIFY) */}
              {reqType === 'choice' && (
                <div className="space-y-2 pb-1">
                  <label className="text-xs font-bold text-[#121A2A] flex items-center justify-between">
                    <span>Pilih Metode Pengiriman Akun <span className="text-[#C96F55]">*</span></span>
                    <span className="text-[11px] text-[#C96F55] font-semibold">Wajib dipilih</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => onChoiceMethodChange?.('whatsapp')}
                      className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        choiceMethod === 'whatsapp'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-xs ring-2 ring-emerald-500/20'
                          : 'border-[rgba(18,26,42,0.12)] bg-white text-[#121A2A]/70 hover:bg-slate-50'
                      }`}
                    >
                      <svg className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.075-1.84-.426-1.542-.641-2.529-2.203-2.607-2.307-.076-.104-.632-.84-.632-1.603 0-.763.4-1.139.542-1.294.143-.156.312-.195.417-.195.104 0 .208.002.299.006.096.004.224-.036.35.267.13.312.443 1.08.482 1.159.039.08.065.172.013.275-.052.104-.078.169-.156.26-.078.091-.164.203-.234.273-.078.078-.16.163-.069.319.091.156.404.667.868 1.08.597.532 1.1.697 1.256.775.156.078.247.065.338-.039.091-.104.39-.455.494-.611.104-.156.208-.13.35-.078.143.052.909.429 1.065.507.156.078.26.117.299.182.039.065.039.377-.105.782z" />
                      </svg>
                      <span>Kirim ke WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onChoiceMethodChange?.('gmail')}
                      className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        choiceMethod === 'gmail'
                          ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-xs ring-2 ring-blue-500/20'
                          : 'border-[rgba(18,26,42,0.12)] bg-white text-[#121A2A]/70 hover:bg-slate-50'
                      }`}
                    >
                      <svg className="w-4 h-4 text-red-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                      </svg>
                      <span>Kirim ke Gmail</span>
                    </button>
                  </div>
                </div>
              )}

              {/* PRIMARY TARGET FIELD */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#121A2A] flex items-center justify-between">
                  <span>{effectiveLabel}</span>
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
                    type={
                      reqType === 'phone' || (reqType === 'choice' && choiceMethod === 'whatsapp')
                        ? 'tel'
                        : reqType === 'email' || (reqType === 'choice' && choiceMethod === 'gmail')
                        ? 'email'
                        : 'text'
                    }
                    required
                    autoComplete="off"
                    spellCheck={false}
                    data-form-type="other"
                    data-lpignore="true"
                    placeholder={effectivePlaceholder}
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
                    {effectiveHelper}
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
            </>
          )}
        </div>
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
