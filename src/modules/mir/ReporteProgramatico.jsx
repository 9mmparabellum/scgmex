import { useState, useMemo, Fragment } from 'react';
import { useResumenProgramatico } from '../../hooks/useMIR';
import { TIPOS_PROGRAMA } from '../../config/constants';
import { exportToExcel } from '../../utils/exportHelpers';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

const TIPO_BADGE_MAP = {
  programa: 'primary',
  proyecto: 'info',
  actividad: 'warning',
};

const NIVEL_BADGE_MAP = {
  fin: 'primary',
  proposito: 'success',
  componente: 'info',
  actividad: 'warning',
};

const NIVEL_LABELS = {
  fin: 'Fin',
  proposito: 'Proposito',
  componente: 'Componente',
  actividad: 'Actividad',
};

export default function ReporteProgramatico() {
  const { data: programas = [], isLoading } = useResumenProgramatico();
  const [expandedId, setExpandedId] = useState(null);

  // --- Compute summaries ---
  const programasConResumen = useMemo(() => {
    return programas.map((prog) => {
      const indicadores = prog.indicadores || [];
      const numIndicadores = indicadores.length;

      const avances = indicadores.map((ind) => {
        const meta = Number(ind.meta_programada || 0);
        const avancesArr = ind.avances || [];
        const alcanzado = avancesArr.reduce(
          (sum, a) => sum + Number(a.valor_alcanzado || 0),
          0
        );
        const pct = meta > 0 ? Math.min(((alcanzado / meta) * 100), 999.99) : 0;
        return { ...ind, meta_alcanzada: alcanzado, avance_pct: pct };
      });

      const promedioAvance =
        numIndicadores > 0
          ? avances.reduce((sum, ind) => sum + ind.avance_pct, 0) / numIndicadores
          : 0;

      return {
        ...prog,
        indicadores: avances,
        num_indicadores: numIndicadores,
        promedio_avance: promedioAvance,
      };
    });
  }, [programas]);

  // --- Estado general ---
  const getEstadoGeneral = (pct) => {
    if (pct >= 90) return { label: 'Optimo', variant: 'success' };
    if (pct >= 60) return { label: 'Aceptable', variant: 'warning' };
    if (pct > 0) return { label: 'Rezagado', variant: 'danger' };
    return { label: 'Sin avance', variant: 'default' };
  };

  const getAvanceBadge = (pct) => {
    if (pct >= 100) return 'success';
    if (pct >= 50) return 'warning';
    return 'danger';
  };

  // --- Toggle row expansion ---
  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // --- Export handler ---
  const handleExport = () => {
    // Flatten data: one row per indicador with programa info
    const flatData = [];
    programasConResumen.forEach((prog) => {
      if (prog.indicadores.length === 0) {
        flatData.push({
          programa_clave: prog.clave,
          programa_nombre: prog.nombre,
          programa_tipo: TIPOS_PROGRAMA[prog.tipo] || prog.tipo,
          nivel: '',
          indicador: '',
          meta_programada: '',
          meta_alcanzada: '',
          avance_pct: '',
          promedio_programa: prog.promedio_avance.toFixed(1),
        });
      } else {
        prog.indicadores.forEach((ind) => {
          flatData.push({
            programa_clave: prog.clave,
            programa_nombre: prog.nombre,
            programa_tipo: TIPOS_PROGRAMA[prog.tipo] || prog.tipo,
            nivel: NIVEL_LABELS[ind.nivel] || ind.nivel,
            indicador: ind.nombre_indicador,
            meta_programada: Number(ind.meta_programada || 0),
            meta_alcanzada: ind.meta_alcanzada,
            avance_pct: ind.avance_pct.toFixed(1),
            promedio_programa: prog.promedio_avance.toFixed(1),
          });
        });
      }
    });

    const excelColumns = [
      { key: 'programa_clave', label: 'Clave Programa' },
      { key: 'programa_nombre', label: 'Nombre Programa' },
      { key: 'programa_tipo', label: 'Tipo' },
      { key: 'nivel', label: 'Nivel MIR' },
      { key: 'indicador', label: 'Indicador' },
      { key: 'meta_programada', label: 'Meta Programada' },
      { key: 'meta_alcanzada', label: 'Meta Alcanzada' },
      { key: 'avance_pct', label: '% Avance' },
      { key: 'promedio_programa', label: '% Promedio Programa' },
    ];

    exportToExcel(flatData, excelColumns, 'reporte_programatico');
  };

  // --- Summary stats ---
  const stats = useMemo(() => {
    const total = programasConResumen.length;
    const conIndicadores = programasConResumen.filter((p) => p.num_indicadores > 0).length;
    const totalIndicadores = programasConResumen.reduce((sum, p) => sum + p.num_indicadores, 0);
    const promedioGeneral =
      total > 0
        ? programasConResumen.reduce((sum, p) => sum + p.promedio_avance, 0) / total
        : 0;
    return { total, conIndicadores, totalIndicadores, promedioGeneral };
  }, [programasConResumen]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Reporte Programatico</h1>
        <p className="text-sm text-text-muted mt-1">
          Resumen de programas e indicadores
        </p>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          <svg className="animate-spin h-5 w-5 mr-3 text-primary" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Cargando reporte programatico...
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg card-shadow p-4">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
                Programas
              </p>
              <p className="text-lg font-bold text-text-primary">{stats.total}</p>
            </div>
            <div className="bg-white rounded-lg card-shadow p-4">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
                Con Indicadores
              </p>
              <p className="text-lg font-bold text-text-primary">{stats.conIndicadores}</p>
            </div>
            <div className="bg-white rounded-lg card-shadow p-4">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
                Total Indicadores
              </p>
              <p className="text-lg font-bold text-text-primary">{stats.totalIndicadores}</p>
            </div>
            <div className="bg-white rounded-lg card-shadow p-4">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
                Avance Promedio
              </p>
              <p className="text-lg font-bold text-text-primary">
                {stats.promedioGeneral.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-secondary">
              Detalle por programa
              <span className="ml-2 text-text-muted font-normal">
                ({programasConResumen.length} registros)
              </span>
            </h2>
            <Button
              onClick={handleExport}
              variant="outline-primary"
              size="sm"
              disabled={programasConResumen.length === 0}
            >
              Exportar Excel
            </Button>
          </div>

          {/* Programs table */}
          {programasConResumen.length === 0 ? (
            <div className="bg-white rounded-lg card-shadow p-5">
              <div className="flex flex-col items-center justify-center py-16 text-text-muted">
                <svg
                  className="w-10 h-10 text-text-muted/50 mb-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
                  <polyline points="13 2 13 9 20 9" />
                </svg>
                <p className="text-[0.9375rem]">No hay programas registrados</p>
                <p className="text-xs text-text-muted mt-1">
                  Registre programas presupuestarios e indicadores para generar el reporte.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg card-shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#f9fafb]">
                      <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5" style={{ width: '40px' }}>
                        {/* expand */}
                      </th>
                      <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5" style={{ width: '100px' }}>
                        Clave
                      </th>
                      <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5">
                        Nombre
                      </th>
                      <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5" style={{ width: '120px' }}>
                        Tipo
                      </th>
                      <th className="text-center text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5" style={{ width: '120px' }}>
                        # Indicadores
                      </th>
                      <th className="text-center text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5" style={{ width: '140px' }}>
                        Promedio Avance
                      </th>
                      <th className="text-center text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5" style={{ width: '130px' }}>
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {programasConResumen.map((prog) => {
                      const estado = getEstadoGeneral(prog.promedio_avance);
                      const isExpanded = expandedId === prog.id;
                      const hasIndicadores = prog.num_indicadores > 0;

                      return (
                        <Fragment key={prog.id}>
                          <tr
                            className="border-b border-[#f0f0f0] hover:bg-[#f9fafb] transition-colors cursor-pointer"
                            onClick={() => hasIndicadores && toggleExpand(prog.id)}
                          >
                            <td className="px-5 py-3.5 text-center">
                              {hasIndicadores && (
                                <svg
                                  className={`w-4 h-4 text-text-muted transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="9 18 15 12 9 6" />
                                </svg>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-[0.9375rem] text-text-primary font-medium">
                              {prog.clave}
                            </td>
                            <td className="px-5 py-3.5 text-[0.9375rem] text-text-primary">
                              {prog.nombre}
                            </td>
                            <td className="px-5 py-3.5">
                              <Badge variant={TIPO_BADGE_MAP[prog.tipo] || 'default'}>
                                {TIPOS_PROGRAMA[prog.tipo] || prog.tipo || '\u2014'}
                              </Badge>
                            </td>
                            <td className="px-5 py-3.5 text-[0.9375rem] text-text-primary text-center tabular-nums">
                              {prog.num_indicadores}
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <Badge variant={getAvanceBadge(prog.promedio_avance)}>
                                {prog.promedio_avance.toFixed(1)}%
                              </Badge>
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <Badge variant={estado.variant}>
                                {estado.label}
                              </Badge>
                            </td>
                          </tr>

                          {/* Expanded indicator rows */}
                          {isExpanded &&
                            prog.indicadores.map((ind, idx) => (
                              <tr
                                key={ind.id ?? `${prog.id}-ind-${idx}`}
                                className="border-b border-[#f0f0f0] bg-[#fafbfc]"
                              >
                                <td className="px-5 py-2.5" />
                                <td className="px-5 py-2.5" />
                                <td className="px-5 py-2.5 text-[0.8125rem] text-text-secondary">
                                  <div className="flex items-center gap-2">
                                    <Badge variant={NIVEL_BADGE_MAP[ind.nivel] || 'default'}>
                                      {NIVEL_LABELS[ind.nivel] || ind.nivel}
                                    </Badge>
                                    <span>{ind.nombre_indicador}</span>
                                  </div>
                                </td>
                                <td className="px-5 py-2.5 text-[0.8125rem] text-text-muted text-center">
                                  {ind.unidad_medida || '\u2014'}
                                </td>
                                <td className="px-5 py-2.5 text-[0.8125rem] text-text-secondary text-center tabular-nums">
                                  {Number(ind.meta_programada || 0).toLocaleString('es-MX')}
                                  {' / '}
                                  {ind.meta_alcanzada.toLocaleString('es-MX')}
                                </td>
                                <td className="px-5 py-2.5 text-center">
                                  <Badge variant={getAvanceBadge(ind.avance_pct)}>
                                    {ind.avance_pct.toFixed(1)}%
                                  </Badge>
                                </td>
                                <td className="px-5 py-2.5">
                                  {/* Progress bar */}
                                  <div className="w-full bg-[#f0f0f0] rounded-full h-1.5">
                                    <div
                                      className={`h-1.5 rounded-full ${
                                        ind.avance_pct >= 100
                                          ? 'bg-success'
                                          : ind.avance_pct >= 50
                                            ? 'bg-warning'
                                            : 'bg-danger'
                                      }`}
                                      style={{ width: `${Math.min(ind.avance_pct, 100)}%` }}
                                    />
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary footer */}
              <div className="px-5 py-4 border-t border-border bg-[#f9fafb] flex items-center gap-6 text-sm text-text-secondary">
                <span>
                  Total programas: <span className="font-semibold text-text-primary">{stats.total}</span>
                </span>
                <span>
                  Total indicadores: <span className="font-semibold text-text-primary">{stats.totalIndicadores}</span>
                </span>
                <span>
                  Avance promedio general: <span className="font-semibold text-text-primary">{stats.promedioGeneral.toFixed(1)}%</span>
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

