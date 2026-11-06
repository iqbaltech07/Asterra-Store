'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCloudArrowUp,
  faImage,
  faSpinner,
  faTrash,
  faArrowUpRightFromSquare,
  faTriangleExclamation,
  faLink,
  faShieldHalved,
  faCheck,
  faBolt,
  faFolderOpen,
  faMagnifyingGlass,
  faStar,
  faCircleCheck,
  faLayerGroup,
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { compressImageToWebP } from '@/lib/utils/image-compression';

export type UploadMode = 'eager' | 'lazy';

export interface StorageBanner {
  url: string;
  title: string;
  category?: string;
  fileName: string;
  source?: 'product' | 'promo' | 'static';
}

interface ImageUploadDropzoneProps {
  value: string;
  onChange: (url: string) => void;
  /** Callback to pass the pending File object to parent (lazy mode only) */
  onFileStaged?: (file: File | null) => void;
  folder?: string;
  label?: string;
  description?: string;
  className?: string;
  disabled?: boolean;
  /** Upload mode: 'eager' uploads immediately, 'lazy' defers to parent submit */
  mode?: UploadMode;
  productName?: string;
  productId?: string;
  isSpecialPromo?: boolean;
  onSpecialPromoChange?: (isPromo: boolean) => void;
  enableStoragePicker?: boolean;
  initialTab?: 'storage' | 'upload' | 'manual';
}

const MAX_FILE_SIZE_MB = 5;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif'];

/**
 * High-quality fallback storage banners from Asterra catalog
 * Ensures zero-breakage even during backend cold starts or static preview.
 */
