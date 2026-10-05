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
  const { isSidebarOpen, openSidebar } = useNavigationStore();

  const isHome = pathname === '/';
  const isOrders = pathname.startsWith('/orders');
  const isSeller = pathname.startsWith('/seller') || pathname.startsWith('/daftar-sales') || pathname.startsWith('/sales');

  const navItems = [
    {
      label: 'Beranda',
      href: '/',
      icon: faHouse,
      active: isHome && !isSidebarOpen,
      isAction: false,
    },
    {
      label: 'Pesanan',
      href: '/orders',
      icon: faReceipt,
      active: isOrders && !isSidebarOpen,
      isAction: false,
    },
    {
      label: 'Seller',
      href: '/seller',
      icon: faStore,
      active: isSeller && !isSidebarOpen,
      isAction: false,
    },
    {
      label: 'Lainnya',
      href: '#',
      icon: faEllipsis,
      active: isSidebarOpen,
      isAction: true,
      onClick: () => openSidebar(),
    },
  ];

  return (
    <nav
      aria-label="Navigasi Bawah Seluler"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#121A2A]/95 backdrop-blur-md border-t border-white/10 px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.3)] transition-transform duration-200"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const content = (
            <>
              <div className="relative flex items-center justify-center h-6 w-6">
                <FontAwesomeIcon
                  icon={item.icon}
                  className={`w-4 h-4 transition-transform duration-150 ${
                    item.active ? 'scale-110' : ''
                  }`}
                />
                {item.active && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#C96F55] animate-pulse" />
                )}
              </div>
              <span
                className={`text-[10px] mt-0.5 leading-tight tracking-tight ${
                  item.active ? 'font-bold' : 'font-medium'
                }`}
              >
                {item.label}
              </span>
            </>
          );

          if (item.isAction) {
            return (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className={`flex flex-col items-center justify-center py-1 px-3 min-w-[64px] rounded-xl transition-all duration-150 cursor-pointer ${
                  item.active
                    ? 'text-[#C96F55]'
                    : 'text-[#F7F5EF]/60 hover:text-[#F7F5EF]'
                }`}
                aria-label="Buka Menu Lainnya"
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              prefetch={true}
              className={`flex flex-col items-center justify-center py-1 px-3 min-w-[64px] rounded-xl transition-all duration-150 ${
                item.active
                  ? 'text-[#C96F55]'
                  : 'text-[#F7F5EF]/60 hover:text-[#F7F5EF]'
              }`}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
