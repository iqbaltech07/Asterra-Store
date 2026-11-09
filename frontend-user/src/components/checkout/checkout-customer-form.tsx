'use client';

import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import {
  TargetRequirement,
  TargetFieldType,
  getProductTargetRequirement,
  validateTargetValue,
  validateTargetZone,
  validateContactEmail,
  validateContactPhone,
} from '@/lib/target-field-utils';
import { CartItem } from '@/store/use-cart-store';

export interface ItemTargetState {
  targetValue: string;
  targetZone: string;
  choiceMethod: 'whatsapp' | 'gmail';
}

interface CheckoutCustomerFormProps {
  customerName: string;
  onCustomerNameChange: (val: string) => void;
  // Contact & Invoice Email
  customerEmail?: string;
  onCustomerEmailChange?: (val: string) => void;
  // Dynamic Target Field (Phone, Game ID, Customer ID, Email, or Choice) - single-item fallback
  targetValue: string;
  onTargetValueChange: (val: string) => void;
  targetZone?: string;
  onTargetZoneChange?: (val: string) => void;
  targetEmail?: string;
  onTargetEmailChange?: (val: string) => void;
  choiceMethod?: 'whatsapp' | 'gmail';
  onChoiceMethodChange?: (val: 'whatsapp' | 'gmail') => void;
  // WhatsApp Notification Contact
  phoneNumber: string;
  onPhoneNumberChange: (val: string) => void;
  customerNotes: string;
  onCustomerNotesChange: (val: string) => void;
  targetRequirement?: TargetRequirement;

  // Multi-item support
  items?: CartItem[];
  itemTargets?: Record<string, ItemTargetState>;
  onItemTargetChange?: (key: string, field: 'targetValue' | 'targetZone' | 'choiceMethod', val: string) => void;
}

