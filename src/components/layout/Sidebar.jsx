import { NavLink } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';
import { ROUTES } from '../../config/routes';

const menuItems = [
  {
    label: 'Dashboard',
    icon: '📊',
    path: ROUTES.DASHBOARD,
  },
  {
    label: 'Contabilidad',
    icon: '📒',
    children: [
      { label: 'Polizas', path: ROUTES.POLIZAS },
      { label: 'Libro Diario', path: ROUTES.LIBRO_DIARIO },
      { label: 'Libro Mayor', path: ROUTES.LIBRO_MAYOR },
      { label: 'Balanza', path: ROUTES.BALANZA },
    ],
  },
  {
    label: 'Presupuesto',
    icon: '💰',
    children: [
      { label: 'Egresos', path: ROUTES.PRESUPUESTO_EGRESOS },
      { label: 'Ingresos', path: ROUTES.PRESUPUESTO_INGRESOS },
    ],
  },
  {
    label: 'Patrimonio',
    icon: '🏛️',
    children: [
      { label: 'Bienes', path: ROUTES.BIENES },
      { label: 'Inventarios', path: ROUTES.INVENTARIOS },
      { label: 'Fideicomisos', path: ROUTES.FIDEICOMISOS },
    ],
  },
  {
    label: 'Catalogos',
    icon: '📋',
    children: [
      { label: 'Plan de Cuentas', path: ROUTES.PLAN_CUENTAS },
      { label: 'Clasificadores', path: ROUTES.CLASIFICADORES },
      { label: 'Matrices', path: ROUTES.MATRICES },
    ],
  },
  {
    label: 'Reportes',
    icon: '📄',
    path: ROUTES.REPORTES,
  },
  {
    label: 'Deuda Publica',
    icon: '🏦',
    path: ROUTES.DEUDA,
  },
  {
    label: 'Transparencia',
    icon: '🔍',
    path: ROUTES.TRANSPARENCIA,
  },
  {
    label: 'Configuracion',
    icon: '⚙️',
    children: [
      { label: 'Entes Publicos', path: ROUTES.ENTES },
      { label: 'Ejercicios', path: ROUTES.EJERCICIOS },
      { label: 'Usuarios', path: ROUTES.USUARIOS },
      { label: 'Bitacora', path: ROUTES.BITACORA },
    ],
  },
];

function MenuItem({ item }) {
  if (item.children) {
    return (
      <div className="mb-1">
        <div className="px-4 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
          {item.icon} {item.label}
        </div>
        {item.children.map((child) => (
          <NavLink
            key={child.path}
            to={child.path}
            className={({ isActive }) =>
              `block px-4 py-2 pl-10 text-sm rounded-r-lg mr-2 transition-colors ${
                isActive
                  ? 'bg-primary-light text-text-sidebar-active font-medium'
                  : 'text-text-sidebar hover:bg-primary-light/50 hover:text-text-sidebar-active'
              }`
            }
          >
            {child.label}
          </NavLink>
        ))}
      </div>
    );
  }

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `flex items-center gap-2 px-4 py-2.5 text-sm rounded-r-lg mr-2 mb-0.5 transition-colors ${
          isActive
            ? 'bg-primary-light text-text-sidebar-active font-medium'
            : 'text-text-sidebar hover:bg-primary-light/50 hover:text-text-sidebar-active'
        }`
      }
    >
      <span>{item.icon}</span>
      <span>{item.label}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  const { sidebarOpen } = useAppStore();

  if (!sidebarOpen) return null;

  return (
    <aside className="w-60 bg-bg-sidebar min-h-screen flex flex-col fixed left-0 top-0 z-40">
      <div className="h-16 flex items-center px-4 border-b border-primary-light">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center font-bold text-primary-dark text-xs">
            SCG
          </div>
          <div>
            <div className="text-text-sidebar-active font-bold text-sm leading-tight">SCGMEX</div>
            <div className="text-text-muted text-[10px] leading-tight">Contabilidad Gubernamental</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {menuItems.map((item, i) => (
          <MenuItem key={i} item={item} />
        ))}
      </nav>

      <div className="p-4 border-t border-primary-light">
        <div className="text-[10px] text-text-muted text-center">
          LGCG DOF 16-07-2025
        </div>
      </div>
    </aside>
  );
}
