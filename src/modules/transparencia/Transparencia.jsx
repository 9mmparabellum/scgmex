import { useState, useMemo } from 'react';
import { useList } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import {
  useEstadoSituacionFinanciera,
  useEstadoActividades,
} from '../../hooks/useReportes';
import { useResumenEgresos, useResumenIngresos } from '../../hooks/usePresupuesto';
import { useResumenPatrimonio } from '../../hooks/usePatrimonio';
import { useResumenDeuda } from '../../hooks/useDeuda';
import { useResumenFondos } from '../../hooks/useFondosFederales';
import { useSaldosCuenta } from '../../hooks/usePoliza';
import Button from '../../components/ui/Button';
import { exportToExcel } from '../../utils/exportHelpers';
import { exportToPdf } from '../../utils/exportPdfHelpers';

const reports = [
  {
    key: 'situacion',
    title: 'Estado de Situacion Financiera',
    desc: 'Balance general del ente publico',
    icon: 'balance',
  },
  {
    key: 'actividades',
    title: 'Estado de Actividades',
    desc: 'Ingresos y gastos del ejercicio',
    icon: 'activity',
  },
  {
    key: 'balanza',
    title: 'Balanza de Comprobacion',
    desc: 'Saldos por cuenta contable',
    icon: 'scale',
  },
  {
    key: 'egresos',
    title: 'Presupuesto de Egresos',
    desc: 'Comparativo por momento del gasto',
    icon: 'expense',
  },
  {
    key: 'ingresos',
    title: 'Presupuesto de Ingresos',
    desc: 'Comparativo por momento del ingreso',
    icon: 'income',
  },
  {
    key: 'deuda',
    title: 'Deuda Publica',
    desc: 'Situacion de la deuda del ente',
    icon: 'debt',
  },
  {
    key: 'patrimonio',
    title: 'Bienes Patrimoniales',
    desc: 'Inventario de bienes publicos',
    icon: 'building',
  },
  {
    key: 'fondos',
    title: 'Fondos Federales',
    desc: 'Participaciones y aportaciones',
    icon: 'fund',
  },
  {
    key: 'indicadores',
    title: 'Indicadores de Gestion',
    desc: 'Indicadores financieros y presupuestales',
    icon: 'chart',
  },
];

