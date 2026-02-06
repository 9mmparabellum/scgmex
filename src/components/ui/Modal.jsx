import { useEffect } from 'react';
import { createPortal } from 'react-dom';

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${sizeClasses[size] || sizeClasses.md} bg-white rounded-2xl shadow-2xl overflow-hidden`}
      >
        <div className="flex items-center justify-between px-7 py-5 border-b border-[#eee]">
          <h2 className="text-[17px] font-bold text-[#111]">{title}</h2>
          <button
            onClick={onClose}
            className="text-[#ccc] hover:text-[#666] transition-colors p-2 rounded-xl hover:bg-[#f5f5f5] cursor-pointer"
            aria-label="Cerrar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="px-7 py-6 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
