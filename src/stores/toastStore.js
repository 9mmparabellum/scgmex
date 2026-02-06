import { create } from 'zustand';

let toastId = 0;

export const useToastStore = create((set) => ({
  toasts: [],
  addToast: ({ type = 'success', title, message, duration = 4000 }) => {
    const id = ++toastId;
    set((state) => ({ toasts: [...state.toasts, { id, type, title, message }] }));
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      }, duration);
    }
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
