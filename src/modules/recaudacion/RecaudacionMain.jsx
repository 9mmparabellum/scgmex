import { useResumenRecaudacion } from '../../hooks/useRecaudacion';

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

export default function RecaudacionMain() {
  const { data: resumen = {}, isLoading } = useResumenRecaudacion();

  const totalContribuyentes = resumen.totalContribuyentes || 0;
  const totalPadron = resumen.totalPadron || 0;
  const totalCobros = resumen.totalCobros || 0;
  const montoRecaudado = resumen.montoRecaudado || 0;
  const montoPendiente = resumen.montoPendiente || 0;

  const cards = [
    { label: 'Total Contribuyentes', value: totalContribuyentes, isMoney: false },
    { label: 'Total Padron', value: totalPadron, isMoney: false },
    { label: 'Total Cobros', value: totalCobros, isMoney: false },
    { label: 'Monto Recaudado', value: montoRecaudado, isMoney: true },
    { label: 'Monto Pendiente', value: montoPendiente, isMoney: true },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Recaudacion</h1>
        <p className="text-sm text-text-muted mt-1">
          Gestion de contribuyentes, padron fiscal y cobros del ente publico
        </p>
      </div>

      {/* Summary cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando resumen de recaudacion...
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
          El modulo de Recaudacion permite gestionar el ciclo completo de ingresos propios del ente publico,
          desde el registro de contribuyentes, la administracion del padron fiscal con las obligaciones
          tributarias, hasta el control y seguimiento de cobros realizados. Incluye control de estados
          y formas de pago conforme a la normatividad aplicable.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="border border-border rounded-md p-3">
            <h3 className="text-sm font-semibold text-text-primary mb-1">Contribuyentes</h3>
            <p className="text-xs text-text-muted">
              Padron de contribuyentes con datos fiscales, de contacto y tipo de persona.
            </p>
          </div>
          <div className="border border-border rounded-md p-3">
            <h3 className="text-sm font-semibold text-text-primary mb-1">Padron Fiscal</h3>
            <p className="text-xs text-text-muted">
              Registro de obligaciones fiscales con claves catastrales, tasas y montos determinados.
            </p>
          </div>
          <div className="border border-border rounded-md p-3">
            <h3 className="text-sm font-semibold text-text-primary mb-1">Cobros</h3>
            <p className="text-xs text-text-muted">
              Control de cobros realizados con formas de pago, folios y seguimiento de estados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
