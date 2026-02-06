const MODULO_NAMES = {
  M1: 'Configuracion',
  M2: 'Catalogo',
  M3: 'Contabilidad',
  M4: 'Presupuesto de Egresos',
  M5: 'Presupuesto de Ingresos',
  M6: 'Patrimonio',
  M7: 'Deuda Publica',
  M8: 'Estados Financieros',
  M9: 'Cuenta Publica',
  M10: 'Transparencia',
  M11: 'Fondos Federales',
  M12: 'Seguridad y Auditoria',
  M13: 'Dashboard',
};

export default function PlaceholderPage({ title, modulo }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-white border-0 rounded-lg card-shadow w-full max-w-md">
        <div className="px-8 py-12 flex flex-col items-center text-center">
          {/* Module code badge */}
          <div className="w-14 h-14 bg-guinda/10 rounded-lg flex items-center justify-center mb-5">
            <span className="text-guinda font-bold text-sm tracking-wide">{modulo}</span>
          </div>

          {/* Title */}
          <h1 className="text-lg font-semibold text-text-heading mb-1">{title}</h1>

          {/* Subtitle (module full name) */}
          <p className="text-sm text-text-muted mb-5">
            {MODULO_NAMES[modulo] || modulo}
          </p>

          {/* En desarrollo badge */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#ffab00]/10 text-[#ffab00] rounded-full text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ffab00]" />
            En desarrollo
          </span>
        </div>
      </div>
    </div>
  );
}
