'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faTriangleExclamation,
  faCircleExclamation,
  faCircleInfo,
  faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';

interface AlertDialogContextType {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

const AlertDialogContext = createContext<AlertDialogContextType | null>(null);

function useAlertDialog() {
  const ctx = useContext(AlertDialogContext);
  if (!ctx) {
    throw new Error('AlertDialog subcomponents must be used within an AlertDialog');
  }
  return ctx;
}

export function AlertDialogRoot({
  children,
  open,
  onOpenChange,
}: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const setIsOpen = (val: boolean) => {
    if (!isControlled) {
      setInternalOpen(val);
    }
    if (onOpenChange) {
      onOpenChange(val);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <AlertDialogContext.Provider value={{ isOpen, setIsOpen }}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        if (child.type === AlertDialogBackdrop) {
          return child;
        }
        const originalOnClick = (child.props as { onClick?: (e: React.MouseEvent) => void }).onClick;
        return React.cloneElement(child as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>, {
          onClick: (e: React.MouseEvent) => {
            if (originalOnClick) originalOnClick(e);
            if (!isControlled) {
              setIsOpen(true);
            }
          },
        });
      })}
    </AlertDialogContext.Provider>
  );
}

export function AlertDialogTrigger({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setIsOpen } = useAlertDialog();
  return (
    <button
      type="button"
      className={className}
      onClick={() => setIsOpen(true)}
      {...props}
    >
      {children}
    </button>
  );
}

export function AlertDialogBackdrop({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { isOpen } = useAlertDialog();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={
        className ||
        'fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-md animate-modal-backdrop'
      }
    >
      {children}
    </div>,
    document.body
  );
}

export function AlertDialogContainer({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { setIsOpen } = useAlertDialog();

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={
        className ||
        'fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4'
      }
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setIsOpen(false);
        }
      }}
    >
      {children}
    </div>,
    document.body
  );
}

export function AlertDialogDialog({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      className={
        className ||
        'relative w-full max-w-[440px] bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4 animate-modal-dialog text-[#0F172A]'
      }
    >
      {children}
    </div>
  );
}

export function AlertDialogCloseTrigger({
  className = '',
}: {
  className?: string;
}) {
  const { setIsOpen } = useAlertDialog();
  return (
    <button
      type="button"
      onClick={() => setIsOpen(false)}
      className={
        className ||
        'absolute top-3.5 right-3.5 h-8 w-8 p-0 rounded-full text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] flex items-center justify-center transition-colors cursor-pointer'
      }
      aria-label="Tutup"
    >
      <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5" />
    </button>
  );
}

export function AlertDialogHeader({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className || 'space-y-1.5'}>{children}</div>;
}

export function AlertDialogHeading({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={className || 'text-base font-bold text-[#0F172A]'}>
      {children}
    </h3>
  );
}

export function AlertDialogIcon({
  status = 'accent',
}: {
  status?: 'accent' | 'danger' | 'warning' | 'success' | 'info';
  className?: string;
}) {
  if (status === 'danger') {
    return (
      <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
        <FontAwesomeIcon icon={faCircleExclamation} className="w-5 h-5" />
      </div>
    );
  }
  if (status === 'warning') {
    return (
      <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
        <FontAwesomeIcon icon={faTriangleExclamation} className="w-5 h-5" />
      </div>
    );
  }
  if (status === 'success') {
    return (
      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
        <FontAwesomeIcon icon={faCircleCheck} className="w-5 h-5" />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shrink-0">
      <FontAwesomeIcon icon={faCircleInfo} className="w-5 h-5" />
    </div>
  );
}

export function AlertDialogBody({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className || 'text-xs space-y-3 text-[#64748B]'}>{children}</div>;
}

export function AlertDialogFooter({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { setIsOpen } = useAlertDialog();

  return (
    <div className={className || 'flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]'}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        if ((child.props as { slot?: string }).slot === 'close') {
          const originalOnClick = (child.props as { onClick?: (e: React.MouseEvent) => void }).onClick;
          return React.cloneElement(child as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>, {
            onClick: (e: React.MouseEvent) => {
              if (originalOnClick) originalOnClick(e);
              setIsOpen(false);
            },
          });
        }
        if ((child.props as { variant?: string }).variant === 'destructive') {
          return React.cloneElement(child as React.ReactElement<{ className?: string }>, {
            className: `${(child.props as { className?: string }).className || ''} animate-alert-pulse-once`,
          });
        }
        return child;
      })}
    </div>
  );
}

export const AlertDialog = Object.assign(AlertDialogRoot, {
  Root: AlertDialogRoot,
  Trigger: AlertDialogTrigger,
  Backdrop: AlertDialogBackdrop,
  Container: AlertDialogContainer,
  Dialog: AlertDialogDialog,
  CloseTrigger: AlertDialogCloseTrigger,
  Header: AlertDialogHeader,
  Heading: AlertDialogHeading,
  Icon: AlertDialogIcon,
  Body: AlertDialogBody,
  Footer: AlertDialogFooter,
});

export default AlertDialog;
