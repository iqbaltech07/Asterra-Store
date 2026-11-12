'use client';

import React, { useMemo } from 'react';
import { UserCheck, Gamepad2, Gift } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  TargetRequirement,
  getProductTargetRequirement,
  validateTargetValue,
  validateTargetZone,
  validateContactEmail,
  validateContactPhone,
  validateContactRecipient,
} from '@/lib/target-field-utils';
import { CartItem } from '@/store/use-cart-store';

export interface ItemTargetState {
  targetValue: string;
  targetZone: string;
  choiceMethod: 'whatsapp' | 'gmail';
}

interface CheckoutCustomerFormProps {
  // Buyer Identity & Contact
  customerName: string;
  onCustomerNameChange: (val: string) => void;
  customerEmail: string;
  onCustomerEmailChange?: (val: string) => void;
  phoneNumber: string;
  onPhoneNumberChange: (val: string) => void;

  // Single Checkbox for Different Recipient Option
  isDifferentRecipient: boolean;
  onDifferentRecipientChange: (val: boolean) => void;

  // Recipient Identity (Visible only when isDifferentRecipient is true)
  recipientName: string;
  onRecipientNameChange: (val: string) => void;
  recipientContact: string;
  onRecipientContactChange: (val: string) => void;

  // Technical Parameter Fields (Game ID, Server/Zone ID, Delivery Choice)
  targetValue: string;
  onTargetValueChange: (val: string) => void;
  targetZone?: string;
  onTargetZoneChange?: (val: string) => void;
  targetEmail?: string;
  onTargetEmailChange?: (val: string) => void;
  choiceMethod?: 'whatsapp' | 'gmail';
  onChoiceMethodChange?: (val: 'whatsapp' | 'gmail') => void;

  // Order Notes
  customerNotes: string;
  onCustomerNotesChange: (val: string) => void;

  // Cart Target Requirements & Multi-Item Support
  targetRequirement?: TargetRequirement;
  items?: CartItem[];
  itemTargets?: Record<string, ItemTargetState>;
  onItemTargetChange?: (key: string, field: 'targetValue' | 'targetZone' | 'choiceMethod', val: string) => void;
}

