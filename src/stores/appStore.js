import { create } from 'zustand';

export const useAppStore = create((set) => ({
  // Current authenticated user
  user: null,
  setUser: (user) => set({ user }),

  // Active entity context
  entePublico: null,
  setEntePublico: (ente) => set({ entePublico: ente }),

  // Active fiscal year
  ejercicioFiscal: null,
  setEjercicioFiscal: (ejercicio) => set({ ejercicioFiscal: ejercicio }),

  // Active period
  periodoContable: null,
  setPeriodoContable: (periodo) => set({ periodoContable: periodo }),

  // Sidebar state
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // User role for current entity
  rol: null,
  setRol: (rol) => set({ rol }),

  // Logout
  logout: () => set({
    user: null,
    entePublico: null,
    ejercicioFiscal: null,
    periodoContable: null,
    rol: null,
  }),
}));