const FALLBACK_STORAGE_BANNERS: StorageBanner[] = [
  {
    url: '/api/v1/media/products/chatgpt-go-3-bulan-sharing-akun-dari-asterrastore-a8d0c611ea56.webp',
    title: '3 Bulan ChatGpt Go Sharing (Akun Asterra)',
    category: 'AI Tools',
    fileName: 'chatgpt-go-3-bulan-sharing-akun-dari-asterrastore-a8d0c611ea56.webp',
    source: 'product',
  },
  {
    url: '/api/v1/media/products/chatgpt-plus-sharing-1-bulan-garansi-1-minggu-akun-a8d0c611ea56.webp',
    title: '1 Bulan ChatGPT Plus Sharing Garansi 1 Minggu',
    category: 'AI Tools',
    fileName: 'chatgpt-plus-sharing-1-bulan-garansi-1-minggu-akun-a8d0c611ea56.webp',
    source: 'product',
  },
  {
    url: '/api/v1/media/products/promo-google-ai-pro-private-18-bulan-sharing-garansi-1-b-c727644c549c.avif',
    title: 'Google AI Pro Private 18 Bulan SHARING',
    category: 'AI Tools',
    fileName: 'promo-google-ai-pro-private-18-bulan-sharing-garansi-1-b-c727644c549c.avif',
    source: 'product',
  },
  {
    url: '/api/v1/media/products/netflix-premium-shared-30-hari-1-profile-garansi-1-3aeee62229ca.webp',
    title: 'Netflix Premium Shared 30 Hari [1 Profile]',
    category: 'Apps & Streaming',
    fileName: 'netflix-premium-shared-30-hari-1-profile-garansi-1-3aeee62229ca.webp',
    source: 'product',
  },
  {
    url: '/api/v1/media/products/promo-youtube-premium-family-anggota-1-bulan-invite-gara-84678b1b9f93.webp',
    title: 'YouTube Premium Family Anggota 1 Bulan [Invite]',
    category: 'Apps & Streaming',
    fileName: 'promo-youtube-premium-family-anggota-1-bulan-invite-gara-84678b1b9f93.webp',
    source: 'product',
  },
  {
    url: '/api/v1/media/products/promo-youtube-famhead-1-bulan-private-akun-anda-84678b1b9f93.webp',
    title: 'YouTube Famhead 1 Bulan Private [Akun Anda]',
    category: 'Apps & Streaming',
    fileName: 'promo-youtube-famhead-1-bulan-private-akun-anda-84678b1b9f93.webp',
    source: 'product',
  },
  {
    url: '/api/v1/media/products/promo-apple-music-famhead-1-bulan-d0dab4364d6c.webp',
    title: 'Apple Music Famhead 1 Bulan',
    category: 'Apps & Streaming',
    fileName: 'promo-apple-music-famhead-1-bulan-d0dab4364d6c.webp',
    source: 'product',
  },
  {
    url: '/api/v1/media/products/zoom-30-hari-akun-dari-kami-d378dfa5e403.webp',
    title: 'Zoom Pro 30 Hari [Akun dari Kami]',
    category: 'Apps & Streaming',
    fileName: 'zoom-30-hari-akun-dari-kami-d378dfa5e403.webp',
    source: 'product',
  },
  {
    url: '/api/v1/media/products/Katalog_Product_-_VIU_Private-1790813990437-t6EVARTYXg9O8KtKcEKPmNV7seS4zW.jpg',
    title: 'Viu Premium Private 1 Tahun [1 Device]',
    category: 'Apps & Streaming',
    fileName: 'Katalog_Product_-_VIU_Private-1790813990437-t6EVARTYXg9O8KtKcEKPmNV7seS4zW.jpg',
    source: 'product',
  },
  {
    url: '/api/v1/media/products/Katalog_Product_-_WeTV_Private-1790812187844-5Lc9stzGa22TthvhxEgjiUjqYmXuvt.png',
    title: 'WeTV VIP Private 1 Bulan',
    category: 'Apps & Streaming',
    fileName: 'Katalog_Product_-_WeTV_Private-1790812187844-5Lc9stzGa22TthvhxEgjiUjqYmXuvt.png',
    source: 'product',
  },
  {
    url: '/api/v1/media/products/Katalog_Product_-_BStation-1790810319252-8d1kQE6USsiBRvp16leSM1d1axOLAT.png',
    title: 'Bstation Premium Shared 1 Bulan [1 Device]',
    category: 'Apps & Streaming',
    fileName: 'Katalog_Product_-_BStation-1790810319252-8d1kQE6USsiBRvp16leSM1d1axOLAT.png',
    source: 'product',
  },
  {
    url: '/images/banners/capcut-banner.png',
    title: 'CapCut Pro Shared 1 Bulan [1 Device]',
    category: 'Editing App',
    fileName: 'capcut-banner.png',
    source: 'static',
  },
  {
    url: '/api/v1/media/products/canva-pro-1790681634749-dstgTfzHEgTz1vMwWLLEvKhdrLKGaS.png',
    title: 'Canva Pro Private 1 Bulan',
    category: 'Editing App',
    fileName: 'canva-pro-1790681634749-dstgTfzHEgTz1vMwWLLEvKhdrLKGaS.png',
    source: 'product',
  },
  {
    url: '/api/v1/media/products/canva-edu-1790683491210-zvlx2s4T06sZ9ViESIKTka0UHKh1RU.png',
    title: 'Canva Education 1 Tahun',
    category: 'Editing App',
    fileName: 'canva-edu-1790683491210-zvlx2s4T06sZ9ViESIKTka0UHKh1RU.png',
    source: 'product',
  },
  {
    url: '/api/v1/media/products/Katalog_Product_-_Alightmotion-1790809215551-BajDHkbPKZkpqRPNRfPGh5ts7D9GN8.jpeg',
    title: 'Alight Motion Pro Private 1 Tahun',
    category: 'Editing App',
    fileName: 'Katalog_Product_-_Alightmotion-1790809215551-BajDHkbPKZkpqRPNRfPGh5ts7D9GN8.jpeg',
    source: 'product',
  },
  {
    url: '/api/v1/media/products/promo-wink-vip-private-hari-tidak-ada-garansi-1x-5a0de55778b5.webp',
    title: 'Wink VIP+ Private 7 Hari',
    category: 'Editing App',
    fileName: 'promo-wink-vip-private-hari-tidak-ada-garansi-1x-5a0de55778b5.webp',
    source: 'product',
  },
  {
    url: '/api/v1/media/products/meitu-vip-private-7-hari-tidak-ada-garansi-1x-78ac516f07d2.webp',
    title: 'Meitu VIP+ Private 7 Hari',
    category: 'Editing App',
    fileName: 'meitu-vip-private-7-hari-tidak-ada-garansi-1x-78ac516f07d2.webp',
    source: 'product',
  },
  {
    url: '/api/v1/media/banners/promo-welcome-banner-5fce33b1a833.webp',
    title: 'Welcome Promo Banner Asterra',
    category: 'Promo Banner',
    fileName: 'promo-welcome-banner-5fce33b1a833.webp',
    source: 'promo',
  },
  {
    url: '/images/banners/hero-banner-reseller.webp',
    title: 'Banner VIP Reseller',
    category: 'Aset Resmi',
    fileName: 'hero-banner-reseller.webp',
    source: 'static',
  },
];