/* ------------------------------------------------------------------ */
/*  Icon component                                                     */
/* ------------------------------------------------------------------ */
function ReportIcon({ type }) {
  const base = 'w-5 h-5 text-guinda';
  const svgProps = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className: base,
  };

  switch (type) {
    case 'balance':
      return (
        <svg {...svgProps}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18" />
          <path d="M9 21V9" />
        </svg>
      );
    case 'activity':
      return (
        <svg {...svgProps}>
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      );
    case 'scale':
      return (
        <svg {...svgProps}>
          <path d="M12 3v18" />
          <path d="M5 6l7-3 7 3" />
          <path d="M2 14l3-8 3 8a5.5 5.5 0 01-6 0z" />
          <path d="M16 14l3-8 3 8a5.5 5.5 0 01-6 0z" />
        </svg>
      );
    case 'expense':
      return (
        <svg {...svgProps}>
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
      );
    case 'income':
      return (
        <svg {...svgProps}>
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
      );
    case 'debt':
      return (
        <svg {...svgProps}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case 'building':
      return (
        <svg {...svgProps}>
          <path d="M3 21h18" />
          <path d="M5 21V7l8-4v18" />
          <path d="M19 21V11l-6-4" />
          <path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01" />
        </svg>
      );
    case 'fund':
      return (
        <svg {...svgProps}>
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
        </svg>
      );
    case 'chart':
      return (
        <svg {...svgProps}>
          <path d="M18 20V10M12 20V4M6 20v-6" />
        </svg>
      );
    default:
      return (
        <svg {...svgProps}>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      );
  }
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function Transparencia() {
  const { ejercicioFiscal } = useAppStore();
  const [exporting, setExporting] = useState(null);

  /* --- Periodos (derive last) --- */
  const { data: periodos = [] } = useList('periodo_contable', {
    filter: { ejercicio_id: ejercicioFiscal?.id },
    order: { column: 'numero', ascending: true },
  });

  const lastPeriodoId = periodos.length ? periodos[periodos.length - 1].id : null;

  /* --- Data hooks --- */
  const { data: situacion } = useEstadoSituacionFinanciera(lastPeriodoId);
  const { data: actividades } = useEstadoActividades(lastPeriodoId);
  const { data: saldos = [] } = useSaldosCuenta(lastPeriodoId);
  const { data: resumenEgresos } = useResumenEgresos();
  const { data: resumenIngresos } = useResumenIngresos();
  const { data: resumenDeuda } = useResumenDeuda();
  const { data: resumenPatrimonio } = useResumenPatrimonio();
  const { data: resumenFondos } = useResumenFondos();

  /* --- Indicadores computed --- */
  const indicadores = useMemo(() => {
    const aprobado = resumenEgresos?.aprobado || 0;
    const ejercido = resumenEgresos?.ejercido || 0;
    const estimado = resumenIngresos?.estimado || 0;
    const recaudado = resumenIngresos?.recaudado || 0;

    return {
      pct_gasto: aprobado > 0 ? ((ejercido / aprobado) * 100).toFixed(2) : '0.00',
      pct_ingreso: estimado > 0 ? ((recaudado / estimado) * 100).toFixed(2) : '0.00',
      aprobado,
      ejercido,
      estimado,
      recaudado,
    };
  }, [resumenEgresos, resumenIngresos]);

  /* --- Export map --- */
  const exportMap = useMemo(
    () => ({
      situacion: () => {
        const rows = [
          ...(situacion?.activo?.cuentas || []).map((r) => ({ seccion: 'ACTIVO', codigo: r.codigo, nombre: r.nombre, saldo_final: r.saldo_final })),
          ...(situacion?.pasivo?.cuentas || []).map((r) => ({ seccion: 'PASIVO', codigo: r.codigo, nombre: r.nombre, saldo_final: r.saldo_final })),
          ...(situacion?.hacienda?.cuentas || []).map((r) => ({ seccion: 'HACIENDA', codigo: r.codigo, nombre: r.nombre, saldo_final: r.saldo_final })),
        ];
        exportToExcel(
          rows,
          [
            { key: 'seccion', label: 'Seccion' },
            { key: 'codigo', label: 'Codigo' },
            { key: 'nombre', label: 'Nombre' },
            { key: 'saldo_final', label: 'Saldo Final' },
          ],
          'transparencia_situacion_financiera'
        );
      },
      actividades: () => {
        const rows = [
          ...(actividades?.ingresos?.cuentas || []).map((r) => ({ seccion: 'INGRESOS', codigo: r.codigo, nombre: r.nombre, monto: r.monto })),
          ...(actividades?.gastos?.cuentas || []).map((r) => ({ seccion: 'GASTOS', codigo: r.codigo, nombre: r.nombre, monto: r.monto })),
        ];
        exportToExcel(
          rows,
          [
            { key: 'seccion', label: 'Seccion' },
            { key: 'codigo', label: 'Codigo' },
            { key: 'nombre', label: 'Nombre' },
            { key: 'monto', label: 'Monto' },
          ],
          'transparencia_actividades'
        );
      },
      balanza: () => {
        exportToExcel(
          saldos,
          [
            { key: 'codigo', label: 'Codigo' },
            { key: 'nombre', label: 'Nombre' },
            { key: 'saldo_inicial', label: 'Saldo Inicial' },
            { key: 'total_debe', label: 'Debe' },
            { key: 'total_haber', label: 'Haber' },
            { key: 'saldo_final', label: 'Saldo Final' },
          ],
          'transparencia_balanza_comprobacion'
        );
      },
      egresos: () => {
        const aprobado = resumenEgresos?.aprobado || 0;
        const ejercido = resumenEgresos?.ejercido || 0;
        const pagado = resumenEgresos?.pagado || 0;
        exportToExcel(
          [{ aprobado, ejercido, pagado }],
          [
            { key: 'aprobado', label: 'Aprobado' },
            { key: 'ejercido', label: 'Ejercido' },
            { key: 'pagado', label: 'Pagado' },
          ],
          'transparencia_presupuesto_egresos'
        );
      },
      ingresos: () => {
        const estimado = resumenIngresos?.estimado || 0;
        const recaudado = resumenIngresos?.recaudado || 0;
        exportToExcel(
          [{ estimado, recaudado }],
          [
            { key: 'estimado', label: 'Estimado' },
            { key: 'recaudado', label: 'Recaudado' },
          ],
          'transparencia_presupuesto_ingresos'
        );
      },
      deuda: () => {
        exportToExcel(
          [resumenDeuda || {}],
          [
            { key: 'saldo_total', label: 'Saldo Total' },
            { key: 'total_instrumentos', label: 'Total Instrumentos' },
          ],
          'transparencia_deuda_publica'
        );
      },
      patrimonio: () => {
        exportToExcel(
          [resumenPatrimonio || {}],
          [
            { key: 'muebles', label: 'Bienes Muebles' },
            { key: 'inmuebles', label: 'Bienes Inmuebles' },
            { key: 'intangibles', label: 'Bienes Intangibles' },
            { key: 'valor_neto', label: 'Valor Neto Total' },
          ],
          'transparencia_bienes_patrimoniales'
        );
      },
      fondos: () => {
        exportToExcel(
          [resumenFondos || {}],
          [
            { key: 'participaciones', label: 'Participaciones' },
            { key: 'aportaciones', label: 'Aportaciones' },
            { key: 'total', label: 'Total Fondos' },
          ],
          'transparencia_fondos_federales'
        );
      },
      indicadores: () => {
        exportToExcel(
          [
            {
              indicador: 'Porcentaje de Gasto Ejercido',
              valor: `${indicadores.pct_gasto}%`,
              aprobado: indicadores.aprobado,
              ejercido: indicadores.ejercido,
            },
            {
              indicador: 'Porcentaje de Ingreso Recaudado',
              valor: `${indicadores.pct_ingreso}%`,
              estimado: indicadores.estimado,
              recaudado: indicadores.recaudado,
            },
          ],
          [
            { key: 'indicador', label: 'Indicador' },
            { key: 'valor', label: 'Valor' },
            { key: 'aprobado', label: 'Aprobado' },
            { key: 'ejercido', label: 'Ejercido' },
            { key: 'estimado', label: 'Estimado' },
            { key: 'recaudado', label: 'Recaudado' },
          ],
          'transparencia_indicadores'
        );
      },
    }),
    [situacion, actividades, saldos, resumenEgresos, resumenIngresos, resumenDeuda, resumenPatrimonio, resumenFondos, indicadores]
  );

  /* --- Handlers --- */
  const handleExport = (key) => {
    setExporting(key);
    try {
      const fn = exportMap[key];
      if (fn) fn();
    } finally {
      setTimeout(() => setExporting(null), 600);
    }
  };

  const handleGenerarPaquete = () => {
    reports.forEach((report, i) => {
      setTimeout(() => {
        const fn = exportMap[report.key];
        if (fn) fn();
      }, i * 300);
    });
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Transparencia</h1>
        <p className="text-sm text-text-muted mt-1">
          Art. 56-59 LGCG — Informacion financiera para portales de transparencia
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-guinda/5 border border-guinda/20 rounded-lg p-4 mb-6">
        <p className="text-sm text-guinda">
          Genere los reportes requeridos por la Ley General de Contabilidad Gubernamental para su
          publicacion en portales de transparencia.
        </p>
      </div>

      {/* Report cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {reports.map((report) => (
          <div key={report.key} className="bg-white rounded-lg card-shadow p-5 flex flex-col">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-guinda/10 flex items-center justify-center flex-shrink-0">
                <ReportIcon type={report.icon} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary">{report.title}</h3>
                <p className="text-xs text-text-muted mt-0.5">{report.desc}</p>
              </div>
            </div>
            <div className="mt-auto pt-3">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => handleExport(report.key)}
                loading={exporting === report.key}
                className="w-full"
              >
                Generar Reporte
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom action bar */}
      <div className="bg-white rounded-lg card-shadow p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Paquete Completo</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Genera todos los reportes de transparencia en archivos Excel individuales
            </p>
          </div>
          <Button onClick={handleGenerarPaquete}>
            Generar Paquete Completo de Transparencia
          </Button>
        </div>
      </div>
    </div>
  );
}
