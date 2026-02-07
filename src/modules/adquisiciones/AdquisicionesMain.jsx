import { useResumenAdquisiciones } from '../../hooks/useAdquisiciones';

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

export default function AdquisicionesMain() {
  const { data: resumen = {}, isLoading } = useResumenAdquisiciones();

  const totalProveedores = resumen.totalProveedores || 0;
  const totalRequisiciones = resumen.totalRequisiciones || 0;
  const montoRequisiciones = resumen.montoRequisiciones || 0;
  const totalOrdenes = resumen.totalOrdenes || 0;
  const montoOrdenes = resumen.montoOrdenes || 0;

  const cards = [
    { label: 'Total Proveedores', value: totalProveedores, isMoney: false },
    { label: 'Total Requisiciones', value: totalRequisiciones, isMoney: false },
    { label: 'Monto Requisiciones', value: montoRequisiciones, isMoney: true },
    { label: 'Total Ordenes', value: totalOrdenes, isMoney: false },
    { label: 'Monto Ordenes', value: montoOrdenes, isMoney: true },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Adquisiciones</h1>
        <p className="text-sm text-text-muted mt-1">
          Gestion de proveedores, requisiciones y ordenes de compra del ente publico
        </p>
      </div>

      {/* Summary cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando resumen de adquisiciones...
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
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
          El modulo de Adquisiciones permite gestionar el ciclo completo de compras gubernamentales,
          desde el registro y administracion de proveedores, la generacion de requisiciones de compra,
          hasta la emision y seguimiento de ordenes de compra. Incluye control de estados y flujos
          de autorizacion conforme a la normatividad aplicable.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="border border-border rounded-md p-3">
            <h3 className="text-sm font-semibold text-text-primary mb-1">Proveedores</h3>
            <p className="text-xs text-text-muted">
              Padron de proveedores con datos fiscales, bancarios y de contacto.
            </p>
          </div>
          <div className="border border-border rounded-md p-3">
            <h3 className="text-sm font-semibold text-text-primary mb-1">Requisiciones</h3>
            <p className="text-xs text-text-muted">
              Solicitudes de compra con flujo de autorizacion y seguimiento de estados.
            </p>
          </div>
          <div className="border border-border rounded-md p-3">
            <h3 className="text-sm font-semibold text-text-primary mb-1">Ordenes de Compra</h3>
            <p className="text-xs text-text-muted">
              Generacion y seguimiento de ordenes de compra vinculadas a proveedores.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
