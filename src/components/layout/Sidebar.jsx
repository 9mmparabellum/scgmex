import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';
import { ROUTES } from '../../config/routes';

const menuItems = [
  {
    label: 'Dashboard',
    path: ROUTES.DASHBOARD,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Contabilidad',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /><path d="M8 7h6M8 11h4" />
      </svg>
    ),
    children: [
      { label: 'Polizas', path: ROUTES.POLIZAS },
      { label: 'Libro Diario', path: ROUTES.LIBRO_DIARIO },
      { label: 'Libro Mayor', path: ROUTES.LIBRO_MAYOR },
      { label: 'Balanza', path: ROUTES.BALANZA },
    ],
  },
  {
    label: 'Presupuesto',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    children: [
      { label: 'Egresos', path: ROUTES.PRESUPUESTO_EGRESOS },
      { label: 'Ingresos', path: ROUTES.PRESUPUESTO_INGRESOS },
    ],
  },
  {
    label: 'Patrimonio',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
      </svg>
    ),
    children: [
      { label: 'Bienes', path: ROUTES.BIENES },
      { label: 'Inventarios', path: ROUTES.INVENTARIOS },
      { label: 'Fideicomisos', path: ROUTES.FIDEICOMISOS },
    ],
  },
  {
    label: 'Catalogos',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 12h6M9 16h4" />
      </svg>
    ),
    children: [
      { label: 'Plan de Cuentas', path: ROUTES.PLAN_CUENTAS },
      { label: 'Clasificadores', path: ROUTES.CLASIFICADORES },
      { label: 'Matrices', path: ROUTES.MATRICES },
    ],
  },
  {
    label: 'Reportes',
    path: ROUTES.REPORTES,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    label: 'Deuda Publica',
    path: ROUTES.DEUDA,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M12 12a2 2 0 1 0 0-0.01" /><path d="M6 12h.01M18 12h.01" />
      </svg>
    ),
  },
  {
    label: 'Transparencia',
    path: ROUTES.TRANSPARENCIA,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    label: 'Configuracion',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    children: [
      { label: 'Entes Publicos', path: ROUTES.ENTES },
      { label: 'Ejercicios', path: ROUTES.EJERCICIOS },
      { label: 'Periodos', path: ROUTES.PERIODOS },
      { label: 'Usuarios', path: ROUTES.USUARIOS },
      { label: 'Bitacora', path: ROUTES.BITACORA },
    ],
  },
];

function MenuItem({ item }) {
  const [open, setOpen] = useState(false);

  if (item.children) {
    return (
      <div className="mb-0.5">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-text-sidebar hover:bg-guinda/80 transition-colors"
        >
          <span className="flex items-center gap-3">
            <span className="opacity-70">{item.icon}</span>
            <span>{item.label}</span>
          </span>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`transition-transform ${open ? 'rotate-180' : ''}`}
          >
            <polyline points="6,9 12,15 18,9" />
          </svg>
        </button>
        {open && (
          <div className="bg-guinda-dark/50">
            {item.children.map((child) => (
              <NavLink
                key={child.path}
                to={child.path}
                className={({ isActive }) =>
                  `block px-4 py-2 pl-12 text-[13px] transition-colors border-l-2 ${
                    isActive
                      ? 'bg-guinda/60 text-white font-medium border-dorado'
                      : 'text-text-sidebar hover:bg-guinda/40 hover:text-white border-transparent'
                  }`
                }
              >
                {child.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors border-l-2 mb-0.5 ${
          isActive
            ? 'bg-guinda/60 text-white font-medium border-dorado'
            : 'text-text-sidebar hover:bg-guinda/40 hover:text-white border-transparent'
        }`
      }
    >
      <span className="opacity-70">{item.icon}</span>
      <span>{item.label}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  const { sidebarOpen } = useAppStore();

  if (!sidebarOpen) return null;

  return (
    <aside className="w-64 bg-guinda-dark min-h-screen flex flex-col fixed left-0 top-0 z-40">
      {/* Top gold stripe */}
      <div className="h-1 bg-dorado" />

      {/* Logo */}
      <div className="px-4 py-4 border-b border-guinda/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-dorado rounded flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#621132" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
            </svg>
          </div>
          <div>
            <div className="text-white font-bold text-sm tracking-wide">SCGMEX</div>
            <div className="text-text-sidebar text-[10px] leading-tight">
              Contabilidad Gubernamental
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {menuItems.map((item, i) => (
          <MenuItem key={i} item={item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-guinda/50">
        <div className="text-[10px] text-text-sidebar/60 text-center leading-relaxed">
          Gobierno de Mexico
          <br />
          LGCG DOF 16-07-2025
        </div>
      </div>
    </aside>
  );
}
