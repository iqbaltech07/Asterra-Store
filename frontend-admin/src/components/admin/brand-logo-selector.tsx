'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Check, RefreshCw, X, Globe, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';
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
  { name: 'Canva', query: 'canva' },
  { name: 'Netflix', query: 'netflix' },
  { name: 'Spotify', query: 'spotify' },
  { name: 'ChatGPT', query: 'chatgpt' },
  { name: 'Google Gemini', query: 'google' },
  { name: 'CapCut', query: 'capcut' },
  { name: 'YouTube', query: 'youtube' },
  { name: 'Disney+', query: 'disney plus' },
  { name: 'Vidio', query: 'vidio' },
  { name: 'Viu', query: 'viu' },
  { name: 'WeTV', query: 'wetv' },
  { name: 'Adobe', query: 'adobe' },
  { name: 'Claude AI', query: 'claude' },
  { name: 'Midjourney', query: 'midjourney' },
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
  const [selectedBrandInfo, setSelectedBrandInfo] = useState<{ name: string; domain?: string } | null>(
    brandName ? { name: brandName } : null
  );

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync initial customUrl with value prop
  useEffect(() => {
    if (value && value !== customUrl) {
      setCustomUrl(value);
    }
  }, [value]);

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
      const res = await fetch(`/api/brands/search?q=${encodeURIComponent(q)}`);
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
    setResults([]);
    setQuery('');
  };

  const handleClear = () => {
    onChange('');
    setSelectedBrandInfo(null);
    setCustomUrl('');
    setQuery('');
    setResults([]);
  };

  const handleCustomUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrl.trim()) {
      onChange(customUrl.trim());
      setIsCustomUrlMode(false);
    }
  };

  const isCurrentValueSelected = Boolean(value);

  return (
    <div className="space-y-3 bg-surface-raised/70 border border-border/80 rounded-xl p-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <label className="text-xs font-bold text-foreground block">
              Logo Resmi Brand (Brandfetch API)
            </label>
            <span className="text-[10px] text-foreground-muted">
              Pilih icon resmi resolusi tinggi otomatis tersimpan ke data produk
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCustomUrlMode(!isCustomUrlMode)}
          className="text-[11px] text-primary hover:underline font-medium"
        >
          {isCustomUrlMode ? '← Cari Brandfetch' : 'Input URL Manual'}
        </button>
      </div>

      {/* Mode 1: Manual URL */}
      {isCustomUrlMode ? (
        <form onSubmit={handleCustomUrlSubmit} className="space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <Input
              type="url"
              placeholder="https://cdn.brandfetch.io/... atau URL gambar"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="text-xs h-9 bg-surface border-border flex-1 font-mono"
            />
            <Button type="submit" size="sm" className="h-9 text-xs px-3 font-semibold">
              Terapkan
            </Button>
          </div>
          <p className="text-[10px] text-foreground-muted">
            Format yang didukung: WebP, PNG, SVG (disarankan menggunakan CDN Brandfetch).
          </p>
        </form>
      ) : (
        /* Mode 2: Brandfetch Live Search */
        <div className="space-y-2.5">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Cari brand (contoh: Canva, Netflix, Spotify, ChatGPT, Gemini)..."
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              disabled={disabled}
              className="pl-8 pr-8 text-xs h-9 bg-surface border-border"
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
                className="w-3.5 h-3.5 text-foreground-muted hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>

          {/* Quick Popular Brand Pills */}
          {!query && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-foreground-muted font-medium block">
                Brand Populer Cepat:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_BRANDS.map((b) => (
                  <button
                    key={b.name}
                    type="button"
                    onClick={() => {
                      setQuery(b.query);
                      performSearch(b.query);
                    }}
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface hover:bg-primary/10 hover:text-primary border border-border transition-colors text-foreground-muted"
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results Dropdown / Grid */}
          {results.length > 0 && (
            <div className="space-y-1.5 max-h-56 overflow-y-auto p-1.5 bg-surface border border-primary/30 rounded-xl shadow-lg dark-scrollbar animate-in fade-in slide-in-from-top-1">
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
                          : 'border-border/80 bg-surface-raised/40 hover:bg-surface-raised hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/90 p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
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
                          <span className="text-xs font-bold text-foreground truncate block">
                            {brand.name}
                          </span>
                          <span className="text-[10px] text-foreground-muted truncate block">
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
            <div className="p-3 bg-surface rounded-lg border border-border text-center text-[11px] text-foreground-muted space-y-1">
              <p>Tidak menemukan brand resmi untuk &quot;{query}&quot;.</p>
              <button
                type="button"
                onClick={() => setIsCustomUrlMode(true)}
                className="text-primary hover:underline font-semibold"
              >
                Gunakan URL Logo Kustom
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active Selected Logo Preview Card */}
      {isCurrentValueSelected && (
        <div className="mt-2 p-2.5 bg-surface rounded-xl border border-border/80 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3 min-w-0">
            {/* Preview on White Base */}
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-2xs p-1.5 flex items-center justify-center shrink-0 overflow-hidden" title="Preview Tampilan Terang">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Selected brand logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            {/* Preview on Dark Base */}
            <div className="w-10 h-10 rounded-xl bg-[#0F172A] border border-slate-800 shadow-2xs p-1.5 flex items-center justify-center shrink-0 overflow-hidden hidden sm:flex" title="Preview Tampilan Gelap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Selected brand logo (dark)"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            <div className="min-w-0 leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-foreground truncate">
                  {selectedBrandInfo?.name || 'Logo Terpilih'}
                </span>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-status-success/30 text-status-success bg-status-success/10">
                  <ShieldCheck className="w-2.5 h-2.5 mr-0.5 inline" />
                  Brandfetch CDN
                </Badge>
              </div>
              <span className="text-[10px] text-foreground-muted font-mono truncate block mt-0.5 max-w-[240px] sm:max-w-[340px]">
                {value}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-foreground-muted hover:text-foreground hover:bg-surface-raised rounded-md transition-colors"
              title="Buka URL Logo Asli"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-status-error hover:bg-status-error/10 rounded-md transition-colors"
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
