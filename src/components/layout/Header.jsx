import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';
import { useAuth } from '../../hooks/useAuth';
import { usePolizasList } from '../../hooks/usePoliza';
import { ROUTES } from '../../config/routes';

/* ------------------------------------------------------------------ */
/*  Estado badge color map                                             */
/* ------------------------------------------------------------------ */

const estadoStyles = {
  abierto: 'bg-verde/10 text-verde',
  en_cierre: 'bg-dorado/10 text-dorado-dark',
  cerrado: 'bg-[#f5f5f9] text-text-muted',
};

const estadoLabels = {
  abierto: 'Abierto',
  en_cierre: 'En Cierre',
  cerrado: 'Cerrado',
};

/* ------------------------------------------------------------------ */
/*  Header                                                             */
/* ------------------------------------------------------------------ */

export default function Header() {
  const navigate = useNavigate();
  const { entePublico, ejercicioFiscal, toggleSidebar } = useAppStore();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const dropdownRef = useRef(null);
  const { data: polizas = [] } = usePolizasList();
  const pendientes = polizas.filter(p => p.estado === 'pendiente').length;

  /* Close dropdown on outside click */
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const estado = ejercicioFiscal?.estado || 'abierto';

  return (
    <header
      className="h-16 bg-white sticky top-0 z-30 flex items-center justify-between px-6"
      style={{ boxShadow: '0 2px 6px rgba(67,89,113,0.12)' }}
    >
      {/* ---- Left side ---- */}
      <div className="flex items-center gap-4">
        {/* Hamburger toggle */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-bg-hover transition-colors text-text-secondary hover:text-text-heading cursor-pointer"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Breadcrumb context */}
        {entePublico && (
          <div className="hidden sm:flex items-center gap-2 text-[0.9375rem]">
            <span className="text-text-heading font-medium truncate max-w-[200px]">
              {entePublico.nombre}
            </span>
            {ejercicioFiscal && (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-border flex-shrink-0">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                <span className="text-text-secondary font-medium">
                  {ejercicioFiscal.anio}
                </span>
                <span
                  className={`text-[0.6875rem] px-2.5 py-0.5 rounded-full font-semibold ${
                    estadoStyles[estado] || estadoStyles.cerrado
                  }`}
                >
                  {estadoLabels[estado] || estado}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* ---- Right side ---- */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-lg hover:bg-bg-hover transition-colors text-text-secondary hover:text-text-heading cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {pendientes > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full ring-2 ring-white" />
            )}
          </button>

          {notifOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg py-1 z-50"
              style={{ boxShadow: '0 4px 16px rgba(67,89,113,0.16)' }}
            >
              <div className="px-4 py-3 border-b border-border">
                <div className="text-[0.8125rem] font-semibold text-text-heading">
                  Notificaciones
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {pendientes > 0 ? (
                  <div className="px-4 py-3 flex items-start gap-3 hover:bg-bg-hover transition-colors">
                    <div className="w-2 h-2 rounded-full mt-[7px] flex-shrink-0 bg-[#03c3ec]" />
                    <p className="text-[0.8125rem] text-text-primary">
                      {pendientes} poliza{pendientes > 1 ? 's' : ''} pendiente{pendientes > 1 ? 's' : ''} de aprobacion
                    </p>
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center text-[0.8125rem] text-text-muted">
                    Sin notificaciones
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-border mx-1" />

        {/* User avatar + dropdown */}
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-bg-hover transition-colors cursor-pointer"
            >
              <div className="w-[34px] h-[34px] bg-gradient-to-br from-guinda to-guinda-dark rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                {user.nombre?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-[0.8125rem] font-semibold text-text-heading leading-tight">
                  {user.nombre}
                </div>
                <div className="text-[0.6875rem] text-text-muted leading-tight">
                  {user.rol === 'super_admin' ? 'Administrador' : user.rol}
                </div>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`hidden md:block text-text-muted transition-transform duration-200 ${
                  dropdownOpen ? 'rotate-180' : ''
                }`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg py-1 z-50"
                style={{ boxShadow: '0 4px 16px rgba(67,89,113,0.16)' }}
              >
                {/* User info */}
                <div className="px-4 py-3 border-b border-border">
                  <div className="text-[0.8125rem] font-semibold text-text-heading">
                    {user.nombre}
                  </div>
                  <div className="text-[0.75rem] text-text-muted truncate">
                    {user.email}
                  </div>
                </div>

                {/* Mi Perfil */}
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate(ROUTES.PERFIL);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[0.8125rem] text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Mi Perfil
                </button>

                <div className="mx-3 my-1 border-t border-border" />

                {/* Logout */}
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[0.8125rem] text-danger hover:bg-danger/5 transition-colors cursor-pointer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Cerrar Sesion
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