// Helper for dynamic input border/background styling based on Zod
function getInputStateClass(isValid: boolean, isEmpty: boolean) {
  if (isEmpty) {
    return 'bg-white border-[rgba(18,26,42,0.12)] text-[#121A2A] focus:border-[#C96F55] focus:ring-2 focus:ring-[#C96F55]/10';
  }
  if (isValid) {
    return 'border-emerald-500 bg-emerald-50/25 text-emerald-950 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15';
  }
  return 'border-rose-500 bg-rose-50/40 text-rose-950 focus:border-rose-600 focus:ring-4 focus:ring-rose-500/15';
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
  items,
  itemTargets,
  onItemTargetChange,
}: CheckoutCustomerFormProps) {
  const isMultiItem = Boolean(items && items.length > 1);

  const reqType = targetRequirement?.type || 'email';
  const reqLabel = targetRequirement?.label || 'Email Tujuan Aktivasi / Akun *';
  const reqPlaceholder = targetRequirement?.placeholder || 'contoh: akun_anda@gmail.com';
  const reqHelper =
    targetRequirement?.helper || 'Kredensial atau lisensi akan dikaitkan ke data tujuan ini.';

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

  const handleSingleTargetChange = (val: string) => {
    onTargetValueChange(val);
    if (onTargetEmailChange) {
      onTargetEmailChange(val);
    }
    if (items && items.length > 0 && onItemTargetChange) {
      onItemTargetChange(`${items[0].id}_0`, 'targetValue', val);
    }
  };

  const handleSingleZoneChange = (val: string) => {
    if (onTargetZoneChange) {
      onTargetZoneChange(val);
    }
    if (items && items.length > 0 && onItemTargetChange) {
      onItemTargetChange(`${items[0].id}_0`, 'targetZone', val);
    }
  };

  const handleSingleChoiceMethodChange = (method: 'whatsapp' | 'gmail') => {
    if (onChoiceMethodChange) {
      onChoiceMethodChange(method);
    }
    if (items && items.length > 0 && onItemTargetChange) {
      onItemTargetChange(`${items[0].id}_0`, 'choiceMethod', method);
    }
  };

  // Real-time Zod Validation for Single Target Activation Field
  const singleTargetValidation = useMemo(() => {
    return validateTargetValue(reqType, targetValue, choiceMethod);
  }, [reqType, targetValue, choiceMethod]);

  const singleZoneValidation = useMemo(() => {
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

  return (
    <div className="space-y-6">
      {/* CARD 1: INFORMASI DATA TUJUAN AKTIVASI (MANDATORI, NO AUTO-FILL) */}
      <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-6 space-y-5 shadow-card">
        <div className="flex items-center gap-3 pb-3 border-b border-[rgba(18,26,42,0.08)]">
          <div className="w-7 h-7 rounded-lg bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.25)] text-[#C96F55] flex items-center justify-center text-xs font-bold shadow-xs">
            1
          </div>
          <div>
            <h2 className="text-base font-bold text-[#121A2A]">
              {isMultiItem ? 'Masukan Data Tujuan per Produk' : 'Masukan Data Tujuan'}
            </h2>
            <p className="text-[11px] text-[#121A2A]/50">
              {isMultiItem
                ? `Setiap produk memiliki tujuan pengiriman akun / aktivasi tersendiri (${items?.length} item)`
                : reqType === 'none'
                ? 'Informasi pengiriman lisensi / voucher pesanan'
                : 'Data akun / kontak penerima akun terpisah dari akun login Anda'}
            </p>
          </div>
        </div>

        {/* MULTI-ITEM MODE: RENDER ACCORDION/CARD PER ITEM */}
        {isMultiItem && items ? (
          <div className="space-y-4 pt-1">
            {items.map((item, idx) => {
              const key = `${item.id}_${idx}`;
              const req = getProductTargetRequirement(item);
              const itState: ItemTargetState = itemTargets?.[key] || {
                targetValue: '',
                targetZone: '',
                choiceMethod: (req.type === 'choice' && req.defaultOption === 'gmail') ? 'gmail' : 'whatsapp',
              };

              const itValRes = validateTargetValue(req.type, itState.targetValue, itState.choiceMethod);
              const itZoneRes = req.requiresZone ? validateTargetZone(itState.targetZone) : null;

              const itEffectiveLabel = req.type === 'choice'
                ? (itState.choiceMethod === 'gmail'
                    ? (req.fields?.gmail?.label || 'Email Gmail Penerima Akun *')
                    : (req.fields?.whatsapp?.label || 'Nomor WhatsApp Penerima Akun *'))
                : req.label;

              const itEffectivePlaceholder = req.type === 'choice'
                ? (itState.choiceMethod === 'gmail'
                    ? (req.fields?.gmail?.placeholder || 'contoh: akun_penerima@gmail.com')
                    : (req.fields?.whatsapp?.placeholder || 'contoh: 081234567890'))
                : req.placeholder;

              const itEffectiveHelper = req.type === 'choice'
                ? (itState.choiceMethod === 'gmail'
                    ? (req.fields?.gmail?.helper || `Kredensial akun ${item.name} akan dikirimkan melalui email Gmail ini.`)
                    : (req.fields?.whatsapp?.helper || `Kredensial akun ${item.name} akan dikirimkan melalui chat WhatsApp ini.`))
                : req.helper;

              return (
                <div
                  key={key}
                  className="p-4 rounded-xl border border-[rgba(18,26,42,0.1)] bg-slate-50/60 space-y-3.5 transition-all"
                >
                  {/* Item Header */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[rgba(18,26,42,0.06)]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-[#121A2A]/5 text-[#121A2A] text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-[#121A2A] truncate">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                        {item.quantity}x
                      </span>
                    </div>
                    <span className="text-xs font-bold font-mono text-[#0F172A] shrink-0">
                      {item.priceFormatted}
                    </span>
                  </div>

                  {/* Item Inputs Based on Requirement */}
                  {req.needsReview ? (
                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <span>⚠️ Produk Sedang Ditinjau Admin</span>
                      </div>
                      <p className="text-[11px] text-rose-700 leading-relaxed">
                        Produk ini sedang dalam evaluasi konfigurasi oleh admin dan belum dapat dicheckout saat ini. Mohon hapus produk ini dari keranjang.
                      </p>
                    </div>
                  ) : req.type === 'none' ? (
                    <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-950 text-xs flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                      <span className="text-[11px] text-emerald-900">
                        Voucher / Lisensi digital langsung terbit di halaman rincian pesanan (tanpa input tujuan).
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Choice Method Toggle if Type is Choice */}
                      {req.type === 'choice' && (
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-[#121A2A] flex items-center justify-between">
                            <span>Metode Pengiriman Akun <span className="text-[#C96F55]">*</span></span>
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => onItemTargetChange?.(key, 'choiceMethod', 'whatsapp')}
                              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                itState.choiceMethod === 'whatsapp'
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                                  : 'border-[rgba(18,26,42,0.12)] bg-white text-[#121A2A]/70 hover:bg-slate-50'
                              }`}
                            >
                              <span className="text-emerald-600">📱</span>
                              <span>WhatsApp</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onItemTargetChange?.(key, 'choiceMethod', 'gmail')}
                              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                itState.choiceMethod === 'gmail'
                                  ? 'border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                                  : 'border-[rgba(18,26,42,0.12)] bg-white text-[#121A2A]/70 hover:bg-slate-50'
                              }`}
                            >
                              <span className="text-red-500">✉️</span>
                              <span>Gmail</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Primary Item Target Value */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#121A2A] flex items-center justify-between">
                          <span>{itEffectiveLabel}</span>
                          {!itValRes.isEmpty && (
                            <span className={`text-[10px] font-semibold ${itValRes.isValid ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {itValRes.isValid ? '✓ Valid' : 'Format salah'}
                            </span>
                          )}
                        </label>
                        <Input
                          type={
                            req.type === 'phone' || (req.type === 'choice' && itState.choiceMethod === 'whatsapp')
                              ? 'tel'
                              : req.type === 'email' || (req.type === 'choice' && itState.choiceMethod === 'gmail')
                              ? 'email'
                              : 'text'
                          }
                          required
                          placeholder={itEffectivePlaceholder}
                          value={itState.targetValue}
                          onChange={(e) => onItemTargetChange?.(key, 'targetValue', e.target.value)}
                          className={`text-xs rounded-lg transition-all ${getInputStateClass(itValRes.isValid, itValRes.isEmpty)}`}
                        />
                        {!itValRes.isEmpty && !itValRes.isValid ? (
                          <p className="text-[10px] font-medium text-rose-600 pt-0.5">
                            {itValRes.error}
                          </p>
                        ) : (
                          <p className="text-[10px] text-[#121A2A]/60 font-normal pt-0.5">
                            {itEffectiveHelper}
                          </p>
                        )}
                      </div>

                      {/* Zone ID for Games */}
                      {req.requiresZone && itZoneRes && (
                        <div className="space-y-1 pt-1">
                          <label className="text-[11px] font-bold text-[#121A2A] flex items-center justify-between">
                            <span>{req.zoneLabel || 'Server / Zone ID *'}</span>
                            {!itZoneRes.isEmpty && (
                              <span className={`text-[10px] font-semibold ${itZoneRes.isValid ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {itZoneRes.isValid ? '✓ Valid' : 'Format salah'}
                              </span>
                            )}
                          </label>
                          <Input
                            type="text"
                            required
                            placeholder={req.zonePlaceholder || 'contoh: 2685'}
                            value={itState.targetZone}
                            onChange={(e) => onItemTargetChange?.(key, 'targetZone', e.target.value)}
                            className={`text-xs rounded-lg transition-all ${getInputStateClass(itZoneRes.isValid, itZoneRes.isEmpty)}`}
                          />
                          {!itZoneRes.isEmpty && !itZoneRes.isValid ? (
                            <p className="text-[10px] font-medium text-rose-600 pt-0.5">
                              {itZoneRes.error}
                            </p>
                          ) : (
                            <p className="text-[10px] text-[#121A2A]/60 font-normal pt-0.5">
                              {req.zoneHelper || 'Server atau Zone ID akun game Anda.'}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* SINGLE-ITEM MODE */
          <div className="space-y-4 pt-1">
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
                {reqType === 'choice' && (
                  <div className="space-y-2 pb-1">
                    <label className="text-xs font-bold text-[#121A2A] flex items-center justify-between">
                      <span>Pilih Metode Pengiriman Akun <span className="text-[#C96F55]">*</span></span>
                      <span className="text-[11px] text-[#C96F55] font-semibold">Wajib dipilih</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleSingleChoiceMethodChange('whatsapp')}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          choiceMethod === 'whatsapp'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-xs ring-2 ring-emerald-500/20'
                            : 'border-[rgba(18,26,42,0.12)] bg-white text-[#121A2A]/70 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-emerald-600">📱</span>
                        <span>Kirim ke WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSingleChoiceMethodChange('gmail')}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          choiceMethod === 'gmail'
                            ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-xs ring-2 ring-blue-500/20'
                            : 'border-[rgba(18,26,42,0.12)] bg-white text-[#121A2A]/70 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-red-500">✉️</span>
                        <span>Kirim ke Gmail</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* PRIMARY TARGET FIELD */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#121A2A] flex items-center justify-between">
                    <span>{effectiveLabel}</span>
                    {!singleTargetValidation.isEmpty && (
                      <span
                        className={`text-[11px] font-semibold transition-colors duration-150 ${
                          singleTargetValidation.isValid ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {singleTargetValidation.isValid ? '✓ Valid' : 'Format salah'}
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
                      onChange={(e) => handleSingleTargetChange(e.target.value)}
                      className={`text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 pr-10 ${getInputStateClass(
                        singleTargetValidation.isValid,
                        singleTargetValidation.isEmpty
                      )}`}
                    />
                  </div>

                  {!singleTargetValidation.isEmpty ? (
                    singleTargetValidation.isValid ? (
                      <p className="text-[11px] font-medium text-emerald-600 flex items-center gap-1.5 pt-0.5">
                        <span>{singleTargetValidation.successMessage || 'Format valid'}</span>
                      </p>
                    ) : (
                      <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1.5 pt-0.5">
                        <span>{singleTargetValidation.error}</span>
                      </p>
                    )
                  ) : (
                    <p className="text-[11px] text-[#121A2A]/60 leading-relaxed font-normal pt-0.5">
                      {effectiveHelper}
                    </p>
                  )}
                </div>

                {/* SERVER / ZONE ID FOR GAMES */}
                {targetRequirement?.requiresZone && onTargetZoneChange && singleZoneValidation && (
                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-bold text-[#121A2A] flex items-center justify-between">
                      <span>{targetRequirement.zoneLabel || 'Server / Zone ID *'}</span>
                      {!singleZoneValidation.isEmpty && (
                        <span
                          className={`text-[11px] font-semibold ${
                            singleZoneValidation.isValid ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {singleZoneValidation.isValid ? '✓ Valid' : 'Format salah'}
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
                        onChange={(e) => handleSingleZoneChange(e.target.value)}
                        className={`text-xs sm:text-sm rounded-lg pr-10 transition-all duration-200 ${getInputStateClass(
                          singleZoneValidation.isValid,
                          singleZoneValidation.isEmpty
                        )}`}
                      />
                    </div>

                    {!singleZoneValidation.isEmpty ? (
                      singleZoneValidation.isValid ? (
                        <p className="text-[11px] font-medium text-emerald-600 flex items-center gap-1.5 pt-0.5">
                          <span>Server / Zone ID valid</span>
                        </p>
                      ) : (
                        <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1.5 pt-0.5">
                          <span>{singleZoneValidation.error}</span>
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
        )}
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
              </div>
              {!contactEmailValidation.isEmpty && !contactEmailValidation.isValid && (
                <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1.5 pt-0.5">
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
            </div>
            {!contactPhoneValidation.isEmpty && !contactPhoneValidation.isValid && (
              <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1.5 pt-0.5">
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
