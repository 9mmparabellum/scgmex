import { useState, useMemo } from 'react';
import { useList } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import {
  useEstadoSituacionFinanciera,
  useEstadoActividades,
  useEstadoVariacionHacienda,
  useEstadoAnaliticoActivo,
} from '../../hooks/useReportes';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import { exportToExcel } from '../../utils/exportHelpers';

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

const TABS = [
  { key: 'situacion', label: 'Situacion Financiera' },
  { key: 'actividades', label: 'Actividades' },
  { key: 'variacion', label: 'Variacion Hacienda' },
  { key: 'analitico', label: 'Analitico Activo' },
  { key: 'notas', label: 'Notas' },
];

/* ------------------------------------------------------------------ */
/*  Reusable sub-table for financial statement sections                */
/* ------------------------------------------------------------------ */
function SectionTable({ title, rows = [], totalLabel, total, columns }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2 px-1">
        {title}
      </h3>
      <div className="bg-white rounded-lg card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f9fafb]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5 ${
                      col.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-6 text-center text-sm text-text-muted">
                    Sin datos
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={i} className="border-b border-[#f0f0f0] hover:bg-[#f9fafb]">
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-5 py-3 text-sm ${col.align === 'right' ? 'text-right font-mono' : ''} ${
                          col.key === 'codigo' ? 'font-mono' : ''
                        }`}
                      >
                        {col.format ? col.format(row[col.key]) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
            {totalLabel != null && (
              <tfoot>
                <tr className="bg-[#f9fafb] font-bold border-t-2 border-guinda/20">
                  <td
                    colSpan={columns.length - 1}
                    className="px-5 py-3.5 text-sm text-right"
                  >
                    {totalLabel}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-right font-mono">
                    {fmtMoney(total)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function EstadosFinancieros() {
  const { ejercicioFiscal } = useAppStore();
  const [periodoId, setPeriodoId] = useState('');
  const [activeTab, setActiveTab] = useState('situacion');

  /* --- Periodos --- */
  const { data: periodos = [] } = useList('periodo_contable', {
    filter: { ejercicio_id: ejercicioFiscal?.id },
    order: { column: 'numero', ascending: true },
  });

  const periodoOptions = useMemo(
    () => periodos.map((p) => ({ value: p.id, label: p.nombre || `Periodo ${p.numero}` })),
    [periodos]
  );

  /* --- Data hooks (only fire when periodoId is truthy) --- */
  const { data: situacion, isLoading: loadingSituacion } = useEstadoSituacionFinanciera(periodoId);
  const { data: actividades, isLoading: loadingActividades } = useEstadoActividades(periodoId);
  const { data: variacion, isLoading: loadingVariacion } = useEstadoVariacionHacienda(periodoId);
  const { data: analitico, isLoading: loadingAnalitico } = useEstadoAnaliticoActivo(periodoId);

  /* --- Derived loading flag per tab --- */
  const isLoading = {
    situacion: loadingSituacion,
    actividades: loadingActividades,
    variacion: loadingVariacion,
    analitico: loadingAnalitico,
    notas: false,
  }[activeTab];

  /* --- Column definitions --- */
  const colsCodNomSaldo = [
    { key: 'codigo', label: 'Codigo' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'saldo_final', label: 'Saldo Final ($)', align: 'right', format: fmtMoney },
  ];

  const colsCodNomMonto = [
    { key: 'codigo', label: 'Codigo' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'monto', label: 'Monto ($)', align: 'right', format: fmtMoney },
  ];

  const colsAnalitico = [
    { key: 'codigo', label: 'Codigo' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'saldo_inicial', label: 'Saldo Inicial', align: 'right', format: fmtMoney },
    { key: 'debe', label: 'Debe', align: 'right', format: fmtMoney },
    { key: 'haber', label: 'Haber', align: 'right', format: fmtMoney },
    { key: 'saldo_final', label: 'Saldo Final', align: 'right', format: fmtMoney },
  ];

  /* --- Situacion Financiera helpers --- */
  const situacionActivo = useMemo(
    () => (situacion?.activo?.cuentas || []).filter((c) => (c.nivel || 0) >= 2),
    [situacion]
  );
  const situacionPasivo = useMemo(
    () => (situacion?.pasivo?.cuentas || []).filter((c) => (c.nivel || 0) >= 2),
    [situacion]
  );
  const situacionHacienda = useMemo(
    () => (situacion?.hacienda?.cuentas || []).filter((c) => (c.nivel || 0) >= 2),
    [situacion]
  );

  const totalActivo = situacion?.activo?.total || 0;
  const totalPasivo = situacion?.pasivo?.total || 0;
  const totalHacienda = situacion?.hacienda?.total || 0;
  const isBalanced = Math.abs(totalActivo - (totalPasivo + totalHacienda)) < 0.01;

  /* --- Actividades helpers --- */
  const actIngresos = actividades?.ingresos?.cuentas || [];
  const actGastos = actividades?.gastos?.cuentas || [];
  const totalIngresos = actividades?.ingresos?.total || 0;
  const totalGastos = actividades?.gastos?.total || 0;
  const resultado = totalIngresos - totalGastos;

  /* --- Variacion helpers --- */
  const varContribuida = variacion?.contribuida?.cuentas || [];
  const varGenerada = variacion?.generada?.cuentas || [];
  const varExceso = variacion?.exceso?.cuentas || [];

  /* --- Analitico helpers --- */
  const analiticoCuentas = analitico?.cuentas || [];
  const analiticoTotales = useMemo(
    () =>
      analiticoCuentas.reduce(
        (acc, r) => ({
          saldo_inicial: acc.saldo_inicial + (r.saldo_inicial || 0),
          debe: acc.debe + (r.debe || 0),
          haber: acc.haber + (r.haber || 0),
          saldo_final: acc.saldo_final + (r.saldo_final || 0),
        }),
        { saldo_inicial: 0, debe: 0, haber: 0, saldo_final: 0 }
      ),
    [analiticoCuentas]
  );

  /* ---------------------------------------------------------------- */
  /*  Export handler                                                    */
  /* ---------------------------------------------------------------- */
  const handleExport = () => {
    switch (activeTab) {
      case 'situacion': {
        const allRows = [
          ...situacionActivo.map((r) => ({ seccion: 'ACTIVO', ...r })),
          ...situacionPasivo.map((r) => ({ seccion: 'PASIVO', ...r })),
          ...situacionHacienda.map((r) => ({ seccion: 'HACIENDA PUBLICA', ...r })),
        ];
        exportToExcel(
          allRows,
          [
            { key: 'seccion', label: 'Seccion' },
            { key: 'codigo', label: 'Codigo' },
            { key: 'nombre', label: 'Nombre' },
            { key: 'saldo_final', label: 'Saldo Final' },
          ],
          'estado_situacion_financiera'
        );
        break;
      }
      case 'actividades': {
        const allRows = [
          ...actIngresos.map((r) => ({ seccion: 'INGRESOS', ...r })),
          ...actGastos.map((r) => ({ seccion: 'GASTOS', ...r })),
        ];
        exportToExcel(
          allRows,
          [
            { key: 'seccion', label: 'Seccion' },
            { key: 'codigo', label: 'Codigo' },
            { key: 'nombre', label: 'Nombre' },
            { key: 'monto', label: 'Monto' },
          ],
          'estado_actividades'
        );
        break;
      }
      case 'variacion': {
        const allRows = [
          ...varContribuida.map((r) => ({ seccion: 'HACIENDA CONTRIBUIDA', ...r })),
          ...varGenerada.map((r) => ({ seccion: 'HACIENDA GENERADA', ...r })),
          ...varExceso.map((r) => ({ seccion: 'EXCESO/INSUFICIENCIA', ...r })),
        ];
        exportToExcel(
          allRows,
          [
            { key: 'seccion', label: 'Seccion' },
            { key: 'codigo', label: 'Codigo' },
            { key: 'nombre', label: 'Nombre' },
            { key: 'saldo', label: 'Saldo' },
          ],
          'estado_variacion_hacienda'
        );
        break;
      }
      case 'analitico': {
        exportToExcel(
          analiticoCuentas,
          [
            { key: 'codigo', label: 'Codigo' },
            { key: 'nombre', label: 'Nombre' },
            { key: 'saldo_inicial', label: 'Saldo Inicial' },
            { key: 'debe', label: 'Debe' },
            { key: 'haber', label: 'Haber' },
            { key: 'saldo_final', label: 'Saldo Final' },
          ],
          'estado_analitico_activo'
        );
        break;
      }
      default:
        break;
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Check if there is data for the current tab                       */
  /* ---------------------------------------------------------------- */
  const hasData = {
    situacion: situacionActivo.length > 0 || situacionPasivo.length > 0 || situacionHacienda.length > 0,
    actividades: actIngresos.length > 0 || actGastos.length > 0,
    variacion: varContribuida.length > 0 || varGenerada.length > 0 || varExceso.length > 0,
    analitico: analiticoCuentas.length > 0,
    notas: true,
  }[activeTab];

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Estados Financieros</h1>
        <p className="text-sm text-text-muted mt-1">
          Art. 46-50 LGCG — Estados financieros del ente publico
        </p>
      </div>

      {/* Periodo selector */}
      <div className="bg-white rounded-lg card-shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <Select
            label="Periodo"
            placeholder="Seleccionar periodo..."
            options={periodoOptions}
            value={periodoId}
            onChange={(e) => setPeriodoId(e.target.value)}
          />
          <div>{/* spacer */}</div>
          <div className="flex justify-end">
            <Button variant="ghost" onClick={handleExport} disabled={!periodoId || !hasData || activeTab === 'notas'}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar XLSX
            </Button>
          </div>
        </div>
      </div>

      {/* Tab buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              activeTab === tab.key
                ? 'bg-guinda text-white shadow-md'
                : 'bg-white card-shadow text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content area */}
      {!periodoId ? (
        <div className="bg-white rounded-lg card-shadow p-5">
          <div className="text-center py-16 text-text-muted text-sm">
            Seleccione un periodo para ver los estados financieros
          </div>
        </div>
      ) : isLoading ? (
        <div className="bg-white rounded-lg card-shadow p-5">
          <div className="flex items-center justify-center py-16 text-text-muted text-sm">
            <svg className="animate-spin h-5 w-5 mr-3 text-guinda" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Cargando estado financiero...
          </div>
        </div>
      ) : !hasData && activeTab !== 'notas' ? (
        <div className="bg-white rounded-lg card-shadow p-5">
          <div className="text-center py-16 text-text-muted text-sm">
            No hay datos registrados para este periodo
          </div>
        </div>
      ) : (
        <>
          {/* ====== Tab: Situacion Financiera ====== */}
          {activeTab === 'situacion' && (
            <div>
              <SectionTable
                title="ACTIVO"
                rows={situacionActivo}
                columns={colsCodNomSaldo}
                totalLabel="TOTAL ACTIVO"
                total={totalActivo}
              />
              <SectionTable
                title="PASIVO"
                rows={situacionPasivo}
                columns={colsCodNomSaldo}
                totalLabel="TOTAL PASIVO"
                total={totalPasivo}
              />
              <SectionTable
                title="HACIENDA PUBLICA"
                rows={situacionHacienda}
                columns={colsCodNomSaldo}
                totalLabel="TOTAL HACIENDA"
                total={totalHacienda}
              />

              {/* Ecuacion contable check */}
              <div
                className={`rounded-lg p-4 text-sm font-medium ${
                  isBalanced
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                <span className="font-semibold">Ecuacion contable: </span>
                Activo = Pasivo + Hacienda &rarr;{' '}
                {fmtMoney(totalActivo)} = {fmtMoney(totalPasivo + totalHacienda)}
                {isBalanced ? ' — Cuadra correctamente' : ' — Diferencia detectada'}
              </div>
            </div>
          )}

          {/* ====== Tab: Actividades ====== */}
          {activeTab === 'actividades' && (
            <div>
              <SectionTable
                title="INGRESOS"
                rows={actIngresos}
                columns={colsCodNomMonto}
                totalLabel="TOTAL INGRESOS"
                total={totalIngresos}
              />
              <SectionTable
                title="GASTOS"
                rows={actGastos}
                columns={colsCodNomMonto}
                totalLabel="TOTAL GASTOS"
                total={totalGastos}
              />

              {/* Resultado del ejercicio */}
              <div
                className={`rounded-lg p-4 text-sm font-medium ${
                  resultado >= 0
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                <span className="font-semibold">Resultado del Ejercicio (Ahorro/Desahorro): </span>
                {fmtMoney(resultado)}
              </div>
            </div>
          )}

          {/* ====== Tab: Variacion Hacienda ====== */}
          {activeTab === 'variacion' && (
            <div>
              <SectionTable
                title="HACIENDA CONTRIBUIDA"
                rows={varContribuida}
                columns={[
                  { key: 'codigo', label: 'Codigo' },
                  { key: 'nombre', label: 'Nombre' },
                  { key: 'saldo', label: 'Saldo ($)', align: 'right', format: fmtMoney },
                ]}
                totalLabel="TOTAL HACIENDA CONTRIBUIDA"
                total={variacion?.contribuida?.total || 0}
              />
              <SectionTable
                title="HACIENDA GENERADA"
                rows={varGenerada}
                columns={[
                  { key: 'codigo', label: 'Codigo' },
                  { key: 'nombre', label: 'Nombre' },
                  { key: 'saldo', label: 'Saldo ($)', align: 'right', format: fmtMoney },
                ]}
                totalLabel="TOTAL HACIENDA GENERADA"
                total={variacion?.generada?.total || 0}
              />
              <SectionTable
                title="EXCESO / INSUFICIENCIA EN LA ACTUALIZACION DE LA HACIENDA PUBLICA"
                rows={varExceso}
                columns={[
                  { key: 'codigo', label: 'Codigo' },
                  { key: 'nombre', label: 'Nombre' },
                  { key: 'saldo', label: 'Saldo ($)', align: 'right', format: fmtMoney },
                ]}
                totalLabel="TOTAL EXCESO/INSUFICIENCIA"
                total={variacion?.exceso?.total || 0}
              />
            </div>
          )}

          {/* ====== Tab: Analitico Activo ====== */}
          {activeTab === 'analitico' && (
            <div className="bg-white rounded-lg card-shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#f9fafb]">
                      <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5">
                        Codigo
                      </th>
                      <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5">
                        Nombre
                      </th>
                      <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5">
                        Saldo Inicial
                      </th>
                      <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5">
                        Debe
                      </th>
                      <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5">
                        Haber
                      </th>
                      <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5">
                        Saldo Final
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analiticoCuentas.map((row, i) => (
                      <tr key={i} className="border-b border-[#f0f0f0] hover:bg-[#f9fafb]">
                        <td className="px-5 py-3 font-mono text-sm">{row.codigo}</td>
                        <td className="px-5 py-3 text-sm">{row.nombre}</td>
                        <td className="px-5 py-3 text-sm text-right font-mono">
                          {fmtMoney(row.saldo_inicial)}
                        </td>
                        <td className="px-5 py-3 text-sm text-right font-mono">
                          {fmtMoney(row.debe)}
                        </td>
                        <td className="px-5 py-3 text-sm text-right font-mono">
                          {fmtMoney(row.haber)}
                        </td>
                        <td className="px-5 py-3 text-sm text-right font-mono font-semibold">
                          {fmtMoney(row.saldo_final)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#f9fafb] font-bold border-t-2 border-guinda/20">
                      <td colSpan={2} className="px-5 py-3.5 text-sm text-right">
                        TOTALES
                      </td>
                      <td className="px-5 py-3.5 text-sm text-right font-mono">
                        {fmtMoney(analiticoTotales.saldo_inicial)}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-right font-mono">
                        {fmtMoney(analiticoTotales.debe)}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-right font-mono">
                        {fmtMoney(analiticoTotales.haber)}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-right font-mono">
                        {fmtMoney(analiticoTotales.saldo_final)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* ====== Tab: Notas ====== */}
          {activeTab === 'notas' && (
            <div className="bg-white rounded-lg card-shadow p-5">
              <h3 className="text-lg font-semibold text-text-primary mb-3">
                Notas a los Estados Financieros
              </h3>
              <p className="text-sm text-text-muted mb-4">
                Las notas a los estados financieros son parte integral de los mismos y proporcionan
                informacion adicional sobre las cifras presentadas en los estados financieros del ente
                publico.
              </p>
              <div className="bg-[#f9fafb] rounded-md p-4 text-sm text-text-secondary">
                <p>Las notas se generan como documento complementario. Incluyen:</p>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li>Notas de desglose</li>
                  <li>Notas de memoria (cuentas de orden)</li>
                  <li>Notas de gestion administrativa</li>
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
