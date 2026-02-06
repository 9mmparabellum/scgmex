import { useMemo } from 'react';
import { useList } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { useEstadoSituacionFinanciera } from '../../hooks/useReportes';
import { useResumenEgresos, useResumenIngresos } from '../../hooks/usePresupuesto';
import { useResumenPatrimonio } from '../../hooks/usePatrimonio';
import { useResumenDeuda } from '../../hooks/useDeuda';
import Button from '../../components/ui/Button';
import { exportToExcel } from '../../utils/exportHelpers';

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

/* ------------------------------------------------------------------ */
/*  Reusable summary card                                              */
/* ------------------------------------------------------------------ */
function SummaryCard({ title, rows, onExport }) {
  return (
    <div className="bg-white rounded-lg card-shadow p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        <Button variant="ghost" size="sm" onClick={onExport}>
          Exportar
        </Button>
      </div>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between text-sm">
            <span className="text-text-muted">{row.label}</span>
            <span className="font-semibold font-mono">{fmtMoney(row.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function CuentaPublica() {
  const { ejercicioFiscal } = useAppStore();

  /* --- Periodos (to derive the last one) --- */
  const { data: periodos = [] } = useList('periodo_contable', {
    filter: { ejercicio_id: ejercicioFiscal?.id },
    order: { column: 'numero', ascending: true },
  });

  const lastPeriodoId = periodos.length ? periodos[periodos.length - 1].id : null;

  /* --- Data hooks --- */
  const { data: situacion } = useEstadoSituacionFinanciera(lastPeriodoId);
  const { data: resumenEgresos } = useResumenEgresos();
  const { data: resumenIngresos } = useResumenIngresos();
  const { data: resumenPatrimonio } = useResumenPatrimonio();
  const { data: resumenDeuda } = useResumenDeuda();

  /* --- Derived values --- */
  const totalActivo = situacion?.activo?.total || 0;
  const totalPasivo = situacion?.pasivo?.total || 0;
  const totalHacienda = situacion?.hacienda?.total || 0;

  const aprobado = resumenEgresos?.aprobado || 0;
  const ejercido = resumenEgresos?.ejercido || 0;
  const pagado = resumenEgresos?.pagado || 0;

  const estimado = resumenIngresos?.estimado || 0;
  const recaudado = resumenIngresos?.recaudado || 0;

  const totalBienes =
    (resumenPatrimonio?.muebles || 0) +
    (resumenPatrimonio?.inmuebles || 0) +
    (resumenPatrimonio?.intangibles || 0);
  const valorNetoTotal = resumenPatrimonio?.valor_neto || 0;

  const saldoDeuda = resumenDeuda?.saldo_total || 0;
  const totalInstrumentos = resumenDeuda?.total_instrumentos || 0;

  /* --- Export handlers --- */
  const exportFinanciera = () => {
    const rows = [
      ...(situacion?.activo?.cuentas || []).map((r) => ({ seccion: 'ACTIVO', ...r })),
      ...(situacion?.pasivo?.cuentas || []).map((r) => ({ seccion: 'PASIVO', ...r })),
      ...(situacion?.hacienda?.cuentas || []).map((r) => ({ seccion: 'HACIENDA', ...r })),
    ];
    exportToExcel(
      rows,
      [
        { key: 'seccion', label: 'Seccion' },
        { key: 'codigo', label: 'Codigo' },
        { key: 'nombre', label: 'Nombre' },
        { key: 'saldo_final', label: 'Saldo Final' },
      ],
      'cuenta_publica_financiera'
    );
  };

  const exportEgresos = () => {
    exportToExcel(
      [{ aprobado, ejercido, pagado }],
      [
        { key: 'aprobado', label: 'Aprobado' },
        { key: 'ejercido', label: 'Ejercido' },
        { key: 'pagado', label: 'Pagado' },
      ],
      'cuenta_publica_egresos'
    );
  };

  const exportIngresos = () => {
    exportToExcel(
      [{ estimado, recaudado }],
      [
        { key: 'estimado', label: 'Estimado' },
        { key: 'recaudado', label: 'Recaudado' },
      ],
      'cuenta_publica_ingresos'
    );
  };

  const exportPatrimonio = () => {
    exportToExcel(
      [{ total_bienes: totalBienes, valor_neto: valorNetoTotal }],
      [
        { key: 'total_bienes', label: 'Total Bienes' },
        { key: 'valor_neto', label: 'Valor Neto Total' },
      ],
      'cuenta_publica_patrimonio'
    );
  };

  const exportDeuda = () => {
    exportToExcel(
      [{ saldo_total: saldoDeuda, total_instrumentos: totalInstrumentos }],
      [
        { key: 'saldo_total', label: 'Saldo Total' },
        { key: 'total_instrumentos', label: 'Total Instrumentos' },
      ],
      'cuenta_publica_deuda'
    );
  };

  const handleGenerarCompleta = () => {
    exportFinanciera();
    exportEgresos();
    exportIngresos();
    exportPatrimonio();
    exportDeuda();
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Cuenta Publica</h1>
        <p className="text-sm text-text-muted mt-1">
          Compilacion anual de informacion financiera y presupuestal conforme a la LGCG
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-guinda/5 border border-guinda/20 rounded-lg p-4 mb-6">
        <p className="text-sm text-guinda">
          La Cuenta Publica integra la informacion contable, presupuestaria y programatica del
          ejercicio fiscal {ejercicioFiscal?.anio}.
        </p>
      </div>

      {/* Section cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Card 1: Informacion Financiera */}
        <SummaryCard
          title="Informacion Financiera"
          onExport={exportFinanciera}
          rows={[
            { label: 'Total Activos', value: totalActivo },
            { label: 'Total Pasivos', value: totalPasivo },
            { label: 'Total Hacienda', value: totalHacienda },
          ]}
        />

        {/* Card 2: Presupuesto de Egresos */}
        <SummaryCard
          title="Presupuesto de Egresos"
          onExport={exportEgresos}
          rows={[
            { label: 'Aprobado', value: aprobado },
            { label: 'Ejercido', value: ejercido },
            { label: 'Pagado', value: pagado },
          ]}
        />

        {/* Card 3: Presupuesto de Ingresos */}
        <SummaryCard
          title="Presupuesto de Ingresos"
          onExport={exportIngresos}
          rows={[
            { label: 'Estimado', value: estimado },
            { label: 'Recaudado', value: recaudado },
          ]}
        />

        {/* Card 4: Patrimonio */}
        <SummaryCard
          title="Patrimonio"
          onExport={exportPatrimonio}
          rows={[
            { label: 'Total Bienes', value: totalBienes },
            { label: 'Valor Neto Total', value: valorNetoTotal },
          ]}
        />

        {/* Card 5: Deuda Publica */}
        <SummaryCard
          title="Deuda Publica"
          onExport={exportDeuda}
          rows={[
            { label: 'Saldo Total', value: saldoDeuda },
            { label: 'Total Instrumentos', value: totalInstrumentos },
          ]}
        />
      </div>

      {/* Bottom action bar */}
      <div className="bg-white rounded-lg card-shadow p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Paquete Completo</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Genera todas las secciones de la Cuenta Publica en archivos Excel individuales
            </p>
          </div>
          <Button onClick={handleGenerarCompleta}>
            Generar Cuenta Publica Completa
          </Button>
        </div>
      </div>
    </div>
  );
}
