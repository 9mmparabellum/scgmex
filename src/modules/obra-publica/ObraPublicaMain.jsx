import { useResumenObraPublica } from '../../hooks/useObraPublica';

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

export default function ObraPublicaMain() {
  const { data: resumen = {}, isLoading } = useResumenObraPublica();

  const totalProyectos = resumen.totalProyectos || 0;
  const montoContratado = resumen.montoContratado || 0;
  const avanceFisicoPromedio = resumen.avanceFisicoPromedio || 0;
  const enProceso = resumen.enProceso || 0;
  const totalEstimaciones = resumen.totalEstimaciones || 0;
  const montoEstimaciones = resumen.montoEstimaciones || 0;

  const cards = [
    { label: 'Total Proyectos', value: totalProyectos, isMoney: false },
    { label: 'Monto Contratado', value: montoContratado, isMoney: true },
    { label: 'Avance Fisico Prom', value: `${avanceFisicoPromedio.toFixed(1)}%`, isMoney: false },
    { label: 'En Proceso', value: enProceso, isMoney: false },
    { label: 'Total Estimaciones', value: totalEstimaciones, isMoney: false },
    { label: 'Monto Estimaciones', value: montoEstimaciones, isMoney: true },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Obra Publica</h1>
        <p className="text-sm text-text-muted mt-1">
          Gestion de proyectos de obra publica, servicios relacionados y estimaciones
        </p>
      </div>

      {/* Summary cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando resumen de obra publica...
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
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
          El modulo de Obra Publica permite gestionar el ciclo completo de proyectos de obra publica
          y servicios relacionados, desde la planeacion y contratacion hasta el seguimiento de
          estimaciones y avance fisico-financiero. Incluye control de estados, modalidades de
          contratacion y generacion de reportes conforme a la normatividad aplicable.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="border border-border rounded-md p-3">
            <h3 className="text-sm font-semibold text-text-primary mb-1">Proyectos</h3>
            <p className="text-xs text-text-muted">
              Registro y seguimiento de proyectos de obra publica con control de montos,
              contratistas y avance fisico.
            </p>
          </div>
          <div className="border border-border rounded-md p-3">
            <h3 className="text-sm font-semibold text-text-primary mb-1">Estimaciones</h3>
            <p className="text-xs text-text-muted">
              Gestion de estimaciones por proyecto con flujo de revision, aprobacion y pago.
            </p>
          </div>
          <div className="border border-border rounded-md p-3">
            <h3 className="text-sm font-semibold text-text-primary mb-1">Seguimiento</h3>
            <p className="text-xs text-text-muted">
              Monitoreo del avance fisico-financiero y estados de los proyectos de obra publica.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