/**
 * Uploads a file to Vercel Blob via the admin upload API.
 */
export async function uploadFileToBlob(
  file: File,
  folder: string = 'products',
  productName?: string,
  productId?: string,
  isSpecialPromo?: boolean
): Promise<{ viewUrl: string; url: string; pathname: string; deduplicated: boolean }> {
  const compressed = await compressImageToWebP(file);

  const formData = new FormData();
  formData.append('file', compressed);
  formData.append('folder', folder);
  if (productName) formData.append('productName', productName);
  if (productId) formData.append('productId', productId);
  if (isSpecialPromo) formData.append('isSpecialPromo', 'true');

  const res = await fetch('/api/v1/admin/upload', {
    method: 'POST',
    body: formData,
  });

  let data: {
    success?: boolean;
    url?: string;
    viewUrl?: string;
    detail?: string;
    error?: string;
    message?: string;
    data?: {
      viewUrl?: string;
      url?: string;
      pathname?: string;
      deduplicated?: boolean;
    };
  } = {};
  try {
    data = await res.json();
  } catch {
    data = { error: `Server response error (${res.status} ${res.statusText})` };
  }

  if (!res.ok || !data.success) {
    const errMsg = data.detail || data.error || data.message || `Gagal mengunggah file (Status ${res.status}).`;
    throw new Error(errMsg);
  }

  return {
    viewUrl: data.data?.viewUrl || data.url || '',
    url: data.data?.url || data.url || '',
    pathname: data.data?.pathname || '',
    deduplicated: data.data?.deduplicated ?? false,
  };
}

