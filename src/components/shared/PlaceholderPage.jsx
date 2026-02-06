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
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-bg-card rounded border border-border p-10 text-center max-w-md">
        <div className="w-16 h-16 bg-guinda/10 rounded flex items-center justify-center mx-auto mb-4">
          <span className="text-guinda font-bold text-lg">{modulo}</span>
        </div>
        <h1 className="text-xl font-bold text-text-primary mb-2">{title}</h1>
        <p className="text-sm text-text-muted mb-4">
          Modulo {MODULO_NAMES[modulo] || modulo}
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-dorado/10 text-dorado-dark rounded text-xs font-medium">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="8" r="6" />
            <path d="M8 5v3M8 10h.01" />
          </svg>
          En desarrollo — Proximamente
        </div>
      </div>
    </div>
  );
}
