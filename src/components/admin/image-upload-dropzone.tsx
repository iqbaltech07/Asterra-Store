'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  UploadCloud,
  ImageIcon,
  Loader2,
  Trash2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Link as LinkIcon,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ImageUploadDropzoneProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  description?: string;
  className?: string;
  disabled?: boolean;
}

const MAX_FILE_SIZE_MB = 10;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif'];

export function ImageUploadDropzone({
  value,
  onChange,
  folder = 'products',
  label = 'Banner / Gambar Produk',
  description = 'Tarik & lepas gambar ke sini, atau klik untuk memilih file.',
  className = '',
  disabled = false,
}: ImageUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active display image: prefers local preview during/right after upload, otherwise value
  const displayImage = localPreview || value;
  const isPrivateBlob = displayImage?.includes('/api/v1/media') || displayImage?.includes('blob.vercel-storage.com');

  useEffect(() => {
    setImgError(false);
  }, [value]);

  const uploadFile = useCallback(
    async (file: File) => {
      setUploadError(null);

      // Validate Type
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setUploadError('Format file tidak didukung. Harap unggah format JPG, PNG, WEBP, GIF, SVG, atau AVIF.');
        return;
      }

      // Validate Size
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setUploadError(`Ukuran file melebihi batas maksimal ${MAX_FILE_SIZE_MB}MB.`);
        return;
      }

      // Instant local preview
      const objectUrl = URL.createObjectURL(file);
      setLocalPreview(objectUrl);
      setImgError(false);
      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        const res = await fetch('/api/v1/admin/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Gagal mengunggah file ke Vercel Blob.');
        }

        // Use clean viewUrl (/api/v1/media/...)
        const finalUrl = data.data?.viewUrl || data.data?.url;
        onChange(finalUrl);

        // Keep local object preview briefly to avoid visual flicker while network fetches stream
        setTimeout(() => {
          setLocalPreview(null);
        }, 1500);
      } catch (err: unknown) {
        setLocalPreview(null);
        const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat mengunggah gambar.';
        setUploadError(msg);
      } finally {
        setIsUploading(false);
      }
    },
    [folder, onChange]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      uploadFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      uploadFile(file);
      e.target.value = '';
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled || isUploading) return;
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          uploadFile(file);
          break;
        }
      }
    }
  };

  const handleCopyUrl = () => {
    if (value && typeof window !== 'undefined') {
      navigator.clipboard.writeText(value);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleRemove = () => {
    setLocalPreview(null);
    setImgError(false);
    onChange('');
  };

  return (
    <div className={`space-y-2 ${className}`} onPaste={handlePaste}>
      {/* Label & Header Controls */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-primary" />
          <span>{label}</span>
        </label>
        <button
          type="button"
          onClick={() => setShowManualInput(!showManualInput)}
          className="text-[11px] text-foreground-muted hover:text-primary transition-colors flex items-center gap-1"
        >
          <LinkIcon className="w-3 h-3" />
          <span>{showManualInput ? 'Sembunyikan URL Manual' : 'Input URL Manual'}</span>
        </button>
      </div>

      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={handleFileInputChange}
        disabled={disabled || isUploading}
      />

      {/* Upload Error Alert */}
      {uploadError && (
        <div className="p-2.5 rounded-lg bg-status-error/10 border border-status-error/30 text-status-error text-xs flex items-start gap-2 animate-in fade-in-50">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">Gagal Mengunggah</span>
            <span>{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-status-error hover:opacity-70 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Image Preview State (When image URL exists) */}
      {displayImage ? (
        <div className="relative rounded-xl border border-border bg-surface-raised/40 p-3 space-y-3 transition-all hover:border-primary/40">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Thumbnail Box */}
            <div className="relative w-full sm:w-36 h-24 rounded-lg bg-surface border border-border/80 overflow-hidden shrink-0 group flex items-center justify-center">
              {!imgError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayImage}
                  alt="Preview Banner Produk"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="text-center p-2 text-foreground-muted text-[10px] space-y-1">
                  <ImageIcon className="w-6 h-6 mx-auto opacity-50 text-primary" />
                  <span className="block truncate max-w-[120px]">Gambar Baru Terpilih</span>
                </div>
              )}

              {/* Uploading Overlay */}
              {isUploading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-1.5 z-10">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-[10px] font-medium">Mengunggah...</span>
                </div>
              )}

              {/* Open in new tab overlay */}
              {!isUploading && (
                <a
                  href={displayImage}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1 text-[11px] font-medium"
                  title="Buka Gambar di Tab Baru"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Lihat</span>
                </a>
              )}
            </div>

            {/* Info & Action Controls */}
            <div className="flex-1 w-full space-y-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {isUploading ? (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 inline-flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Menyimpan ke Vercel Blob...</span>
                  </span>
                ) : isPrivateBlob ? (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-status-success/15 text-status-success border border-status-success/30 inline-flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Vercel Blob Private</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface-raised text-foreground-muted border border-border inline-flex items-center gap-1">
                    <LinkIcon className="w-3 h-3" />
                    <span>External URL</span>
                  </span>
                )}
                <span className="text-[10px] text-foreground-muted font-mono truncate max-w-[200px]">
                  {displayImage.split('/').pop()}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || isUploading}
                  className="h-7 text-xs gap-1.5 border-border hover:border-primary/50"
                >
                  <RefreshCw className="w-3 h-3 text-primary" />
                  <span>Ganti File</span>
                </Button>

                {value && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleCopyUrl}
                    className="h-7 text-xs gap-1.5 border-border"
                  >
                    {copySuccess ? <Check className="w-3 h-3 text-status-success" /> : <LinkIcon className="w-3 h-3" />}
                    <span>{copySuccess ? 'Tersalin' : 'Salin URL'}</span>
                  </Button>
                )}

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleRemove}
                  disabled={disabled || isUploading}
                  className="h-7 text-xs gap-1.5 text-status-error hover:bg-status-error/10 hover:text-status-error border-border hover:border-status-error/30"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Hapus</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Dropzone Box State */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 select-none ${
            isDragging
              ? 'border-primary bg-primary/10 scale-[1.01] shadow-md shadow-primary/10'
              : 'border-border/80 bg-surface-raised/40 hover:border-primary/50 hover:bg-surface-raised/70'
          } ${isUploading || disabled ? 'pointer-events-none opacity-80' : ''}`}
        >
          {isUploading ? (
            /* Uploading Active State */
            <div className="py-4 space-y-2.5">
              <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-foreground">
                  Mengunggah ke Vercel Blob (Private Mode)...
                </p>
                <p className="text-[11px] text-foreground-muted">
                  Memproses enkripsi dan streaming storage Vercel
                </p>
              </div>
              <div className="w-36 h-1 bg-surface-raised rounded-full mx-auto overflow-hidden">
                <div className="w-full h-full bg-primary animate-pulse" />
              </div>
            </div>
          ) : (
            /* Idle / Dragging State */
            <div className="space-y-2 py-2">
              <div
                className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center transition-transform duration-200 ${
                  isDragging
                    ? 'bg-primary text-white scale-110 animate-bounce'
                    : 'bg-primary/10 text-primary'
                }`}
              >
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">
                  <span className="text-primary hover:underline font-bold">Pilih gambar</span> atau seret & lepas ke sini
                </p>
                <p className="text-[11px] text-foreground-muted">
                  {description}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1 text-[10px] text-foreground-muted">
                <span className="px-1.5 py-0.5 rounded bg-surface border border-border">PNG</span>
                <span className="px-1.5 py-0.5 rounded bg-surface border border-border">JPG</span>
                <span className="px-1.5 py-0.5 rounded bg-surface border border-border">WEBP</span>
                <span className="px-1.5 py-0.5 rounded bg-surface border border-border">SVG</span>
                <span>• Maks {MAX_FILE_SIZE_MB}MB</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual URL Input Fallback (Toggleable) */}
      {showManualInput && (
        <div className="p-2.5 rounded-lg bg-surface border border-border space-y-1.5 animate-in slide-in-from-top-2">
          <label className="text-[11px] font-medium text-foreground-muted block">
            Direct Image URL (External / Manual)
          </label>
          <div className="flex gap-2">
            <Input
              type="url"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://... atau /api/v1/media/products/..."
              className="text-xs bg-surface-raised border-border font-mono flex-1 h-8"
              disabled={disabled || isUploading}
            />
            {value && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleRemove}
                className="h-8 text-xs px-2 text-foreground-muted hover:text-status-error"
                title="Kosongkan URL"
              >
                ✕
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
