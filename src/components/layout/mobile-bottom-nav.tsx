'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHouse,
  faReceipt,
  faStore,
  faEllipsis,
} from '@fortawesome/free-solid-svg-icons';
import { useNavigationStore } from '@/store/use-navigation-store';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { openSidebar, isSidebarOpen } = useNavigationStore();

  const isHome = pathname === '/';
  const isOrders = pathname.startsWith('/orders');
  const isSeller =
    pathname.startsWith('/seller') ||
    pathname.startsWith('/daftar-sales') ||
    pathname.startsWith('/sales');

  return (
    <nav
      aria-label="Navigasi Bawah Seluler"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#121A2A]/95 backdrop-blur-md border-t border-white/10 px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.3)] transition-transform duration-200"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* 1. Beranda */}
        <Link
          href="/"
          prefetch={true}
          className={`flex flex-col items-center justify-center py-1 px-3 min-w-[64px] rounded-xl transition-all duration-150 ${
            isHome
              ? 'text-[#C96F55]'
              : 'text-[#F7F5EF]/60 hover:text-[#F7F5EF]'
          }`}
        >
          <div className="relative flex items-center justify-center h-6 w-6">
            <FontAwesomeIcon
              icon={faHouse}
              className={`w-4 h-4 transition-transform duration-150 ${
                isHome ? 'scale-110' : ''
              }`}
            />
          </div>
          <span
            className={`text-[10px] mt-0.5 leading-tight tracking-tight ${
              isHome ? 'font-bold' : 'font-medium'
            }`}
          >
            Beranda
          </span>
        </Link>

        {/* 2. Pesanan */}
        <Link
          href="/orders?view=global"
          prefetch={true}
          className={`flex flex-col items-center justify-center py-1 px-3 min-w-[64px] rounded-xl transition-all duration-150 ${
            isOrders
              ? 'text-[#C96F55]'
              : 'text-[#F7F5EF]/60 hover:text-[#F7F5EF]'
          }`}
        >
          <div className="relative flex items-center justify-center h-6 w-6">
            <FontAwesomeIcon
              icon={faReceipt}
              className={`w-4 h-4 transition-transform duration-150 ${
                isOrders ? 'scale-110' : ''
              }`}
            />
          </div>
          <span
            className={`text-[10px] mt-0.5 leading-tight tracking-tight ${
              isOrders ? 'font-bold' : 'font-medium'
            }`}
          >
            Pesanan
          </span>
        </Link>

        {/* 3. Seller */}
        <Link
          href="/seller"
          prefetch={true}
          className={`flex flex-col items-center justify-center py-1 px-3 min-w-[64px] rounded-xl transition-all duration-150 ${
            isSeller
              ? 'text-[#C96F55]'
              : 'text-[#F7F5EF]/60 hover:text-[#F7F5EF]'
          }`}
        >
          <div className="relative flex items-center justify-center h-6 w-6">
            <FontAwesomeIcon
              icon={faStore}
              className={`w-4 h-4 transition-transform duration-150 ${
                isSeller ? 'scale-110' : ''
              }`}
            />
          </div>
          <span
            className={`text-[10px] mt-0.5 leading-tight tracking-tight ${
              isSeller ? 'font-bold' : 'font-medium'
            }`}
          >
            Seller
          </span>
        </Link>

        {/* 4. Lainnya (Trigger Drawer) */}
        <button
          type="button"
          onClick={openSidebar}
          className={`flex flex-col items-center justify-center py-1 px-3 min-w-[64px] rounded-xl transition-all duration-150 cursor-pointer ${
            isSidebarOpen
              ? 'text-[#C96F55]'
              : 'text-[#F7F5EF]/60 hover:text-[#F7F5EF]'
          }`}
          aria-label="Buka Menu Sekunder Lainnya"
        >
          <div className="relative flex items-center justify-center h-6 w-6">
            <FontAwesomeIcon
              icon={faEllipsis}
              className={`w-4 h-4 transition-transform duration-150 ${
                isSidebarOpen ? 'scale-110' : ''
              }`}
            />
          </div>
          <span
            className={`text-[10px] mt-0.5 leading-tight tracking-tight ${
              isSidebarOpen ? 'font-bold' : 'font-medium'
            }`}
          >
            Lainnya
          </span>
        </button>
      </div>
    </nav>
  );
}
