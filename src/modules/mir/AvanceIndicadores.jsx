import { useState, useMemo } from 'react';
import { useProgramas, useIndicadoresMIR } from '../../hooks/useMIR';
import { useList, useCreate } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { NIVELES_MIR } from '../../config/constants';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';

const NIVEL_BADGE_MAP = {
  fin: 'primary',
  proposito: 'success',
  componente: 'info',
  actividad: 'warning',
};

const nivelLabelMap = {};
NIVELES_MIR.forEach((n) => {
  nivelLabelMap[n.key] = n.label;
});

export default function AvanceIndicadores() {
  const { ejercicioFiscal, entePublico } = useAppStore();

  const [selectedProgramaId, setSelectedProgramaId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [activeIndicador, setActiveIndicador] = useState(null);
  const [form, setForm] = useState({ periodo_id: '', valor_alcanzado: '', justificacion: '' });
  const [expandedId, setExpandedId] = useState(null);

  // --- Data hooks ---
  const { data: programas = [], isLoading: loadingProgramas } = useProgramas();
  const { data: indicadores = [], isLoading: loadingIndicadores } = useIndicadoresMIR(
    selectedProgramaId || undefined
  );
  const { data: periodos = [] } = useList('periodo_contable', {
    filter: { ejercicio_id: ejercicioFiscal?.id },
    order: { column: 'numero', ascending: true },
  });

  const createMut = useCreate('avance_indicador');

  // --- Options ---
  const programaOptions = useMemo(
    () => programas.map((p) => ({ value: p.id, label: `${p.clave} — ${p.nombre}` })),
    [programas]
  );

  const periodoOptions = useMemo(
    () => periodos.map((p) => ({ value: p.id, label: p.nombre || `Periodo ${p.numero}` })),
    [periodos]
  );

  // --- Handlers ---
  const openAvanceModal = (indicador) => {
    setActiveIndicador(indicador);
    setForm({ periodo_id: '', valor_alcanzado: '', justificacion: '' });
    setModalOpen(true);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const record = {
      indicador_id: activeIndicador.id,
      periodo_id: form.periodo_id,
      valor_alcanzado: form.valor_alcanzado ? Number(form.valor_alcanzado) : 0,
      justificacion: form.justificacion,
    };
    await createMut.mutateAsync(record);
    setModalOpen(false);
    setActiveIndicador(null);
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // --- Compute avance ---
  const computeAvance = (indicador) => {
    const meta = Number(indicador.meta_programada || 0);
    if (meta === 0) return 0;
    const avances = indicador.avances || [];
    const alcanzado = avances.reduce((sum, a) => sum + Number(a.valor_alcanzado || 0), 0);
    return Math.min(((alcanzado / meta) * 100), 999.99);
  };

  const getMetaAlcanzada = (indicador) => {
    const avances = indicador.avances || [];
    return avances.reduce((sum, a) => sum + Number(a.valor_alcanzado || 0), 0);
  };

  const getAvanceBadge = (pct) => {
    if (pct >= 100) return 'success';
    if (pct >= 50) return 'warning';
    return 'danger';
  };

  // --- Period lookup ---
  const periodoMap = useMemo(() => {
    const map = {};
    periodos.forEach((p) => {
      map[p.id] = p.nombre || `Periodo ${p.numero}`;
    });
    return map;
  }, [periodos]);

  const isSaving = createMut.isPending;

  // Guard: no context selected
  if (!entePublico?.id || !ejercicioFiscal?.id) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-muted text-sm">
          Seleccione un ente publico y ejercicio fiscal para capturar avances de indicadores.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Avance de Indicadores</h1>
        <p className="text-sm text-text-muted mt-1">
          Captura de avances por periodo
        </p>
      </div>

      {/* Program selector */}
      <div className="mb-6 max-w-md">
        <Select
          label="Programa presupuestario"
          value={selectedProgramaId}
          onChange={(e) => {
            setSelectedProgramaId(e.target.value);
            setExpandedId(null);
          }}
          options={programaOptions}
          placeholder="-- Seleccione un programa --"
        />
      </div>

      {/* Loading states */}
      {loadingProgramas && (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          <svg className="animate-spin h-5 w-5 mr-3 text-primary" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Cargando programas...
        </div>
      )}

      {/* No program selected */}
      {!selectedProgramaId && !loadingProgramas && (
        <div className="bg-white rounded-lg card-shadow p-5">
          <div className="flex flex-col items-center justify-center py-12 text-text-muted">
            <svg
              className="w-10 h-10 text-text-muted/50 mb-2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <p className="text-[0.9375rem]">Seleccione un programa para ver sus indicadores</p>
          </div>
        </div>
      )}

      {/* Indicators list */}
      {selectedProgramaId && (
        <>
          {loadingIndicadores ? (
            <div className="flex items-center justify-center py-16 text-text-muted text-sm">
              <svg className="animate-spin h-5 w-5 mr-3 text-primary" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Cargando indicadores...
            </div>
          ) : indicadores.length === 0 ? (
            <div className="bg-white rounded-lg card-shadow p-5">
              <div className="flex flex-col items-center justify-center py-12 text-text-muted">
                <svg
                  className="w-10 h-10 text-text-muted/50 mb-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
                <p className="text-[0.9375rem]">Este programa no tiene indicadores registrados.</p>
                <p className="text-xs text-text-muted mt-1">
                  Agregue indicadores desde la vista de detalle MIR del programa.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {indicadores.map((ind) => {
                const avancePct = computeAvance(ind);
                const metaAlcanzada = getMetaAlcanzada(ind);
                const isExpanded = expandedId === ind.id;
                const avances = ind.avances || [];

                return (
                  <div key={ind.id} className="bg-white rounded-lg card-shadow">
                    {/* Indicator summary row */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={NIVEL_BADGE_MAP[ind.nivel] || 'default'}>
                              {nivelLabelMap[ind.nivel] || ind.nivel}
                            </Badge>
                            <span className="text-[0.9375rem] font-medium text-text-primary truncate">
                              {ind.nombre_indicador}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-text-muted mt-1">
                            <span>
                              Meta: <span className="font-semibold text-text-primary">{Number(ind.meta_programada || 0).toLocaleString('es-MX')}</span>
                              {ind.unidad_medida && <span className="ml-1">{ind.unidad_medida}</span>}
                            </span>
                            <span>
                              Alcanzado: <span className="font-semibold text-text-primary">{metaAlcanzada.toLocaleString('es-MX')}</span>
                            </span>
                            <Badge variant={getAvanceBadge(avancePct)}>
                              {avancePct.toFixed(1)}%
                            </Badge>
                            {ind.frecuencia_medicion && (
                              <span className="text-xs">
                                Frecuencia: {ind.frecuencia_medicion}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {avances.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpand(ind.id)}
                            >
                              {isExpanded ? 'Ocultar avances' : `Ver avances (${avances.length})`}
                            </Button>
                          )}
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => openAvanceModal(ind)}
                          >
                            Registrar Avance
                          </Button>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="w-full bg-[#f0f0f0] rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              avancePct >= 100
                                ? 'bg-success'
                                : avancePct >= 50
                                  ? 'bg-warning'
                                  : 'bg-danger'
                            }`}
                            style={{ width: `${Math.min(avancePct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expanded avances table */}
                    {isExpanded && avances.length > 0 && (
                      <div className="border-t border-border px-5 pb-5">
                        <table className="w-full mt-3">
                          <thead>
                            <tr className="bg-[#f9fafb]">
                              <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 py-2.5">
                                Periodo
                              </th>
                              <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 py-2.5" style={{ width: '140px' }}>
                                Valor Alcanzado
                              </th>
                              <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 py-2.5">
                                Justificacion
                              </th>
                              <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 py-2.5" style={{ width: '160px' }}>
                                Fecha Registro
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {avances.map((av, idx) => (
                              <tr
                                key={av.id ?? idx}
                                className="border-b border-[#f0f0f0] last:border-0"
                              >
                                <td className="px-4 py-2.5 text-[0.9375rem] text-text-primary">
                                  {periodoMap[av.periodo_id] || av.periodo_id || '\u2014'}
                                </td>
                                <td className="px-4 py-2.5 text-[0.9375rem] text-text-primary text-right tabular-nums">
                                  {Number(av.valor_alcanzado || 0).toLocaleString('es-MX')}
                                </td>
                                <td className="px-4 py-2.5 text-[0.8125rem] text-text-secondary">
                                  {av.justificacion || '\u2014'}
                                </td>
                                <td className="px-4 py-2.5 text-[0.8125rem] text-text-muted">
                                  {av.created_at
                                    ? new Date(av.created_at).toLocaleDateString('es-MX')
                                    : '\u2014'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Register avance modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setActiveIndicador(null);
        }}
        title="Registrar Avance"
        size="md"
      >
        <div className="space-y-4">
          {/* Indicator info banner */}
          {activeIndicador && (
            <div className="p-3 rounded-lg border border-info/30 bg-info/5 text-sm">
              <p className="font-medium text-text-primary">{activeIndicador.nombre_indicador}</p>
              <p className="text-text-muted mt-0.5">
                Meta programada: {Number(activeIndicador.meta_programada || 0).toLocaleString('es-MX')}
                {activeIndicador.unidad_medida && ` ${activeIndicador.unidad_medida}`}
              </p>
            </div>
          )}

          {/* Periodo */}
          <Select
            label="Periodo"
            value={form.periodo_id}
            onChange={(e) => handleChange('periodo_id', e.target.value)}
            placeholder="-- Seleccione periodo --"
            options={periodoOptions}
          />

          {/* Valor alcanzado */}
          <Input
            label="Valor Alcanzado"
            value={form.valor_alcanzado}
            onChange={(e) => handleChange('valor_alcanzado', e.target.value)}
            placeholder="0"
            type="number"
          />

          {/* Justificacion */}
          <div className="w-full">
            <label className="block text-sm font-medium text-text-heading mb-1.5">
              Justificacion
            </label>
            <textarea
              value={form.justificacion}
              onChange={(e) => handleChange('justificacion', e.target.value)}
              placeholder="Justifique el avance reportado (opcional)"
              rows={3}
              className="block w-full rounded-md border border-border bg-white text-text-heading text-[0.9375rem] px-3.5 py-2.5 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button
              variant="ghost"
              onClick={() => {
                setModalOpen(false);
                setActiveIndicador(null);
              }}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              loading={isSaving}
              disabled={!form.periodo_id || !form.valor_alcanzado}
            >
              Registrar avance
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
