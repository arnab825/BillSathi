import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toast: (toast: Omit<ToastMessage, 'id'>) => void;
  success: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((t: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { ...t, id };
    setToasts((prev) => [...prev, newToast]);

    const dur = t.duration ?? 4000;
    if (dur > 0) {
      setTimeout(() => {
        removeToast(id);
      }, dur);
    }
  }, [removeToast]);

  const success = useCallback((title: string, message?: string) => {
    addToast({ type: 'success', title, message });
  }, [addToast]);

  const warning = useCallback((title: string, message?: string) => {
    addToast({ type: 'warning', title, message });
  }, [addToast]);

  const error = useCallback((title: string, message?: string) => {
    addToast({ type: 'error', title, message });
  }, [addToast]);

  const info = useCallback((title: string, message?: string) => {
    addToast({ type: 'info', title, message });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, warning, error, info }}>
      {children}
      {/* Floating Toast Container */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((item) => {
          const isSuccess = item.type === 'success';
          const isWarning = item.type === 'warning';
          const isError = item.type === 'error';

          return (
            <div
              key={item.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-2xl backdrop-blur-xl transition-all duration-200 animate-in slide-in-from-bottom-2 ${
                isSuccess
                  ? 'bg-[#1F2937]/95 border-[#10B981]/50 shadow-[0_8px_30px_rgb(16,185,129,0.12)] text-[#F9FAFB]'
                  : isWarning
                  ? 'bg-[#1F2937]/95 border-[#F59E0B]/50 shadow-[0_8px_30px_rgb(245,158,11,0.12)] text-[#F9FAFB]'
                  : isError
                  ? 'bg-[#1F2937]/95 border-[#F87171]/50 shadow-[0_8px_30px_rgb(248,113,113,0.12)] text-[#F9FAFB]'
                  : 'bg-[#1F2937]/95 border-[#374151] text-[#F9FAFB]'
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {isSuccess && <CheckCircle2 className="w-4 h-4 text-[#10B981]" />}
                {isWarning && <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />}
                {isError && <X className="w-4 h-4 text-[#F87171]" />}
                {!isSuccess && !isWarning && !isError && <Info className="w-4 h-4 text-[#60A5FA]" />}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <div className="text-xs font-bold leading-tight">{item.title}</div>
                {item.message && (
                  <div className="text-[11px] text-[#9CA3AF] mt-0.5 leading-snug">
                    {item.message}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeToast(item.id)}
                className="text-[#9CA3AF] hover:text-[#F9FAFB] p-0.5 rounded transition-colors flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
