'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Check, RefreshCw, X, Globe, Sparkles, ExternalLink, ShieldCheck, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface BrandfetchBrand {
  name: string;
  domain: string;
  icon?: string;
  brandId?: string;
  claimed?: boolean;
  verified?: boolean;
  score?: number;
}

interface BrandLogoSelectorProps {
  value?: string;
  brandName?: string;
  productName?: string;
  onChange: (url: string, brand?: string) => void;
  disabled?: boolean;
}

const POPULAR_BRANDS = [
  { name: 'Canva', url: '/api/v1/media/brand-icons/canva', query: 'canva' },
  { name: 'Netflix', url: '/api/v1/media/brand-icons/netflix', query: 'netflix' },
  { name: 'Spotify', url: '/api/v1/media/brand-icons/spotify', query: 'spotify' },
  { name: 'ChatGPT', url: '/api/v1/media/brand-icons/chatgpt', query: 'chatgpt' },
  { name: 'Google Gemini', url: '/api/v1/media/brand-icons/gemini', query: 'google' },
  { name: 'CapCut', url: '/api/v1/media/brand-icons/capcut', query: 'capcut' },
  { name: 'YouTube', url: '/api/v1/media/brand-icons/youtube', query: 'youtube' },
  { name: 'Disney+', url: '/api/v1/media/brand-icons/disney', query: 'disney' },
  { name: 'Vidio', url: '/api/v1/media/brand-icons/vidio', query: 'vidio' },
  { name: 'Viu', url: '/api/v1/media/brand-icons/viu', query: 'viu' },
  { name: 'WeTV', url: '/api/v1/media/brand-icons/wetv', query: 'wetv' },
  { name: 'Adobe', url: '/api/v1/media/brand-icons/adobe', query: 'adobe' },
  { name: 'Claude AI', url: '/api/v1/media/brand-icons/claude', query: 'claude' },
  { name: 'Midjourney', url: '/api/v1/media/brand-icons/midjourney', query: 'midjourney' },
];

