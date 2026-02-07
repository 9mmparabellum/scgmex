import { useResumenCFDI } from '../../hooks/useCFDI';

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

export default function CFDIMain() {
  const { data: resumen = {}, isLoading } = useResumenCFDI();

  const totalEmitidos = resumen.totalEmitidos || 0;
  const montoEmitidos = resumen.montoEmitidos || 0;
  const totalRecibidos = resumen.totalRecibidos || 0;
  const montoRecibidos = resumen.montoRecibidos || 0;

  const cards = [
    { label: 'Total Emitidos', value: totalEmitidos, isMoney: false },
    { label: 'Monto Emitidos', value: montoEmitidos, isMoney: true },
    { label: 'Total Recibidos', value: totalRecibidos, isMoney: false },
    { label: 'Monto Recibidos', value: montoRecibidos, isMoney: true },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">
          Comprobantes Fiscales Digitales (CFDI)
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Gestion de CFDI emitidos y recibidos del ente publico
        </p>
      </div>

      {/* Summary cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando resumen de CFDI...
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {cards.map((card) => (
            <div key={card.label} className="bg-white rounded-lg card-shadow p-4">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-1">{card.label}</p>
              <p className="text-lg font-bold text-text-primary">
                {card.isMoney ? fmtMoney(card.value) : card.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Module description */}
      <div className="bg-white rounded-lg card-shadow p-5">
        <h2 className="text-sm font-semibold text-text-secondary mb-3">Acerca del Modulo</h2>
        <p className="text-sm text-text-muted leading-relaxed">
          El modulo de Comprobantes Fiscales Digitales por Internet (CFDI) permite gestionar
          los comprobantes fiscales emitidos y recibidos por el ente publico, incluyendo el
          registro, consulta y control de estado de cada comprobante conforme a las disposiciones
          fiscales vigentes del SAT.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="border border-border rounded-md p-3">
            <h3 className="text-sm font-semibold text-text-primary mb-1">Emitidos</h3>
            <p className="text-xs text-text-muted">
              CFDI emitidos por el ente publico a terceros, con control de serie, folio y UUID.
            </p>
          </div>
          <div className="border border-border rounded-md p-3">
            <h3 className="text-sm font-semibold text-text-primary mb-1">Recibidos</h3>
            <p className="text-xs text-text-muted">
              CFDI recibidos de proveedores y prestadores de servicios, con seguimiento de pago.
            </p>
          </div>
          <div className="border border-border rounded-md p-3">
            <h3 className="text-sm font-semibold text-text-primary mb-1">Timbrado</h3>
            <p className="text-xs text-text-muted">
              Validacion y control del estado de timbrado ante el SAT (vigente, cancelado, pendiente).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
