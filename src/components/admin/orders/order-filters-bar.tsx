'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClock,
  faCircleCheck,
  faBan,
  faMagnifyingGlass,
  faVolumeHigh,
  faVolumeXmark,
  faBell,
  faArrowsRotate,
} from '@fortawesome/free-solid-svg-icons';
import { OrderMetrics } from './order-metrics-cards';

interface OrderFiltersBarProps {
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  metrics?: OrderMetrics;
  sseConnected: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onTestSound: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export function OrderFiltersBar({
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery,
  metrics,
  sseConnected,
  isMuted,
  onToggleMute,
  onTestSound,
  onRefresh,
  isLoading,
}: OrderFiltersBarProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
      {/* Status Pill Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            statusFilter === 'all'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-surface-raised text-foreground-muted hover:text-foreground border border-border'
          }`}
        >
          Semua ({metrics?.total ?? 0})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('pending')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
            statusFilter === 'pending'
              ? 'bg-status-warning text-white shadow-sm'
              : 'bg-surface-raised text-foreground-muted hover:text-foreground border border-border'
          }`}
        >
          <FontAwesomeIcon icon={faClock} className="w-3.5 h-3.5" />
          <span>Pending ({metrics?.pending ?? 0})</span>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('processing')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
            statusFilter === 'processing'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-surface-raised text-foreground-muted hover:text-foreground border border-border'
          }`}
        >
          <span>Di Proses ({metrics?.processing ?? 0})</span>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('completed')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
            statusFilter === 'completed'
              ? 'bg-status-success text-white shadow-sm'
              : 'bg-surface-raised text-foreground-muted hover:text-foreground border border-border'
          }`}
        >
          <FontAwesomeIcon icon={faCircleCheck} className="w-3.5 h-3.5" />
          <span>Selesai ({metrics?.completed ?? 0})</span>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('cancelled')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
            statusFilter === 'cancelled'
              ? 'bg-foreground text-background shadow-sm'
              : 'bg-surface-raised text-foreground-muted hover:text-foreground border border-border'
          }`}
        >
          <FontAwesomeIcon icon={faBan} className="w-3.5 h-3.5" />
          <span>Dibatalkan ({metrics?.cancelled ?? 0})</span>
        </button>
      </div>

      {/* Search Input, Audio Controls & Refresh */}
      <div className="flex flex-wrap items-center gap-2">
        {/* SSE Status Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-border bg-surface-raised">
          <span className={sseConnected ? 'text-status-success font-semibold' : 'text-status-error'}>
            {sseConnected ? 'SSE Live' : 'SSE Disconnected'}
          </span>
        </div>

        {/* Sound Mute/Unmute Toggle */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onToggleMute}
          className="h-9 px-2.5 border-border gap-1.5 text-xs text-foreground-muted hover:text-foreground"
          title={isMuted ? 'Nyalakan audio notifikasi' : 'Bisukan audio notifikasi'}
        >
          {isMuted ? (
            <FontAwesomeIcon icon={faVolumeXmark} className="w-3.5 h-3.5 text-status-error" />
          ) : (
            <FontAwesomeIcon icon={faVolumeHigh} className="w-3.5 h-3.5 text-status-success" />
          )}
          <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Sound ON'}</span>
        </Button>

        {/* Test Sound Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onTestSound}
          className="h-9 px-2.5 border-border gap-1.5 text-xs text-foreground-muted hover:text-foreground"
          title="Uji coba suara notifikasi Web Audio"
        >
          <FontAwesomeIcon icon={faBell} className="w-3.5 h-3.5 text-primary" />
          <span className="hidden lg:inline">Tes Chime</span>
        </Button>

        <div className="relative flex-1 sm:w-60">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <Input
            type="text"
            placeholder="Cari ID, Email, WA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 text-xs bg-surface-raised border-border"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-9 px-2.5 border-border text-xs gap-1.5 text-foreground-muted hover:text-foreground"
          title="Segarkan data pesanan"
        >
          <FontAwesomeIcon icon={faArrowsRotate} className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>
    </div>
  );
}