export function BrandLogoSelector({
  value,
  brandName,
  productName,
  onChange,
  disabled = false,
}: BrandLogoSelectorProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<BrandfetchBrand[]>([]);
  const [isCustomUrlMode, setIsCustomUrlMode] = useState(false);
  const [customUrl, setCustomUrl] = useState(value || '');
  const [hasSearched, setHasSearched] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [selectedBrandInfo, setSelectedBrandInfo] = useState<{ name: string; domain?: string } | null>(
    brandName ? { name: brandName } : null
  );

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert('Ukuran file maksimal 3MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onChange(dataUrl, brandName);
        setCustomUrl(dataUrl);
        setImageError(false);
      }
    };
    reader.readAsDataURL(file);
    // Reset file input so re-selecting same file triggers change
    e.target.value = '';
  };

  // Sync initial customUrl with value prop
  useEffect(() => {
    setCustomUrl(value || '');
    setImageError(false);
    if (brandName) {
      setSelectedBrandInfo({ name: brandName });
    }
  }, [value, brandName]);

  // Initial suggested search based on product name if no value
  useEffect(() => {
    if (!value && productName && !query) {
      const firstWord = productName.trim().split(/\s+/)[0];
      if (firstWord && firstWord.length >= 3) {
        setQuery(firstWord);
      }
    }
  }, [productName, value]);

  const performSearch = async (searchQuery: string) => {
    const q = searchQuery.trim();
    if (!q) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/v1/brands/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setResults(json.data);
        } else {
          setResults([]);
        }
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (!val.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(val);
    }, 350);
  };

  const handleSelectBrand = (brand: BrandfetchBrand) => {
    if (!brand.icon) return;
    onChange(brand.icon, brand.name);
    setSelectedBrandInfo({ name: brand.name, domain: brand.domain });
    setCustomUrl(brand.icon);
    setImageError(false);
    setResults([]);
    setQuery('');
  };

  const handleSelectPopularBrand = (b: typeof POPULAR_BRANDS[0]) => {
    onChange(b.url, b.name);
    setSelectedBrandInfo({ name: b.name });
    setCustomUrl(b.url);
    setImageError(false);
  };

  const handleClear = () => {
    onChange('');
    setSelectedBrandInfo(null);
    setCustomUrl('');
    setQuery('');
    setResults([]);
    setImageError(false);
  };

  const handleApplyCustomUrl = () => {
    const trimmed = customUrl.trim();
    onChange(trimmed);
    setImageError(false);
    setIsCustomUrlMode(false);
  };

  const isCurrentValueSelected = Boolean(value);

  // Fallback initial
  const displayTitle = selectedBrandInfo?.name || brandName || productName || 'Logo Terpilih';
  const displayInitial = displayTitle.slice(0, 2).toUpperCase();

  return (
    <div className="space-y-3 bg-slate-50 border border-slate-200/90 rounded-xl p-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <label className="text-xs font-bold text-[#0F172A] block">
              Logo Resmi Brand (Brandfetch API & Cloud Icons)
            </label>
            <span className="text-[10px] text-[#64748B]">
              Pilih icon resmi resolusi tinggi otomatis tersimpan ke data produk
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20"
          >
            <Upload className="w-3 h-3" />
            <span>Upload File</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCustomUrlMode(!isCustomUrlMode)}
            className="text-[11px] text-slate-600 hover:text-primary hover:underline font-medium cursor-pointer"
          >
            {isCustomUrlMode ? '← Cari Brandfetch' : 'Input URL'}
          </button>
        </div>
      </div>

      {/* Mode 1: Manual URL */}
      {isCustomUrlMode ? (
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="/api/v1/media/brand-icons/... atau URL gambar"
              value={customUrl}
              onChange={(e) => {
                setCustomUrl(e.target.value);
                // Also trigger live change
                onChange(e.target.value.trim());
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleApplyCustomUrl();
                }
              }}
              className="text-xs h-9 bg-white border-slate-300 flex-1 font-mono text-[#0F172A]"
            />
            <Button
              type="button"
              onClick={handleApplyCustomUrl}
              size="sm"
              className="h-9 text-xs px-3 font-semibold cursor-pointer"
            >
              Terapkan
            </Button>
          </div>
          <p className="text-[10px] text-[#64748B]">
            Format yang didukung: WebP, PNG, SVG (contoh: <code className="text-[10px] bg-slate-200 px-1 py-0.5 rounded">/api/v1/media/brand-icons/canva</code> atau link CDN).
          </p>
        </div>
      ) : (
        /* Mode 2: Brandfetch Live Search */
        <div className="space-y-2.5">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Cari brand (contoh: Canva, Netflix, Spotify, ChatGPT, Gemini)..."
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              disabled={disabled}
              className="pl-8 pr-8 text-xs h-9 bg-white border-slate-300 text-[#0F172A]"
            />
            {isSearching ? (
              <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
            ) : query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setResults([]);
                }}
                className="w-3.5 h-3.5 text-[#64748B] hover:text-[#0F172A] absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>

          {/* Quick Popular Brand Pills */}
          {!query && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-[#64748B] font-medium block">
                Brand Populer Cepat (1-Klik Pilih):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_BRANDS.map((b) => (
                  <button
                    key={b.name}
                    type="button"
                    onClick={() => handleSelectPopularBrand(b)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium border transition-colors shadow-2xs cursor-pointer ${
                      value === b.url
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white hover:bg-primary/10 hover:text-primary border-slate-200 text-slate-600'
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results Dropdown / Grid */}
          {results.length > 0 && (
            <div className="space-y-1.5 max-h-56 overflow-y-auto p-1.5 bg-white border border-primary/30 rounded-xl shadow-lg dark-scrollbar animate-in fade-in slide-in-from-top-1">
              <span className="text-[10px] font-semibold text-primary px-2 block">
                Hasil Pencarian Brandfetch ({results.length}):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {results.map((brand, idx) => {
                  const isSelected = value === brand.icon;
                  return (
                    <button
                      key={`${brand.domain}-${idx}`}
                      type="button"
                      onClick={() => handleSelectBrand(brand)}
                      className={`p-2 rounded-lg border text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-xs'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                          {brand.icon ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={brand.icon}
                              alt={brand.name}
                              className="w-full h-full object-contain"
                              loading="lazy"
                            />
                          ) : (
                            <Globe className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 leading-tight">
                          <span className="text-xs font-bold text-[#0F172A] truncate block">
                            {brand.name}
                          </span>
                          <span className="text-[10px] text-[#64748B] truncate block">
                            {brand.domain}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1">
                        {brand.verified && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 text-[#16A36A] border-[#16A36A]/30">
                            Verified
                          </Badge>
                        )}
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty search results notice */}
          {hasSearched && !isSearching && results.length === 0 && query && (
            <div className="p-3 bg-white rounded-lg border border-slate-200 text-center text-[11px] text-[#64748B] space-y-1">
              <p>Tidak menemukan brand resmi untuk &quot;{query}&quot;.</p>
              <button
                type="button"
                onClick={() => setIsCustomUrlMode(true)}
                className="text-primary hover:underline font-semibold cursor-pointer"
              >
                Gunakan URL Logo Kustom
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active Selected Logo Preview Card */}
      {isCurrentValueSelected && (
        <div className="mt-2 p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3 min-w-0">
            {/* Preview on White Base */}
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-2xs p-1.5 flex items-center justify-center shrink-0 overflow-hidden" title="Preview Tampilan Terang">
              {!imageError ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={value}
                  alt="Selected brand logo"
                  className="w-full h-full object-contain"
                  onError={() => setImageError(true)}
                />
              ) : (
                <span className="text-xs font-black text-primary">{displayInitial}</span>
              )}
            </div>

            {/* Preview on Dark Base */}
            <div className="w-10 h-10 rounded-xl bg-[#0F172A] border border-slate-800 shadow-2xs p-1.5 flex items-center justify-center shrink-0 overflow-hidden hidden sm:flex" title="Preview Tampilan Gelap">
              {!imageError ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={value}
                  alt="Selected brand logo (dark)"
                  className="w-full h-full object-contain"
                  onError={() => setImageError(true)}
                />
              ) : (
                <span className="text-xs font-black text-amber-400">{displayInitial}</span>
              )}
            </div>

            <div className="min-w-0 leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#0F172A] truncate">
                  {displayTitle}
                </span>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-[#16A36A]/30 text-[#16A36A] bg-emerald-50">
                  <ShieldCheck className="w-2.5 h-2.5 mr-0.5 inline" />
                  Terverifikasi
                </Badge>
              </div>
              <span className="text-[10px] text-[#64748B] font-mono truncate block mt-0.5 max-w-[240px] sm:max-w-[340px]">
                {value}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {value?.startsWith('http') && (
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 rounded-md transition-colors"
                title="Buka URL Logo Asli"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
              title="Hapus Logo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