// Helper for dynamic input border/background styling based on validation state
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
  phoneNumber,
  onPhoneNumberChange,
  isDifferentRecipient,
  onDifferentRecipientChange,
  recipientName,
  onRecipientNameChange,
  recipientContact,
  onRecipientContactChange,
  targetValue,
  onTargetValueChange,
  targetZone = '',
  onTargetZoneChange,
  onTargetEmailChange,
  choiceMethod = 'whatsapp',
  onChoiceMethodChange,
  customerNotes,
  onCustomerNotesChange,
  targetRequirement,
  items,
  itemTargets,
  onItemTargetChange,
}: CheckoutCustomerFormProps) {
  const isMultiItem = Boolean(items && items.length > 1);
  const reqType = targetRequirement?.type || 'email';
  const isGameProduct = reqType === 'game';
  const hasGameInCart = items?.some((it) => getProductTargetRequirement(it).type === 'game') || isGameProduct;

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

  // Real-time validations for Buyer Contact
  const contactEmailValidation = useMemo(() => {
    if (!customerEmail.trim()) return { isValid: false, isEmpty: true };
    return validateContactEmail(customerEmail);
  }, [customerEmail]);

  const contactPhoneValidation = useMemo(() => {
    if (!phoneNumber.trim()) return { isValid: false, isEmpty: true };
    return validateContactPhone(phoneNumber);
  }, [phoneNumber]);

  // Real-time validation for Recipient Contact (only relevant when different recipient is active)
  const recipientContactValidation = useMemo(() => {
    if (!recipientContact.trim()) return { isValid: false, isEmpty: true };
    return validateContactRecipient(recipientContact);
  }, [recipientContact]);

  // Real-time validation for Game Technical ID & Server Zone
  const gameTargetValidation = useMemo(() => {
    if (!hasGameInCart) return { isValid: true, isEmpty: false };
    return validateTargetValue('game', targetValue);
  }, [hasGameInCart, targetValue]);

  const gameZoneValidation = useMemo(() => {
    if (!targetRequirement?.requiresZone) return null;
    return validateTargetZone(targetZone);
  }, [targetRequirement?.requiresZone, targetZone]);

  return (
    <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-6 sm:p-7 space-y-6 shadow-card">
      {/* CARD HEADER: SINGLE UNIFIED FORM */}
      <div className="flex items-center gap-3 pb-4 border-b border-[rgba(18,26,42,0.08)]">
        <div className="w-8 h-8 rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] text-[#C96F55] flex items-center justify-center text-sm font-bold shadow-xs shrink-0">
          <UserCheck className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#121A2A]">
            Data Pemesan & Pengiriman
          </h2>
          <p className="text-[11px] sm:text-xs text-[#121A2A]/50">
            Data pemesan otomatis digunakan sebagai tujuan pengiriman produk
          </p>
        </div>
      </div>

      {/* SECTION 1: DATA PEMESAN (BUYER IDENTITY) */}
      <div className="space-y-4">
        {/* Nama Lengkap Pemesan */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#121A2A] flex items-center justify-between">
            <span>Nama Lengkap Pemesan <span className="text-[#C96F55]">*</span></span>
            <span className="text-[11px] text-[#121A2A]/50 font-normal">Identitas transaksi & invoice</span>
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

        {/* Email & Nomor WhatsApp (Grid 2 Cols on sm+) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Email Pemesan */}
          {onCustomerEmailChange && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#121A2A] flex items-center justify-between">
                <span>Email Pemesan <span className="text-[#C96F55]">*</span></span>
                {!contactEmailValidation.isEmpty && (
                  <span
                    className={`text-[10px] font-semibold ${
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
              {!contactEmailValidation.isEmpty && !contactEmailValidation.isValid ? (
                <p className="text-[10px] font-medium text-rose-600 pt-0.5">
                  {contactEmailValidation.error}
                </p>
              ) : (
                <p className="text-[10px] text-[#121A2A]/50 pt-0.5">
                  Bukti invoice & status pesanan
                </p>
              )}
            </div>
          )}

          {/* Nomor WhatsApp Pemesan */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#121A2A] flex items-center justify-between">
              <span>Nomor WhatsApp Pemesan <span className="text-[#C96F55]">*</span></span>
              {!contactPhoneValidation.isEmpty && (
                <span
                  className={`text-[10px] font-semibold ${
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
            {!contactPhoneValidation.isEmpty && !contactPhoneValidation.isValid ? (
              <p className="text-[10px] font-medium text-rose-600 pt-0.5">
                {contactPhoneValidation.error}
              </p>
            ) : (
              <p className="text-[10px] text-[#121A2A]/50 pt-0.5">
                Notifikasi transaksi & bantuan CS
              </p>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: PARAMETER KHUSUS PRODUK (GAME REQUIREMENTS) */}
      {/* 2A. Game Requirements: Clearly separated as technical parameters */}
      {hasGameInCart && (
        <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/30 space-y-3">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-800">Detail Akun Game Tujuan</span>
            <span className="text-[10px] text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded font-medium">
              Top Up Langsung
            </span>
          </div>
          <p className="text-[11px] text-slate-600">
            User ID dan Server/Zone ID adalah identitas in-game Anda, terpisah dari kontak pemesan.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                <span>User ID Game <span className="text-rose-500">*</span></span>
                {!gameTargetValidation.isEmpty && (
                  <span
                    className={`text-[10px] font-semibold ${
                      gameTargetValidation.isValid ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {gameTargetValidation.isValid ? '✓ Valid' : 'Format salah'}
                  </span>
                )}
              </label>
              <Input
                type="text"
                required
                placeholder={targetRequirement?.placeholder || 'contoh: 12345678'}
                value={targetValue}
                onChange={(e) => handleSingleTargetChange(e.target.value)}
                className={`text-xs rounded-lg ${getInputStateClass(
                  gameTargetValidation.isValid,
                  gameTargetValidation.isEmpty
                )}`}
              />
              {!gameTargetValidation.isEmpty && !gameTargetValidation.isValid && (
                <p className="text-[10px] font-medium text-rose-600 pt-0.5">
                  {gameTargetValidation.error}
                </p>
              )}
            </div>

            {targetRequirement?.requiresZone && onTargetZoneChange && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                  <span>Server / Zone ID <span className="text-rose-500">*</span></span>
                  {gameZoneValidation && !gameZoneValidation.isEmpty && (
                    <span
                      className={`text-[10px] font-semibold ${
                        gameZoneValidation.isValid ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {gameZoneValidation.isValid ? '✓ Valid' : 'Format salah'}
                    </span>
                  )}
                </label>
                <Input
                  type="text"
                  required
                  placeholder={targetRequirement?.zonePlaceholder || 'contoh: 2685'}
                  value={targetZone}
                  onChange={(e) => handleSingleZoneChange(e.target.value)}
                  className={`text-xs rounded-lg ${getInputStateClass(
                    gameZoneValidation?.isValid ?? false,
                    gameZoneValidation?.isEmpty ?? true
                  )}`}
                />
                {gameZoneValidation && !gameZoneValidation.isEmpty && !gameZoneValidation.isValid && (
                  <p className="text-[10px] font-medium text-rose-600 pt-0.5">
                    {gameZoneValidation.error}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 3: CHECKBOX OPSI TUJUAN BERBEDA */}
      <div className="pt-1">
        <label className="flex items-start gap-3 p-3.5 sm:p-4 rounded-xl border border-[rgba(18,26,42,0.1)] bg-slate-50/70 hover:bg-slate-50 transition-colors cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isDifferentRecipient}
            onChange={(e) => onDifferentRecipientChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#C96F55] focus:ring-[#C96F55] cursor-pointer"
          />
          <div className="flex-1">
            <span className="text-xs sm:text-sm font-bold text-[#121A2A]">
              Kirim produk ke email/nomor berbeda?
            </span>
            <p className="text-[11px] text-[#121A2A]/60">
              Centang jika produk ini merupakan pesanan untuk orang lain (hadiah, teman, atau pesanan klien).
            </p>
          </div>
        </label>
      </div>

      {/* SECTION 4: CONDITIONAL SECTION — DATA PENERIMA BERBEDA (VISIBLE ONLY WHEN CHECKED) */}
      {isDifferentRecipient && (
        <div className="p-4 sm:p-5 rounded-xl border border-amber-200/80 bg-amber-50/25 space-y-4 animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-2 pb-2.5 border-b border-amber-200/60">
            <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0">
              <Gift className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#121A2A]">
                Data Tujuan Produk (Penerima Berbeda)
              </h3>
              <p className="text-[10px] sm:text-[11px] text-[#121A2A]/60">
                Kredensial atau lisensi akan dikirimkan ke kontak tujuan ini. Bukti invoice transaksi tetap dikirimkan ke kontak pemesan Anda.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nama Penerima */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#121A2A] flex items-center justify-between">
                <span>Nama Penerima <span className="text-[#C96F55]">*</span></span>
                <span className="text-[10px] text-[#121A2A]/50 font-normal">Identitas penerima produk</span>
              </label>
              <Input
                type="text"
                required
                placeholder="contoh: Ahmad Pratama"
                value={recipientName}
                onChange={(e) => onRecipientNameChange(e.target.value)}
                className="bg-white border-[rgba(18,26,42,0.12)] text-xs sm:text-sm font-medium rounded-lg text-[#121A2A] focus:border-[#C96F55]"
              />
            </div>

            {/* Email / Nomor WhatsApp Penerima */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#121A2A] flex items-center justify-between">
                <span>Email / Nomor WhatsApp Penerima <span className="text-[#C96F55]">*</span></span>
                {!recipientContactValidation.isEmpty && (
                  <span
                    className={`text-[10px] font-semibold ${
                      recipientContactValidation.isValid ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {recipientContactValidation.isValid ? '✓ Valid' : 'Format salah'}
                  </span>
                )}
              </label>
              <Input
                type="text"
                required
                placeholder="contoh: penerima@gmail.com atau 081234567890"
                value={recipientContact}
                onChange={(e) => onRecipientContactChange(e.target.value)}
                className={`text-xs sm:text-sm rounded-lg transition-all ${getInputStateClass(
                  recipientContactValidation.isValid,
                  recipientContactValidation.isEmpty
                )}`}
              />
              {!recipientContactValidation.isEmpty && !recipientContactValidation.isValid ? (
                <p className="text-[10px] font-medium text-rose-600 pt-0.5">
                  {recipientContactValidation.error}
                </p>
              ) : (
                <p className="text-[10px] text-[#121A2A]/50 pt-0.5">
                  Kredensial atau lisensi akan dikirimkan langsung ke kontak ini
                </p>
              )}
            </div>
          </div>

          {/* Multi-item override if cart has multiple items */}
          {isMultiItem && items && (
            <div className="space-y-2.5 pt-2 border-t border-amber-200/60">
              <span className="text-xs font-bold text-[#121A2A]">
                Tujuan Khusus Per Item ({items.length} Item dalam Keranjang)
              </span>
              <p className="text-[11px] text-[#121A2A]/60">
                Secara default seluruh produk dikirim ke kontak penerima di atas. Anda dapat mengisi tujuan spesifik per item jika berbeda:
              </p>
              <div className="space-y-2">
                {items.map((item, idx) => {
                  const key = `${item.id}_${idx}`;
                  const itState = itemTargets?.[key] || {
                    targetValue: '',
                    targetZone: '',
                    choiceMethod: 'whatsapp',
                  };
                  return (
                    <div
                      key={key}
                      className="p-3 rounded-lg bg-white border border-[rgba(18,26,42,0.08)] space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#121A2A]">
                          {idx + 1}. {item.name}
                        </span>
                        <span className="text-slate-500 font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.quantity}x
                        </span>
                      </div>
                      <Input
                        type="text"
                        placeholder={`Tujuan untuk ${item.name} (opsional, default: ${recipientContact || 'penerima di atas'})`}
                        value={itState.targetValue}
                        onChange={(e) => onItemTargetChange?.(key, 'targetValue', e.target.value)}
                        className="text-xs bg-slate-50/50 border-[rgba(18,26,42,0.1)] rounded-lg"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 5: CATATAN KHUSUS PESANAN */}
      <div className="space-y-1.5 pt-1 border-t border-[rgba(18,26,42,0.06)]">
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
  );
}
