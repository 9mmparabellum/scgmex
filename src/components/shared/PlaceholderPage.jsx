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
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 bg-[#f0f0f0] rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-[#999] font-semibold text-sm">{modulo}</span>
        </div>
        <h1 className="text-lg font-semibold text-[#111] mb-1">{title}</h1>
        <p className="text-sm text-[#999] mb-4">
          {MODULO_NAMES[modulo] || modulo}
        </p>
        <span className="inline-block px-3 py-1.5 bg-[#f5f5f5] text-[#999] rounded-full text-xs font-medium">
          En desarrollo
        </span>
      </div>
    </div>
  );
}
