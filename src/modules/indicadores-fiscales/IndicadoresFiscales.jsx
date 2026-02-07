import { useState, useMemo } from 'react';
import { useIndicadoresFiscales, useCalcularIndicadores } from '../../hooks/useIndicadoresFiscales';
import { useList } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { CATEGORIAS_INDICADOR_FISCAL } from '../../config/constants';
import { exportToExcel } from '../../utils/exportHelpers';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';

/* -------------------------------------------------------------------------- */
/*  IndicadoresFiscales — Dashboard de indicadores de postura fiscal          */
/*  Art. 46 LGCG — Indicadores financieros del ente publico                   */
/* -------------------------------------------------------------------------- */

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

const fmtPct = (n) => `${Math.abs(Number(n || 0)).toFixed(2)}%`;

export default function IndicadoresFiscales() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  const [periodoId, setPeriodoId] = useState('');

  /* ---- Data --------------------------------------------------------------- */
  const { data: periodos = [] } = useList('periodo_contable', {
    filter: { ejercicio_id: ejercicioFiscal?.id },
    order: { column: 'numero', ascending: true },
  });

  const periodoOptions = useMemo(
    () => periodos.map((p) => ({ value: p.id, label: p.nombre || `Periodo ${p.numero}` })),
    [periodos]
  );

  const { data: indicadores = [], isLoading, isError } = useIndicadoresFiscales(periodoId);
  const calcularMut = useCalcularIndicadores();

  /* ---- Grouped indicators ------------------------------------------------- */
  const grouped = useMemo(() => {
    const groups = {};
    Object.keys(CATEGORIAS_INDICADOR_FISCAL).forEach((cat) => {
      groups[cat] = [];
    });
    indicadores.forEach((ind) => {
      const cat = ind.categoria || 'financiero';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(ind);
    });
    return groups;
  }, [indicadores]);

  /* ---- Handlers ----------------------------------------------------------- */
  const handleCalcular = async () => {
    if (!periodoId) return;
    try {
      await calcularMut.mutateAsync({
        enteId: entePublico?.id,
        ejercicioId: ejercicioFiscal?.id,
        periodoId,
      });
    } catch {
      // mutation error handled by React Query
    }
  };

  const handleExport = () => {
    const excelCols = [
      { key: 'nombre', label: 'Indicador' },
      { key: 'categoria', label: 'Categoria', getValue: (row) => CATEGORIAS_INDICADOR_FISCAL[row.categoria]?.label || row.categoria },
      { key: 'valor', label: 'Valor', getValue: (row) => Number(row.valor || 0) },
      { key: 'variacion', label: 'Variacion %', getValue: (row) => Number(row.variacion || 0) },
      { key: 'valor_anterior', label: 'Valor Anterior', getValue: (row) => Number(row.valor_anterior || 0) },
    ];
    exportToExcel(indicadores, excelCols, 'indicadores_fiscales');
  };

  /* ---- Render ------------------------------------------------------------- */
  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">
          Indicadores de Postura Fiscal
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Indicadores financieros del ente publico (Art. 46 LGCG)
        </p>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-lg card-shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <Select
            label="Periodo"
            placeholder="Seleccionar periodo..."
            options={periodoOptions}
            value={periodoId}
            onChange={(e) => setPeriodoId(e.target.value)}
          />
          <div className="flex items-end gap-2">
            <Button
              onClick={handleCalcular}
              loading={calcularMut.isPending}
              disabled={!periodoId}
            >
              <svg
                className="w-4 h-4 mr-1.5 inline-block"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              Calcular Indicadores
            </Button>
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline-primary"
              onClick={handleExport}
              disabled={indicadores.length === 0}
              size="sm"
            >
              <svg
                className="w-4 h-4 mr-1.5 inline-block"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Exportar Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Content states */}
      {isLoading ? (
        <div className="bg-white rounded-lg card-shadow p-5">
          <div className="flex items-center justify-center py-16">
            <svg
              className="animate-spin h-8 w-8 text-guinda"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        </div>
      ) : isError ? (
        <div className="bg-white rounded-lg card-shadow p-5">
          <div className="text-center py-16">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-[#ff3e1d]/10 flex items-center justify-center text-[#ff3e1d]">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
            </div>
            <h3 className="text-[0.9375rem] font-semibold text-text-heading mb-1">
              Error al cargar indicadores
            </h3>
            <p className="text-sm text-text-muted max-w-sm mx-auto">
              Ocurrio un error al obtener los indicadores. Intente nuevamente.
            </p>
          </div>
        </div>
      ) : !periodoId ? (
        <div className="bg-white rounded-lg card-shadow p-5">
          <div className="text-center py-16">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-[#f5f5f9] flex items-center justify-center text-text-muted">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <h3 className="text-[0.9375rem] font-semibold text-text-heading mb-1">
              Seleccione un periodo
            </h3>
            <p className="text-sm text-text-muted max-w-sm mx-auto">
              Seleccione un periodo contable para ver los indicadores fiscales
            </p>
          </div>
        </div>
      ) : indicadores.length === 0 ? (
        <div className="bg-white rounded-lg card-shadow p-5">
          <div className="text-center py-16">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-[#f5f5f9] flex items-center justify-center text-text-muted">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <h3 className="text-[0.9375rem] font-semibold text-text-heading mb-1">
              Sin indicadores calculados
            </h3>
            <p className="text-sm text-text-muted max-w-sm mx-auto">
              No hay indicadores para este periodo. Presione &quot;Calcular Indicadores&quot; para generarlos.
            </p>
          </div>
        </div>
      ) : (
        /* Indicator cards by category */
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, items]) => {
            if (items.length === 0) return null;
            const catInfo = CATEGORIAS_INDICADOR_FISCAL[cat] || { label: cat, variant: 'default' };
            return (
              <div key={cat}>
                {/* Category heading */}
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={catInfo.variant}>{catInfo.label}</Badge>
                  <span className="text-xs text-text-muted">
                    ({items.length} indicador{items.length !== 1 ? 'es' : ''})
                  </span>
                </div>

                {/* Cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {items.map((ind) => {
                    const valor = Number(ind.valor || 0);
                    const variacion = Number(ind.variacion || 0);
                    const valorAnterior = Number(ind.valor_anterior || 0);
                    const isBalance = cat === 'balance';
                    const valorColor = isBalance
                      ? valor >= 0
                        ? 'text-[#71dd37]'
                        : 'text-[#ff3e1d]'
                      : 'text-text-heading';

                    return (
                      <div
                        key={ind.id}
                        className="bg-white rounded-lg card-shadow p-5 flex flex-col"
                      >
                        {/* Header: badge + name */}
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-[0.9375rem] font-semibold text-text-heading leading-snug pr-2">
                            {ind.nombre}
                          </h3>
                          <Badge variant={catInfo.variant}>{catInfo.label}</Badge>
                        </div>

                        {/* Value */}
                        <p className={`text-[22px] font-bold tracking-tight leading-tight mb-2 ${valorColor}`}>
                          {fmtMoney(valor)}
                        </p>

                        {/* Variacion + valor anterior */}
                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
                          <div className="flex items-center gap-1">
                            {variacion !== 0 && (
                              <svg
                                className={`w-4 h-4 ${variacion > 0 ? 'text-[#71dd37]' : 'text-[#ff3e1d]'}`}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                {variacion > 0 ? (
                                  <polyline points="18 15 12 9 6 15" />
                                ) : (
                                  <polyline points="6 9 12 15 18 9" />
                                )}
                              </svg>
                            )}
                            <span
                              className={`text-sm font-semibold ${
                                variacion > 0
                                  ? 'text-[#71dd37]'
                                  : variacion < 0
                                    ? 'text-[#ff3e1d]'
                                    : 'text-text-muted'
                              }`}
                            >
                              {fmtPct(variacion)}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] text-text-muted uppercase tracking-wide">
                              Anterior
                            </p>
                            <p className="text-sm font-mono text-text-secondary">
                              {fmtMoney(valorAnterior)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
