import { NavLink, useLocation } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';
import { ROUTES } from '../../config/routes';
import { canAccess } from '../../utils/rbac';

/* ------------------------------------------------------------------ */
/*  Menu structure with section labels                                 */
/* ------------------------------------------------------------------ */

const menuConfig = [
  /* ---- Direct link ---- */
  {
    type: 'item',
    label: 'Dashboard',
    path: ROUTES.DASHBOARD,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },

  /* ---- CONTABILIDAD ---- */
  { type: 'section', label: 'CONTABILIDAD', modulo: 'contabilidad' },
  {
    type: 'item',
    label: 'Polizas',
    path: ROUTES.POLIZAS,
    modulo: 'contabilidad',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
      </svg>
    ),
  },
  {
    type: 'item',
    label: 'Libro Diario',
    path: ROUTES.LIBRO_DIARIO,
    modulo: 'contabilidad',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        <path d="M8 7h6" />
        <path d="M8 11h4" />
      </svg>
    ),
  },
  {
    type: 'item',
    label: 'Libro Mayor',
    path: ROUTES.LIBRO_MAYOR,
    modulo: 'contabilidad',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        <path d="M12 6v7l4 2" />
      </svg>
    ),
  },
  {
    type: 'item',
    label: 'Balanza',
    path: ROUTES.BALANZA,
    modulo: 'contabilidad',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18" />
        <path d="M5 8l7-5 7 5" />
        <path d="M3 17l4-9 4 9" />
        <path d="M13 17l4-9 4 9" />
        <path d="M3 17h8" />
        <path d="M13 17h8" />
      </svg>
    ),
  },

  /* ---- PRESUPUESTO ---- */
  { type: 'section', label: 'PRESUPUESTO', modulo: 'presupuesto' },
  {
    type: 'item',
    label: 'Egresos',
    path: ROUTES.PRESUPUESTO_EGRESOS,
    modulo: 'presupuesto',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    type: 'item',
    label: 'Partidas',
    path: ROUTES.PARTIDAS,
    modulo: 'presupuesto',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <line x1="9" y1="12" x2="15" y2="12" />
        <line x1="9" y1="16" x2="13" y2="16" />
      </svg>
    ),
  },
  {
    type: 'item',
    label: 'Momentos Gasto',
    path: ROUTES.MOMENTOS_GASTO,
    modulo: 'presupuesto',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
        <path d="M17 17l2 2" />
      </svg>
    ),
  },
  {
    type: 'item',
    label: 'Ingresos',
    path: ROUTES.PRESUPUESTO_INGRESOS,
    modulo: 'presupuesto',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
  },
  {
    type: 'item',
    label: 'Conceptos',
    path: ROUTES.CONCEPTOS_INGRESO,
    modulo: 'presupuesto',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
  },
  {
    type: 'item',
    label: 'Momentos Ingreso',
    path: ROUTES.MOMENTOS_INGRESO,
    modulo: 'presupuesto',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },

  /* ---- PATRIMONIO ---- */
  { type: 'section', label: 'PATRIMONIO', modulo: 'patrimonio' },
  {
    type: 'item',
    label: 'Bienes',
    path: ROUTES.BIENES,
    modulo: 'patrimonio',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
      </svg>
    ),
  },
  {
    type: 'item',
    label: 'Inventarios',
    path: ROUTES.INVENTARIOS,
    modulo: 'patrimonio',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    type: 'item',
    label: 'Fideicomisos',
    path: ROUTES.FIDEICOMISOS,
    modulo: 'patrimonio',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },

  /* ---- CATALOGOS ---- */
  { type: 'section', label: 'CATALOGOS', modulo: 'catalogo' },
  {
    type: 'item',
    label: 'Plan de Cuentas',
    path: ROUTES.PLAN_CUENTAS,
    modulo: 'catalogo',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    ),
  },
  {
    type: 'item',
    label: 'Clasificadores',
    path: ROUTES.CLASIFICADORES,
    modulo: 'catalogo',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    type: 'item',
    label: 'Matrices',
    path: ROUTES.MATRICES,
    modulo: 'catalogo',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" />
        <line x1="9" y1="3" x2="9" y2="21" />
        <line x1="15" y1="3" x2="15" y2="21" />
      </svg>
    ),
  },

  /* ---- Direct links ---- */
  { type: 'divider' },
  {
    type: 'item',
    label: 'Reportes',
    path: ROUTES.REPORTES,
    modulo: 'reportes',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
  },
  {
    type: 'item',
    label: 'Deuda Publica',
    path: ROUTES.DEUDA,
    modulo: 'deuda',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="2" />
        <path d="M6 12h.01M18 12h.01" />
      </svg>
    ),
  },
  {
    type: 'item',
    label: 'Transparencia',
    path: ROUTES.TRANSPARENCIA,
    modulo: 'transparencia',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    type: 'item',
    label: 'Cuenta Publica',
    path: ROUTES.CUENTA_PUBLICA,
    modulo: 'cuenta_publica',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <path d="M9 15l2 2 4-4" />
      </svg>
    ),
  },
  {
    type: 'item',
    label: 'Fondos Federales',
    path: ROUTES.FONDOS_FEDERALES,
    modulo: 'fondos',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
        <path d="M12 17v4M8 21h8" />
      </svg>
    ),
  },

  /* ---- SISTEMA ---- */
  { type: 'section', label: 'SISTEMA', modulo: 'seguridad' },
  {
    type: 'item',
    label: 'Entes Publicos',
    path: ROUTES.ENTES,
    modulo: 'seguridad',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    type: 'item',
    label: 'Ejercicios',
    path: ROUTES.EJERCICIOS,
    modulo: 'seguridad',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    type: 'item',
    label: 'Periodos',
    path: ROUTES.PERIODOS,
    modulo: 'seguridad',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    type: 'item',
    label: 'Usuarios',
    path: ROUTES.USUARIOS,
    modulo: 'seguridad',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    type: 'item',
    label: 'Bitacora',
    path: ROUTES.BITACORA,
    modulo: 'seguridad',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  NavItem component                                                  */
/* ------------------------------------------------------------------ */

function NavItem({ item }) {
  const location = useLocation();
  const isActive = location.pathname === item.path;

  return (
    <NavLink
      to={item.path}
      className={`
        group flex items-center gap-3 px-4 py-[9px] mx-3 rounded-md
        text-[0.9375rem] leading-normal
        transition-colors duration-200
        ${
          isActive
            ? 'bg-guinda text-white shadow-[0_2px_6px_0_rgba(157,36,73,0.4)]'
            : 'text-text-sidebar hover:bg-white/[0.08]'
        }
      `}
    >
      <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-text-sidebar'}`}>
        {item.icon}
      </span>
      <span className="truncate">{item.label}</span>
    </NavLink>
  );
}

/* ------------------------------------------------------------------ */
/*  SectionLabel                                                       */
/* ------------------------------------------------------------------ */

function SectionLabel({ label }) {
  return (
    <div className="px-7 pt-5 pb-2">
      <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-text-sidebar/40">
        {label}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar                                                            */
/* ------------------------------------------------------------------ */

export default function Sidebar() {
  const { sidebarOpen, rol } = useAppStore();

  return (
    <aside
      className={`
        fixed left-0 top-0 z-40
        w-[260px] h-screen
        bg-bg-sidebar
        flex flex-col
        transition-[transform] duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* ---- Logo area ---- */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="w-9 h-9 rounded-lg bg-guinda flex items-center justify-center shadow-md">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#BC955C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11" />
          </svg>
        </div>
        <div>
          <div className="text-white font-bold text-[1.0625rem] tracking-wide leading-none">
            SCGMEX
          </div>
          <div className="text-text-sidebar/50 text-[0.6875rem] mt-0.5">
            Contabilidad Gubernamental
          </div>
        </div>
      </div>

      {/* ---- Divider below logo ---- */}
      <div className="mx-5 border-t border-white/[0.08]" />

      {/* ---- Navigation ---- */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-[2px]">
        {menuConfig
          .filter(entry => !entry.modulo || canAccess(rol, entry.modulo))
          .map((entry, i) => {
          if (entry.type === 'section') {
            return <SectionLabel key={`section-${i}`} label={entry.label} />;
          }
          if (entry.type === 'divider') {
            return <div key={`div-${i}`} className="mx-5 my-3 border-t border-white/[0.08]" />;
          }
          return <NavItem key={entry.path} item={entry} />;
        })}
      </nav>

      {/* ---- Footer ---- */}
      <div className="px-6 py-4 border-t border-white/[0.08]">
        <div className="text-[0.6875rem] text-text-sidebar/30 text-center">
          SCGMEX v1.0.0
        </div>
      </div>
    </aside>
  );
}
