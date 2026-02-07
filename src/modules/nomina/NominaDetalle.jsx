import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNominaDetalle } from '../../hooks/useNomina';
import { useList } from '../../hooks/useCrud';
import { ESTADOS_NOMINA, TIPOS_CONCEPTO_NOMINA } from '../../config/constants';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { exportToExcel } from '../../utils/exportHelpers';

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

export default function NominaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();

  // --- Data hooks ---
  const { data: detalle = [], isLoading: loadingDetalle } = useNominaDetalle(id);
  const { data: periodoData = [] } = useList('nomina_periodo', {
    filter: { id },
  });

  const periodo = periodoData[0] || {};

  // --- Computed summary ---
  const totales = useMemo(() => {
    const percepciones = detalle
      .filter((d) => d.concepto?.tipo === 'percepcion')
      .reduce((s, d) => s + Number(d.monto || 0), 0);
    const deducciones = detalle
      .filter((d) => d.concepto?.tipo === 'deduccion')
      .reduce((s, d) => s + Number(d.monto || 0), 0);
    return {
      percepciones,
      deducciones,
      neto: percepciones - deducciones,
    };
  }, [detalle]);

  const summaryCards = [
    { label: 'Total Percepciones', value: fmtMoney(totales.percepciones) },
    { label: 'Total Deducciones', value: fmtMoney(totales.deducciones) },
    { label: 'Neto', value: fmtMoney(totales.neto) },
  ];

  // --- Badge helpers ---
  const estadoBadge = (estado) => {
    const cfg = ESTADOS_NOMINA[estado];
    return cfg ? (
      <Badge variant={cfg.variant}>{cfg.label}</Badge>
    ) : (
      <Badge variant="default">{estado}</Badge>
    );
  };

  const tipoBadge = (tipo) => {
    const variants = { percepcion: 'success', deduccion: 'danger' };
    return variants[tipo] || 'default';
  };

  const tipoLabel = (tipo) => TIPOS_CONCEPTO_NOMINA[tipo] || tipo;

  // --- Export handler ---
  const handleExport = () => {
    const excelCols = [
      {
        key: 'numero_empleado',
        label: 'No. Empleado',
        getValue: (row) => row.empleado?.numero_empleado || '',
      },
      {
        key: 'nombre_empleado',
        label: 'Nombre',
        getValue: (row) => row.empleado?.nombre || '',
      },
      {
        key: 'clave_concepto',
        label: 'Clave Concepto',
        getValue: (row) => row.concepto?.clave || '',
      },
      {
        key: 'nombre_concepto',
        label: 'Concepto',
        getValue: (row) => row.concepto?.nombre || '',
      },
      {
        key: 'tipo_concepto',
        label: 'Tipo',
        getValue: (row) => tipoLabel(row.concepto?.tipo),
      },
      {
        key: 'monto',
        label: 'Monto',
        getValue: (row) => Number(row.monto || 0),
      },
    ];
    exportToExcel(
      detalle,
      excelCols,
      `nomina_detalle_q${periodo.numero_quincena || id}`
    );
  };

  // --- Table columns ---
  const columns = useMemo(
    () => [
      {
        key: 'empleado',
        label: 'No. Empleado',
        width: '120px',
        render: (_val, row) => row.empleado?.numero_empleado || '\u2014',
      },
      {
        key: 'empleado_nombre',
        label: 'Nombre',
        render: (_val, row) => row.empleado?.nombre || '\u2014',
      },
      {
        key: 'concepto_clave',
        label: 'Clave',
        width: '100px',
        render: (_val, row) => row.concepto?.clave || '\u2014',
      },
      {
        key: 'concepto_nombre',
        label: 'Concepto',
        render: (_val, row) => row.concepto?.nombre || '\u2014',
      },
      {
        key: 'concepto_tipo',
        label: 'Tipo',
        width: '130px',
        render: (_val, row) => {
          const tipo = row.concepto?.tipo;
          return tipo ? (
            <Badge variant={tipoBadge(tipo)}>{tipoLabel(tipo)}</Badge>
          ) : (
            '\u2014'
          );
        },
      },
      {
        key: 'monto',
        label: 'Monto',
        width: '150px',
        render: (val) => (
          <span className="text-right block tabular-nums">
            {fmtMoney(val)}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/nomina/periodos')}
            className="inline-flex items-center justify-center w-9 h-9 rounded-md text-text-secondary hover:bg-bg-hover hover:text-text-heading transition-colors cursor-pointer"
            aria-label="Regresar"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              Detalle de Nomina — Quincena {periodo.numero_quincena || ''}
            </h1>
            <p className="text-sm text-text-muted mt-1">
              {periodo.fecha_inicio
                ? new Date(periodo.fecha_inicio).toLocaleDateString('es-MX')
                : ''}
              {periodo.fecha_inicio && periodo.fecha_fin ? ' al ' : ''}
              {periodo.fecha_fin
                ? new Date(periodo.fecha_fin).toLocaleDateString('es-MX')
                : ''}
              {periodo.estado && (
                <span className="ml-3 inline-block">{estadoBadge(periodo.estado)}</span>
              )}
            </p>
          </div>
        </div>
        <Button onClick={handleExport} variant="outline-primary" size="sm">
          Exportar Excel
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg card-shadow p-4">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
              {card.label}
            </p>
            <p className="text-lg font-bold text-text-primary">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-secondary">
          Detalle
          <span className="ml-2 text-text-muted font-normal">
            ({detalle.length} registros)
          </span>
        </h2>
      </div>

      {/* Data table */}
      {loadingDetalle ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando detalle de nomina...
        </div>
      ) : (
        <DataTable columns={columns} data={detalle} />
      )}
    </div>
  );
}
