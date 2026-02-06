import { useToastStore } from '../../stores/toastStore';

const TOAST_STYLES = {
  success: {
    border: 'border-l-[#71dd37]',
    iconBg: 'bg-[#71dd37]/10',
    iconText: 'text-[#71dd37]',
  },
  error: {
    border: 'border-l-[#ff3e1d]',
    iconBg: 'bg-[#ff3e1d]/10',
    iconText: 'text-[#ff3e1d]',
  },
  warning: {
    border: 'border-l-[#ffab00]',
    iconBg: 'bg-[#ffab00]/10',
    iconText: 'text-[#ffab00]',
  },
  info: {
    border: 'border-l-[#9D2449]',
    iconBg: 'bg-[#9D2449]/10',
    iconText: 'text-[#9D2449]',
  },
};

function ToastIcon({ type }) {
  const style = TOAST_STYLES[type] || TOAST_STYLES.info;

  if (type === 'success') {
    return (
      <div className={`w-8 h-8 rounded-full ${style.iconBg} flex items-center justify-center shrink-0`}>
        <svg className={`w-4 h-4 ${style.iconText}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }

  if (type === 'error') {
    return (
      <div className={`w-8 h-8 rounded-full ${style.iconBg} flex items-center justify-center shrink-0`}>
        <svg className={`w-4 h-4 ${style.iconText}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    );
  }

  if (type === 'warning') {
    return (
      <div className={`w-8 h-8 rounded-full ${style.iconBg} flex items-center justify-center shrink-0`}>
        <svg className={`w-4 h-4 ${style.iconText}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.007v.008H12v-.008zM10.29 3.86l-8.58 14.86c-.49.85.13 1.91 1.11 1.91h17.16c.98 0 1.6-1.06 1.11-1.91L12.71 3.86c-.49-.85-1.72-.85-2.21 0z" />
        </svg>
      </div>
    );
  }

  // info
  return (
    <div className={`w-8 h-8 rounded-full ${style.iconBg} flex items-center justify-center shrink-0`}>
      <svg className={`w-4 h-4 ${style.iconText}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
      </svg>
    </div>
  );
}

function Toast({ id, type, title, message }) {
  const removeToast = useToastStore((s) => s.removeToast);
  const style = TOAST_STYLES[type] || TOAST_STYLES.info;

  return (
    <div
      className={`bg-white rounded-lg card-shadow border-l-4 ${style.border} p-3 flex items-start gap-3 animate-[slideInRight_0.3s_ease-out]`}
      role="alert"
    >
      <ToastIcon type={type} />

      <div className="flex-1 min-w-0">
        {title && (
          <p className="text-[0.875rem] font-semibold text-text-heading">{title}</p>
        )}
        {message && (
          <p className="text-[0.8125rem] text-text-muted">{message}</p>
        )}
      </div>

      <button
        onClick={() => removeToast(id)}
        className="shrink-0 text-text-muted hover:text-text-heading transition-colors"
        aria-label="Cerrar notificacion"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-3 w-[380px] z-50">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
}