export function ImageUploadDropzone({
  value,
  onChange,
  onFileStaged,
  folder = 'products',
  label = 'Banner / Gambar Produk',
  description = 'Tarik & lepas gambar ke sini, atau klik untuk memilih file.',
  className = '',
  disabled = false,
  mode = 'eager',
  productName,
  productId,
  isSpecialPromo = false,
  onSpecialPromoChange,
  enableStoragePicker = folder === 'products' || folder === 'banners',
  initialTab,
}: ImageUploadDropzoneProps) {
  // Tab Mode
  const [activeTab, setActiveTab] = useState<'storage' | 'upload' | 'manual'>(() => {
    if (initialTab) return initialTab;
    if (enableStoragePicker) return 'storage';
    return 'upload';
  });

  // Storage Banner State
  const [storageBanners, setStorageBanners] = useState<StorageBanner[]>(FALLBACK_STORAGE_BANNERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoadingBanners, setIsLoadingBanners] = useState(false);

  // Upload & Drag State
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch live storage banners from backend
  useEffect(() => {
    if (!enableStoragePicker) return;
    let isMounted = true;
    async function fetchBanners() {
      setIsLoadingBanners(true);
      try {
        const res = await fetch('/api/v1/admin/storage-banners');
        if (!res.ok) return;
        const json = await res.json();
        if (isMounted && json.success && Array.isArray(json.data) && json.data.length > 0) {
          setStorageBanners(json.data);
        }
      } catch {
        // Fallback already in place
      } finally {
        if (isMounted) setIsLoadingBanners(false);
      }
    }
    fetchBanners();
    return () => {
      isMounted = false;
    };
  }, [enableStoragePicker]);

  // Active display image: local staged preview takes priority, otherwise value
  const displayImage = localPreview || value;
  const isPrivateBlob = displayImage?.includes('/api/v1/media') || displayImage?.includes('blob.vercel-storage.com');
  const isDefaultBanner = displayImage?.includes('default-product-banner');

  // Check if current value matches a known storage banner
  const matchedStorageBanner = useMemo(() => {
    if (!displayImage) return null;
    return storageBanners.find((b) => b.url === displayImage) || null;
  }, [displayImage, storageBanners]);

  useEffect(() => {
    setImgError(false);
    setImageLoaded(false);
  }, [displayImage]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (localPreview && localPreview.startsWith('blob:')) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

  // Categories list for chips filter
  const categories = useMemo(() => {
    const cats = new Set<string>();
    storageBanners.forEach((b) => {
      if (b.category) cats.add(b.category);
    });
    return ['all', ...Array.from(cats)];
  }, [storageBanners]);

  // Filtered storage banners
  const filteredBanners = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return storageBanners.filter((b) => {
      const matchCat = selectedCategory === 'all' || b.category?.toLowerCase() === selectedCategory.toLowerCase();
      if (!matchCat) return false;
      if (!q) return true;
      return (
        b.title.toLowerCase().includes(q) ||
        (b.category && b.category.toLowerCase().includes(q)) ||
        b.fileName.toLowerCase().includes(q)
      );
    });
  }, [storageBanners, searchQuery, selectedCategory]);

  const handleSelectStorageBanner = (banner: StorageBanner) => {
    if (disabled) return;
    if (localPreview && localPreview.startsWith('blob:')) {
      URL.revokeObjectURL(localPreview);
    }
    setLocalPreview(null);
    setUploadError(null);
    setImgError(false);
    onFileStaged?.(null);
    onChange(banner.url);
  };

  const handleTriggerFileInput = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (disabled || isUploading || isCompressing) return;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const processFile = useCallback(
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

      if (mode === 'lazy') {
        // --- LAZY MODE ---
        setIsCompressing(true);
        try {
          const compressed = await compressImageToWebP(file);
          onFileStaged?.(compressed);
        } catch {
          setUploadError('Gagal mengompres gambar.');
        } finally {
          setIsCompressing(false);
        }
        return;
      }

      // --- EAGER MODE ---
      setIsUploading(true);
      try {
        const result = await uploadFileToBlob(file, folder, productName, productId, isSpecialPromo);
        onChange(result.viewUrl);
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
    [folder, onChange, onFileStaged, mode, productName, productId, isSpecialPromo]
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
      processFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
    e.target.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled || isUploading) return;
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          processFile(file);
          break;
        }
      }
    }
  };

  const handleCopyUrl = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const urlToCopy = value || displayImage;
    if (!urlToCopy || typeof window === 'undefined') return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(urlToCopy);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = urlToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.warn('Gagal menyalin URL ke clipboard:', err);
    }
  };

  const handleRemove = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (localPreview && localPreview.startsWith('blob:')) {
      URL.revokeObjectURL(localPreview);
    }
    setLocalPreview(null);
    setImgError(false);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileStaged?.(null);
    onChange('');
  };

  const isBusy = isUploading || isCompressing;

  return (
    <div className={`space-y-3 ${className}`} onPaste={handlePaste}>
      {/* Label & Top Header */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <FontAwesomeIcon icon={faImage} className="w-3.5 h-3.5 text-primary" />
          <span>{label}</span>
          {mode === 'lazy' && (
            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 inline-flex items-center gap-0.5">
              <FontAwesomeIcon icon={faBolt} className="w-2.5 h-2.5" />
              <span>Upload saat Simpan</span>
            </span>
          )}
        </label>
        {enableStoragePicker && (
          <span className="text-[11px] text-foreground-muted flex items-center gap-1">
            <FontAwesomeIcon icon={faLayerGroup} className="w-3 h-3 text-primary/70" />
            <span>{storageBanners.length} Banner di Storage</span>
          </span>
        )}
      </div>

      {/* Upload Error Alert */}
      {uploadError && (
        <div className="p-2.5 rounded-lg bg-status-error/10 border border-status-error/30 text-status-error text-xs flex items-start gap-2 animate-in fade-in-50">
          <FontAwesomeIcon icon={faTriangleExclamation} className="w-4 h-4 shrink-0 mt-0.5" />
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

      {/* Active Selected Banner Preview Card (Always visible when banner is selected) */}
      {displayImage && (
        <div className="relative rounded-xl border border-border bg-surface-raised/40 p-3 space-y-2.5 transition-all hover:border-primary/40 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Thumbnail Box */}
            <div
              onClick={() => setActiveTab(enableStoragePicker ? 'storage' : 'upload')}
              className="relative w-full sm:w-36 h-22 rounded-lg bg-surface border border-border/80 overflow-hidden shrink-0 group flex items-center justify-center cursor-pointer"
              title="Klik untuk memilih atau mengganti banner"
            >
              {!imgError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayImage}
                  alt="Preview Banner"
                  onLoad={() => setImageLoaded(true)}
                  className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-200 ${
                    imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                  }`}
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="text-center p-2 text-foreground-muted text-[10px] space-y-1">
                  <FontAwesomeIcon icon={faImage} className="w-6 h-6 mx-auto opacity-50 text-primary" />
                  <span className="block truncate max-w-[120px]">Gambar Terpilih</span>
                </div>
              )}

              {/* Busy Overlay */}
              {isBusy && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-1.5 z-10">
                  <FontAwesomeIcon icon={faSpinner} className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-[10px] font-medium">
                    {isCompressing ? 'Mengompres...' : 'Mengunggah...'}
                  </span>
                </div>
              )}

              {/* Hover Overlay */}
              {!isBusy && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
                  <a
                    href={displayImage}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-md bg-white/20 hover:bg-white/30 text-white text-[11px] font-medium flex items-center gap-1 transition-colors"
                    title="Buka Gambar di Tab Baru"
                  >
                    <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Info & Action Row */}
            <div className="flex-1 w-full space-y-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {isBusy ? (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 inline-flex items-center gap-1">
                    <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 animate-spin" />
                    <span>{isCompressing ? 'Mengompres...' : 'Menyimpan ke Storage...'}</span>
                  </span>
                ) : mode === 'lazy' && localPreview ? (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/30 inline-flex items-center gap-1">
                    <FontAwesomeIcon icon={faBolt} className="w-3 h-3" />
                    <span>File Lokal Baru (Siap Upload)</span>
                  </span>
                ) : matchedStorageBanner ? (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-status-success/15 text-status-success border border-status-success/30 inline-flex items-center gap-1">
                    <FontAwesomeIcon icon={faCircleCheck} className="w-3 h-3" />
                    <span>Storage Asterra (Anti-Redundan)</span>
                  </span>
                ) : isPrivateBlob ? (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 inline-flex items-center gap-1">
                    <FontAwesomeIcon icon={faShieldHalved} className="w-3.5 h-3.5" />
                    <span>Vercel Blob Private</span>
                  </span>
                ) : isDefaultBanner ? (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface-raised text-foreground-muted border border-border inline-flex items-center gap-1">
                    <FontAwesomeIcon icon={faImage} className="w-3 h-3" />
                    <span>Banner Default Asterra</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface-raised text-foreground-muted border border-border inline-flex items-center gap-1">
                    <FontAwesomeIcon icon={faLink} className="w-3 h-3" />
                    <span>External URL</span>
                  </span>
                )}

                {matchedStorageBanner && (
                  <span className="text-[10px] font-semibold text-foreground px-2 py-0.5 rounded bg-surface border border-border">
                    {matchedStorageBanner.title}
                  </span>
                )}

                <span className="text-[10px] text-foreground-muted font-mono truncate max-w-[180px]">
                  {displayImage.split('/').pop()}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {enableStoragePicker && (
                  <Button
                    type="button"
                    size="sm"
                    variant={activeTab === 'storage' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('storage')}
                    disabled={disabled || isBusy}
                    className="h-7 text-xs gap-1.5 cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faFolderOpen} className="w-3 h-3" />
                    <span>Pilih dari Storage</span>
                  </Button>
                )}

                <Button
                  type="button"
                  size="sm"
                  variant={activeTab === 'upload' ? 'default' : 'outline'}
                  onClick={() => {
                    setActiveTab('upload');
                    handleTriggerFileInput();
                  }}
                  disabled={disabled || isBusy}
                  className="h-7 text-xs gap-1.5 cursor-pointer"
                >
                  <FontAwesomeIcon icon={faCloudArrowUp} className="w-3 h-3" />
                  <span>Upload File Baru</span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleCopyUrl}
                  className="h-7 text-xs gap-1.5 border-border cursor-pointer"
                >
                  {copySuccess ? (
                    <FontAwesomeIcon icon={faCheck} className="w-3 h-3 text-status-success" />
                  ) : (
                    <FontAwesomeIcon icon={faLink} className="w-3 h-3" />
                  )}
                  <span>{copySuccess ? 'Tersalin' : 'Salin URL'}</span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleRemove}
                  disabled={disabled || isBusy}
                  className="h-7 text-xs gap-1.5 text-status-error hover:bg-status-error/10 hover:text-status-error border-border hover:border-status-error/30 cursor-pointer"
                  title="Hapus banner terpilih"
                >
                  <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                  <span>Hapus</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode Selector Tabs (Storage vs Upload vs URL) */}
      <div className="flex items-center gap-1.5 p-1 bg-surface-raised rounded-xl border border-border">
        {enableStoragePicker && (
          <button
            type="button"
            onClick={() => setActiveTab('storage')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'storage'
                ? 'bg-white text-primary shadow-xs border border-border/80'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            <FontAwesomeIcon icon={faFolderOpen} className="w-3.5 h-3.5" />
            <span>Pilih dari Storage</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-bold">
              {storageBanners.length}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'upload'
              ? 'bg-white text-primary shadow-xs border border-border/80'
              : 'text-foreground-muted hover:text-foreground'
          }`}
        >
          <FontAwesomeIcon icon={faCloudArrowUp} className="w-3.5 h-3.5" />
          <span>Upload File Baru</span>
          {isSpecialPromo && (
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-600 font-bold">
              Promo
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'manual'
              ? 'bg-white text-primary shadow-xs border border-border/80'
              : 'text-foreground-muted hover:text-foreground'
          }`}
        >
          <FontAwesomeIcon icon={faLink} className="w-3.5 h-3.5" />
          <span>Input URL Manual</span>
        </button>
      </div>

      {/* Accessible Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="sr-only"
        tabIndex={-1}
        onChange={handleFileInputChange}
        disabled={disabled || isBusy}
      />

      {/* TAB 1: STORAGE BANNER PICKER */}
      {enableStoragePicker && activeTab === 'storage' && (
        <div className="rounded-xl border border-border bg-surface p-3 space-y-3 animate-in fade-in-50 duration-150">
          {/* Header & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 justify-between">
            <div className="relative flex-1">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="w-3.5 h-3.5 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2"
              />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari banner (misal: ChatGPT, Netflix, Canva, Viu)..."
                className="pl-8.5 h-8 text-xs bg-surface-raised border-border"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="text-[11px] text-foreground-muted shrink-0 flex items-center gap-1 px-1">
              <span>Menampilkan:</span>
              <strong className="text-foreground">{filteredBanners.length}</strong>
              <span>banner</span>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            {categories.map((cat) => {
              const count =
                cat === 'all'
                  ? storageBanners.length
                  : storageBanners.filter((b) => b.category?.toLowerCase() === cat.toLowerCase()).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer border ${
                    selectedCategory.toLowerCase() === cat.toLowerCase()
                      ? 'bg-primary text-white border-primary font-medium'
                      : 'bg-surface-raised text-foreground-muted border-border hover:text-foreground'
                  }`}
                >
                  {cat === 'all' ? 'Semua Banner' : cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Storage Banners Grid */}
          {isLoadingBanners ? (
            <div className="py-10 text-center space-y-2 text-foreground-muted">
              <FontAwesomeIcon icon={faSpinner} className="w-5 h-5 animate-spin text-primary" />
              <p className="text-xs">Memuat daftar banner storage...</p>
            </div>
          ) : filteredBanners.length === 0 ? (
            <div className="py-8 text-center space-y-2 text-foreground-muted border border-dashed rounded-lg bg-surface-raised/30">
              <FontAwesomeIcon icon={faImage} className="w-6 h-6 opacity-40 mx-auto text-primary" />
              <p className="text-xs font-semibold text-foreground">Tidak ada banner yang cocok</p>
              <p className="text-[11px]">
                Coba gunakan kata kunci lain, atau beralih ke tab <strong>Upload File Baru</strong>.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="h-7 text-xs mt-1"
              >
                Reset Filter
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
              {filteredBanners.map((banner) => {
                const isSelected = displayImage === banner.url;
                return (
                  <div
                    key={banner.url}
                    onClick={() => handleSelectStorageBanner(banner)}
                    className={`group relative rounded-lg border overflow-hidden transition-all duration-150 cursor-pointer flex flex-col bg-surface ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20 shadow-sm bg-primary/5'
                        : 'border-border/80 hover:border-primary/60 hover:shadow-xs'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video w-full bg-surface-raised overflow-hidden relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={banner.url}
                        alt={banner.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />

                      {/* Selected Badge */}
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1">
                          <FontAwesomeIcon icon={faCheck} className="w-2.5 h-2.5" />
                          <span>Terpilih</span>
                        </div>
                      )}

                      {/* Category Pill */}
                      {banner.category && (
                        <div className="absolute bottom-1 left-1 bg-black/70 backdrop-blur-xs text-white text-[9px] px-1.5 py-0.5 rounded font-medium truncate max-w-[85%]">
                          {banner.category}
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="p-2 space-y-0.5 flex-1 flex flex-col justify-between">
                      <p className="text-[11px] font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {banner.title}
                      </p>
                      <p className="text-[9px] text-foreground-muted font-mono truncate">
                        {banner.fileName}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-1 flex items-center justify-between text-[11px] text-foreground-muted border-t border-border/60">
            <span>💡 Pilih banner yang sudah ada untuk menghemat kuota dan memangkas waktu load.</span>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className="text-primary hover:underline font-semibold"
            >
              Upload Baru →
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: UPLOAD FILE BARU / SPECIAL PROMO */}
      {activeTab === 'upload' && (
        <div className="space-y-3 animate-in fade-in-50 duration-150">
          {/* Promo Special Option Checkbox */}
          {onSpecialPromoChange && (
            <div className="p-3 rounded-xl border border-amber-500/25 bg-amber-500/5 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="special-promo-toggle"
                checked={isSpecialPromo}
                onChange={(e) => onSpecialPromoChange(e.target.checked)}
                className="mt-0.5 rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
              />
              <label htmlFor="special-promo-toggle" className="text-xs cursor-pointer select-none space-y-0.5 flex-1">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faStar} className="w-3 h-3 text-amber-500" />
                  <span>Upload sebagai Banner Promo Khusus (Event / Promo Terbatas)</span>
                </span>
                <p className="text-[11px] text-foreground-muted leading-relaxed">
                  File otomatis disimpan dengan penanda promo (prefix promo-) dan diutamakan pada display carousel event promosi.
                </p>
              </label>
            </div>
          )}

          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleTriggerFileInput}
            className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 select-none ${
              isDragging
                ? 'border-primary bg-primary/10 scale-[1.01] shadow-md shadow-primary/10'
                : 'border-border/80 bg-surface-raised/40 hover:border-primary/50 hover:bg-surface-raised/70'
            } ${isBusy || disabled ? 'pointer-events-none opacity-80' : ''}`}
          >
            {isBusy ? (
              <div className="py-4 space-y-2.5">
                <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <FontAwesomeIcon icon={faSpinner} className="w-5 h-5 animate-spin" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-foreground">
                    {isCompressing
                      ? 'Mengompres gambar ke format WebP...'
                      : 'Mengunggah ke Vercel Blob (Private Mode)...'}
                  </p>
                  <p className="text-[11px] text-foreground-muted">
                    {isCompressing
                      ? 'Mengoptimalkan ukuran untuk hemat storage'
                      : 'Memproses enkripsi dan streaming storage Vercel'}
                  </p>
                </div>
                <div className="w-36 h-1 bg-surface-raised rounded-full mx-auto overflow-hidden">
                  <div className="w-full h-full bg-primary animate-pulse" />
                </div>
              </div>
            ) : (
              <div className="space-y-2 py-2">
                <div
                  className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center transition-transform duration-200 ${
                    isDragging
                      ? 'bg-primary text-white scale-110 animate-bounce'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  <FontAwesomeIcon icon={faCloudArrowUp} className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-foreground">
                    <span className="text-primary hover:underline font-bold">Pilih file gambar</span> atau seret & lepas ke sini
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
        </div>
      )}

      {/* TAB 3: INPUT URL MANUAL */}
      {activeTab === 'manual' && (
        <div className="p-3 rounded-xl bg-surface border border-border space-y-2 animate-in fade-in-50 duration-150">
          <label className="text-[11px] font-semibold text-foreground block">
            Direct Image URL (External / Link Gambar Langsung)
          </label>
          <div className="flex gap-2">
            <Input
              type="url"
              value={value}
              onChange={(e) => {
                if (localPreview && localPreview.startsWith('blob:')) {
                  URL.revokeObjectURL(localPreview);
                }
                setLocalPreview(null);
                setImgError(false);
                onFileStaged?.(null);
                onChange(e.target.value);
              }}
              placeholder="https://... atau /api/v1/media/products/..."
              className="text-xs bg-surface-raised border-border font-mono flex-1 h-8"
              disabled={disabled || isBusy}
            />
            {value && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleRemove}
                className="h-8 text-xs px-2.5 text-foreground-muted hover:text-status-error cursor-pointer"
                title="Kosongkan URL"
              >
                ✕
              </Button>
            )}
          </div>
          <p className="text-[10px] text-foreground-muted">
            Tempelkan link gambar eksternal atau path media internal. Preview akan otomatis diperbarui di atas.
          </p>
        </div>
      )}
    </div>
  );
}
