import { useAppStore } from '../../stores/appStore';
import { useAuth } from '../../hooks/useAuth';

export default function Header() {
  const { entePublico, ejercicioFiscal, toggleSidebar } = useAppStore();
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-[#eee] sticky top-0 z-30 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2.5 rounded-xl hover:bg-[#f5f5f5] transition-colors text-[#999] hover:text-[#333] cursor-pointer"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>

        {entePublico && (
          <div className="flex items-center gap-2.5 text-[15px]">
            <span className="text-[#333] font-medium">{entePublico.nombre}</span>
            {ejercicioFiscal && (
              <>
                <span className="text-[#ddd]">/</span>
                <span className="text-[#999]">{ejercicioFiscal.anio}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  ejercicioFiscal.estado === 'abierto' ? 'bg-verde/10 text-verde' :
                  ejercicioFiscal.estado === 'en_cierre' ? 'bg-dorado/10 text-dorado-dark' :
                  'bg-[#f5f5f5] text-[#999]'
                }`}>
                  {ejercicioFiscal.estado}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {user && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-guinda to-guinda-dark rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user.nombre?.charAt(0)}
            </div>
            <div className="hidden md:block">
              <div className="text-[14px] font-medium text-[#333]">{user.nombre}</div>
              <div className="text-xs text-[#aaa]">{user.email}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2.5 rounded-xl hover:bg-[#f5f5f5] text-[#bbb] hover:text-danger transition-colors cursor-pointer"
            title="Cerrar sesion"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      )}
    </header>
  );
}
