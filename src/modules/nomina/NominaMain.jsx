import { useResumenNomina } from '../../hooks/useNomina';

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

export default function NominaMain() {
  const { data: resumen = {}, isLoading } = useResumenNomina();

  const cards = [
    { label: 'Empleados Activos', value: resumen.totalEmpleados || 0, isMoney: false },
    { label: 'Total Quincenas', value: resumen.totalQuincenas || 0, isMoney: false },
    { label: 'Total Percepciones', value: resumen.totalPercepciones || 0, isMoney: true },
    { label: 'Total Deducciones', value: resumen.totalDeducciones || 0, isMoney: true },
    { label: 'Total Neto', value: resumen.totalNeto || 0, isMoney: true },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-text-muted text-sm">
        Cargando resumen de nomina...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Nomina</h1>
        <p className="text-sm text-text-muted mt-1">
          Resumen de nomina — Empleados, quincenas y totales del ejercicio
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg card-shadow p-4">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
              {card.label}
            </p>
            <p className="text-lg font-bold text-text-primary">
              {card.isMoney ? fmtMoney(card.value) : card.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
