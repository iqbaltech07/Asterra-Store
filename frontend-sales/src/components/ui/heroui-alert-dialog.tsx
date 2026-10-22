'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
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

  if (!isOpen) return null;

  return (
    <div
      className={
        className ||
        'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200'
      }
    >
      {children}
    </div>
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
  return (
    <div
      className={
        className ||
        'fixed inset-0 z-50 flex items-center justify-center p-4'
      }
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setIsOpen(false);
        }
      }}
    >
      {children}
    </div>
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
        'relative w-full max-w-[420px] bg-surface border border-border rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200'
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
        'absolute top-4 right-4 text-foreground-muted hover:text-foreground p-1.5 rounded-lg hover:bg-surface-raised transition-colors'
      }
      aria-label="Tutup"
    >
      <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
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
  return <div className={className || 'space-y-2'}>{children}</div>;
}

export function AlertDialogHeading({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={className || 'text-base font-bold text-foreground'}>
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
      <div className="w-10 h-10 rounded-xl bg-status-error/15 border border-status-error/30 flex items-center justify-center text-status-error shrink-0">
        <FontAwesomeIcon icon={faCircleExclamation} className="w-5 h-5" />
      </div>
    );
  }
  if (status === 'warning') {
    return (
      <div className="w-10 h-10 rounded-xl bg-status-warning/15 border border-status-warning/30 flex items-center justify-center text-status-warning shrink-0">
        <FontAwesomeIcon icon={faTriangleExclamation} className="w-5 h-5" />
      </div>
    );
  }
  if (status === 'success') {
    return (
      <div className="w-10 h-10 rounded-xl bg-status-success/15 border border-status-success/30 flex items-center justify-center text-status-success shrink-0">
        <FontAwesomeIcon icon={faCircleCheck} className="w-5 h-5" />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
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
  return <div className={className || 'text-xs space-y-3'}>{children}</div>;
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
    <div className={className || 'flex items-center justify-end gap-2.5 pt-3 border-t border-border'}>
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
