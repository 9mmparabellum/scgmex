import { useAppStore } from '../../stores/appStore';
import { useAuth } from '../../hooks/useAuth';
import { formatPeriodo } from '../../utils/formatters';
import { NIVELES_GOBIERNO, ROLES } from '../../config/constants';

export default function Header() {
  const { entePublico, ejercicioFiscal, periodoContable, rol, toggleSidebar } = useAppStore();
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-bg-header border-b border-border flex items-center justify-between px-4 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-bg-hover transition-colors text-text-secondary"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 5h14M3 10h14M3 15h14" />
          </svg>
        </button>

        {entePublico && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-bg-hover px-3 py-1.5 rounded-lg">
              <span className="text-xs text-text-muted">Ente:</span>
              <span className="text-sm font-medium text-text-primary">{entePublico.nombre}</span>
              <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded">
                {NIVELES_GOBIERNO[entePublico.nivel_gobierno]?.label}
              </span>
            </div>

            {ejercicioFiscal && (
              <div className="flex items-center gap-2 bg-bg-hover px-3 py-1.5 rounded-lg">
                <span className="text-xs text-text-muted">Ejercicio:</span>
                <span className="text-sm font-medium text-text-primary">{ejercicioFiscal.anio}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  ejercicioFiscal.estado === 'abierto' ? 'bg-success text-white' :
                  ejercicioFiscal.estado === 'en_cierre' ? 'bg-warning text-white' :
                  'bg-danger text-white'
                }`}>
                  {ejercicioFiscal.estado}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {rol && (
          <span className="text-[10px] bg-secondary text-white px-2 py-1 rounded-full">
            {ROLES[rol]}
          </span>
        )}
        {user && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
              {user.nombre?.charAt(0)}
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-medium text-text-primary">{user.nombre}</div>
              <div className="text-[10px] text-text-muted">{user.email}</div>
            </div>
            <button
              onClick={logout}
              className="ml-2 p-1.5 rounded-lg hover:bg-bg-hover text-text-muted hover:text-danger transition-colors text-xs"
            >
              Salir
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
