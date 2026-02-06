import { useAppStore } from '../../stores/appStore';
import { useAuth } from '../../hooks/useAuth';
import { NIVELES_GOBIERNO, ROLES } from '../../config/constants';

export default function Header() {
  const { entePublico, ejercicioFiscal, rol, toggleSidebar } = useAppStore();
  const { user, logout } = useAuth();

  return (
    <header className="bg-bg-header border-b border-border sticky top-0 z-30">
      {/* Top guinda stripe */}
      <div className="h-1 bg-guinda" />

      <div className="h-14 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded hover:bg-bg-hover transition-colors text-text-secondary"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 5h14M3 10h14M3 15h14" />
            </svg>
          </button>

          {entePublico && (
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-text-muted text-xs">Ente:</span>
                <span className="font-medium text-text-primary">{entePublico.nombre}</span>
                <span className="text-[10px] bg-guinda text-white px-1.5 py-0.5 rounded">
                  {NIVELES_GOBIERNO[entePublico.nivel_gobierno]?.label}
                </span>
              </div>

              {ejercicioFiscal && (
                <>
                  <span className="text-border">|</span>
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted text-xs">Ejercicio:</span>
                    <span className="font-medium text-text-primary">{ejercicioFiscal.anio}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      ejercicioFiscal.estado === 'abierto' ? 'bg-verde/10 text-verde' :
                      ejercicioFiscal.estado === 'en_cierre' ? 'bg-dorado/10 text-dorado-dark' :
                      'bg-danger/10 text-danger'
                    }`}>
                      {ejercicioFiscal.estado}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {rol && (
            <span className="text-[10px] bg-verde text-white px-2 py-1 rounded font-medium">
              {ROLES[rol]}
            </span>
          )}
          {user && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-guinda rounded-full flex items-center justify-center text-white text-xs font-bold">
                {user.nombre?.charAt(0)}
              </div>
              <div className="hidden md:block">
                <div className="text-xs font-medium text-text-primary">{user.nombre}</div>
                <div className="text-[10px] text-text-muted">{user.email}</div>
              </div>
              <button
                onClick={logout}
                className="ml-2 px-2 py-1 rounded hover:bg-bg-hover text-text-muted hover:text-danger transition-colors text-xs"
              >
                Salir
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
