'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCopy,
  faCheck,
  faEye,
  faEyeSlash,
  faArrowUpRightFromSquare,
} from '@fortawesome/free-solid-svg-icons';

export interface CredentialItem {
  label: string;
  value: string;
  type: 'email' | 'password' | 'link' | 'code' | 'text';
}

export function parseCredentialNote(raw?: string | null): CredentialItem[] {
  if (!raw) return [];
  const cleaned = raw.replace(/^\[SANDBOX TEST\]\s*(Akun Sukses Terkirim:\s*)?/i, '').trim();
  const items: CredentialItem[] = [];

  // Split by pipe or newline
  const parts = cleaned.split(/[|\n]+/).map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    // Check for KEY=VALUE or KEY: VALUE
    const kvMatch = part.match(/^([A-Za-z0-9_\s]+)[=:]\s*(.+)$/);
    if (kvMatch) {
      const key = kvMatch[1].trim();
      const val = kvMatch[2].trim();

      // Special case: AKUN= email—password or email:password
      if (/akun|account|user|login/i.test(key) && /[—:]/.test(val) && !val.startsWith('http')) {
        const subParts = val.split(/[—:]/).map((s) => s.trim());
        if (subParts.length === 2 && subParts[0].includes('@')) {
          items.push({ label: 'Email / Akun', value: subParts[0], type: 'email' });
          items.push({ label: 'Kata Sandi', value: subParts[1], type: 'password' });
          continue;
        }
      }

      let label = key;
      let type: CredentialItem['type'] = 'text';

      if (/pass|sandi|pin/i.test(key)) {
        label = 'Kata Sandi';
        type = 'password';
      } else if (/akun|email|user/i.test(key)) {
        label = 'Email / Akun';
        type = 'email';
      } else if (/ketentuan|link|panduan|url/i.test(key) || val.startsWith('http')) {
        label = 'Ketentuan & Panduan';
        type = 'link';
      } else if (/sn|serial|lisensi|kode|license/i.test(key)) {
        label = 'Kode Lisensi';
        type = 'code';
      }

      items.push({ label, value: val, type });
    } else {
      // Check if it has email—pass without explicit key
      if (part.includes('—') || (part.includes(':') && !part.startsWith('http'))) {
        const sep = part.includes('—') ? '—' : ':';
        const subParts = part.split(sep).map((s) => s.trim());
        if (subParts.length === 2 && subParts[0].includes('@')) {
          items.push({ label: 'Email / Akun', value: subParts[0], type: 'email' });
          items.push({ label: 'Kata Sandi', value: subParts[1], type: 'password' });
          continue;
        }
      }

      if (part.startsWith('http')) {
        items.push({ label: 'Ketentuan & Panduan', value: part, type: 'link' });
      } else {
        items.push({ label: 'Detail Lisensi', value: part, type: 'text' });
      }
    }
  }

  return items;
}

interface OrderCredentialsCardProps {
  rawNote: string;
  onNotification?: (msg: string) => void;
}

export function OrderCredentialsCard({
  rawNote,
  onNotification,
}: OrderCredentialsCardProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<Record<number, boolean>>({});

  const items = parseCredentialNote(rawNote);

  const handleCopy = (text: string, label: string, keyId: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedKey(keyId);
      if (onNotification) {
        onNotification(`${label} berhasil disalin!`);
      }
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const togglePasswordVisibility = (index: number) => {
    setShowPassword((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="rounded-md border border-border bg-muted/20 p-3.5 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border text-xs">
        <span className="font-medium text-foreground">
          Kredensial & Akses Lisensi
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded border border-emerald-600/30 bg-emerald-50 text-emerald-800 font-medium">
          Siap Digunakan
        </span>
      </div>

      {/* Structured Fields */}
      {items.length > 0 ? (
        <div className="space-y-2.5">
          {items.map((item, idx) => {
            const isPassword = item.type === 'password';
            const isLink = item.type === 'link';
            const isVisible = showPassword[idx];
            const displayValue = isPassword && !isVisible ? '••••••••••••' : item.value;
            const fieldKey = `field-${idx}`;
            const isCopied = copiedKey === fieldKey;

            return (
              <div key={idx} className="space-y-1">
                <label className="text-[11px] font-medium text-foreground-muted block">
                  {item.label}
                </label>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 min-w-0 flex items-center justify-between rounded-md border border-border bg-surface px-3 py-1.5 text-xs">
                    <span
                      className={`truncate select-all ${
                        isPassword || item.type === 'code' ? 'font-mono' : 'text-foreground font-medium' // taste-skill-ignore
                      }`}
                    >
                      {displayValue}
                    </span>

                    {/* Toggle password visibility */}
                    {isPassword && (
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(idx)}
                        className="ml-2 text-foreground-muted hover:text-foreground p-0.5 cursor-pointer shrink-0 transition-colors"
                        title={isVisible ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
                      >
                        <FontAwesomeIcon
                          icon={isVisible ? faEyeSlash : faEye}
                          className="w-3 h-3"
                        />
                      </button>
                    )}
                  </div>

                  {/* Copy Button for field */}
                  <button
                    type="button"
                    onClick={() => handleCopy(item.value, item.label, fieldKey)}
                    className="h-8 px-2.5 rounded-md border border-border bg-surface text-foreground hover:bg-muted text-[11px] font-medium flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                    title={`Salin ${item.label}`}
                  >
                    <FontAwesomeIcon
                      icon={isCopied ? faCheck : faCopy}
                      className={`w-3 h-3 ${isCopied ? 'text-emerald-600' : 'text-foreground-muted'}`}
                    />
                    <span>{isCopied ? 'Tersalin' : 'Salin'}</span>
                  </button>

                  {/* Open Link Button if URL */}
                  {isLink && (
                    <a
                      href={item.value}
                      target="_blank"
                      rel="noreferrer"
                      className="h-8 px-2.5 rounded-md border border-border bg-surface text-foreground hover:bg-muted text-[11px] font-medium flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                      title="Buka Tautan Panduan"
                    >
                      <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 h-3 text-foreground-muted" />
                      <span>Buka</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Fallback for raw format */
        <div className="relative">
          <pre className="text-xs text-foreground font-mono bg-surface p-3 rounded-md border border-border break-all select-all whitespace-pre-wrap leading-relaxed">
            {rawNote}
          </pre>
        </div>
      )}

      {/* Footer: Copy All Text Button + Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-border text-[11px] text-foreground-muted">
        <span>Simpan data ini dengan aman. Jangan berikan kredensial ini kepada pihak lain.</span>
        <button
          type="button"
          onClick={() => handleCopy(rawNote, 'Semua data lisensi', 'all')}
          className="text-foreground hover:underline font-medium cursor-pointer self-start sm:self-auto shrink-0 inline-flex items-center gap-1"
        >
          <FontAwesomeIcon icon={copiedKey === 'all' ? faCheck : faCopy} className="w-2.5 h-2.5 text-foreground-muted" />
          <span>{copiedKey === 'all' ? 'Semua Tersalin' : 'Salin Semua Teks'}</span>
        </button>
      </div>
    </div>
  );
}
