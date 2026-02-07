import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMIRCompleta } from '../../hooks/useMIR';
import { useCreate, useRemove } from '../../hooks/useCrud';
import {
  NIVELES_MIR,
  TIPOS_INDICADOR_MIR,
  FRECUENCIAS_MEDICION,
  DIMENSIONES_INDICADOR,
} from '../../config/constants';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const NIVEL_BADGE_MAP = {
  fin: 'primary',
  proposito: 'success',
  componente: 'info',
  actividad: 'warning',
};

const nivelOptions = NIVELES_MIR.map((n) => ({ value: n.key, label: n.label }));
const tipoIndicadorOptions = Object.entries(TIPOS_INDICADOR_MIR).map(([value, label]) => ({ value, label }));
const frecuenciaOptions = Object.entries(FRECUENCIAS_MEDICION).map(([value, label]) => ({ value, label }));
const dimensionOptions = Object.entries(DIMENSIONES_INDICADOR).map(([value, label]) => ({ value, label }));

const emptyIndicadorForm = {
  nivel: '',
  resumen_narrativo: '',
  nombre_indicador: '',
  metodo_calculo: '',
  frecuencia_medicion: '',
  tipo_indicador: '',
  dimension: '',
  meta_programada: '',
  unidad_medida: '',
  medios_verificacion: '',
  supuestos: '',
};

export default function MIRDetalle() {
  const { programaId } = useParams();
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyIndicadorForm });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // --- Data hooks ---
  const { data: mirData, isLoading } = useMIRCompleta(programaId);

  const createMut = useCreate('indicador_mir');
  const removeMut = useRemove('indicador_mir');

  // --- Group indicators by nivel ---
  const indicadoresPorNivel = useMemo(() => {
    if (!mirData?.indicadores) return {};
    const grouped = {};
    NIVELES_MIR.forEach((n) => {
      grouped[n.key] = [];
    });
    mirData.indicadores.forEach((ind) => {
      const nivel = ind.nivel || 'actividad';
      if (!grouped[nivel]) grouped[nivel] = [];
      grouped[nivel].push(ind);
    });
    return grouped;
  }, [mirData]);

  const totalIndicadores = mirData?.indicadores?.length || 0;

  // --- Handlers ---
  const openCreate = () => {
    setForm({ ...emptyIndicadorForm });
    setModalOpen(true);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const record = {
      ...form,
      programa_id: programaId,
      meta_programada: form.meta_programada ? Number(form.meta_programada) : 0,
    };
    await createMut.mutateAsync(record);
    setModalOpen(false);
  };

  const askDelete = (indicador) => {
    setDeleteTarget(indicador);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      await removeMut.mutateAsync(deleteTarget.id);
    }
    setConfirmOpen(false);
    setDeleteTarget(null);
  };

  // --- Compute avance percentage ---
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

  const isSaving = createMut.isPending;

  // --- Loading state ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-text-muted text-sm">
        <svg className="animate-spin h-5 w-5 mr-3 text-primary" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Cargando Matriz de Indicadores...
      </div>
    );
  }

  // --- Empty / not found state ---
  if (!mirData) {
    return (
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
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="text-[0.9375rem] mb-4">No se encontro el programa solicitado.</p>
        <Button variant="outline-primary" size="sm" onClick={() => navigate('/mir/programas')}>
          Volver a programas
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate('/mir/programas')}
            className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              Matriz de Indicadores para Resultados
            </h1>
            <p className="text-sm text-text-muted mt-0.5">
              {mirData.clave} — {mirData.nombre}
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-secondary">
          Indicadores
          <span className="ml-2 text-text-muted font-normal">
            ({totalIndicadores} registros)
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => navigate('/mir/avances')}
          >
            Registrar Avances
          </Button>
          <Button onClick={openCreate} size="sm">
            + Agregar Indicador
          </Button>
        </div>
      </div>

      {/* MIR Matrix */}
      <div className="bg-white rounded-lg card-shadow overflow-hidden">
        {totalIndicadores === 0 ? (
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
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            <p className="text-[0.9375rem]">No hay indicadores registrados en esta MIR.</p>
            <p className="text-xs text-text-muted mt-1">
              Agregue indicadores para los niveles Fin, Proposito, Componente y Actividad.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f9fafb]">
                  <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5" style={{ width: '120px' }}>
                    Nivel
                  </th>
                  <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5">
                    Resumen Narrativo
                  </th>
                  <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5" style={{ width: '180px' }}>
                    Indicador
                  </th>
                  <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5" style={{ width: '120px' }}>
                    Meta
                  </th>
                  <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5" style={{ width: '120px' }}>
                    Alcanzado
                  </th>
                  <th className="text-center text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5" style={{ width: '110px' }}>
                    % Avance
                  </th>
                  <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5" style={{ width: '180px' }}>
                    Medios de Verificacion
                  </th>
                  <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5" style={{ width: '180px' }}>
                    Supuestos
                  </th>
                  <th className="text-center text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5" style={{ width: '80px' }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {NIVELES_MIR.map((nivel) => {
                  const indicadores = indicadoresPorNivel[nivel.key] || [];
                  if (indicadores.length === 0) return null;

                  return indicadores.map((ind, idx) => {
                    const avancePct = computeAvance(ind);
                    const metaAlcanzada = getMetaAlcanzada(ind);

                    return (
                      <tr
                        key={ind.id ?? `${nivel.key}-${idx}`}
                        className="border-b border-[#f0f0f0] last:border-0 hover:bg-[#f9fafb] transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <Badge variant={NIVEL_BADGE_MAP[nivel.key] || 'default'}>
                            {nivel.label}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-[0.9375rem] text-text-primary">
                          {ind.resumen_narrativo || '\u2014'}
                        </td>
                        <td className="px-5 py-3.5 text-[0.9375rem] text-text-primary">
                          <div>
                            <p className="font-medium">{ind.nombre_indicador || '\u2014'}</p>
                            {ind.frecuencia_medicion && (
                              <p className="text-xs text-text-muted mt-0.5">
                                {FRECUENCIAS_MEDICION[ind.frecuencia_medicion] || ind.frecuencia_medicion}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-[0.9375rem] text-text-primary text-right tabular-nums">
                          {Number(ind.meta_programada || 0).toLocaleString('es-MX')}
                          {ind.unidad_medida && (
                            <span className="text-xs text-text-muted ml-1">{ind.unidad_medida}</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-[0.9375rem] text-text-primary text-right tabular-nums">
                          {metaAlcanzada.toLocaleString('es-MX')}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <Badge variant={getAvanceBadge(avancePct)}>
                            {avancePct.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-[0.8125rem] text-text-secondary">
                          {ind.medios_verificacion || '\u2014'}
                        </td>
                        <td className="px-5 py-3.5 text-[0.8125rem] text-text-secondary">
                          {ind.supuestos || '\u2014'}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button
                            onClick={() => askDelete(ind)}
                            className="text-xs text-danger hover:text-danger/80 transition-colors cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Indicador modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nuevo Indicador"
        size="lg"
      >
        <div className="space-y-4">
          {/* Row 1: Nivel + Dimension */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Nivel MIR"
              value={form.nivel}
              onChange={(e) => handleChange('nivel', e.target.value)}
              placeholder="-- Seleccione nivel --"
              options={nivelOptions}
            />
            <Select
              label="Dimension"
              value={form.dimension}
              onChange={(e) => handleChange('dimension', e.target.value)}
              placeholder="-- Seleccione dimension --"
              options={dimensionOptions}
            />
          </div>

          {/* Resumen narrativo */}
          <div className="w-full">
            <label className="block text-sm font-medium text-text-heading mb-1.5">
              Resumen Narrativo <span className="text-danger">*</span>
            </label>
            <textarea
              value={form.resumen_narrativo}
              onChange={(e) => handleChange('resumen_narrativo', e.target.value)}
              placeholder="Describa el resumen narrativo del indicador"
              rows={3}
              className="block w-full rounded-md border border-border bg-white text-text-heading text-[0.9375rem] px-3.5 py-2.5 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda resize-none"
            />
          </div>

          {/* Row 2: Indicador + Metodo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre del Indicador"
              value={form.nombre_indicador}
              onChange={(e) => handleChange('nombre_indicador', e.target.value)}
              placeholder="Ej. Tasa de cobertura"
            />
            <Input
              label="Metodo de Calculo"
              value={form.metodo_calculo}
              onChange={(e) => handleChange('metodo_calculo', e.target.value)}
              placeholder="Ej. (Numerador / Denominador) * 100"
            />
          </div>

          {/* Row 3: Tipo + Frecuencia */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Tipo de Indicador"
              value={form.tipo_indicador}
              onChange={(e) => handleChange('tipo_indicador', e.target.value)}
              placeholder="-- Seleccione tipo --"
              options={tipoIndicadorOptions}
            />
            <Select
              label="Frecuencia de Medicion"
              value={form.frecuencia_medicion}
              onChange={(e) => handleChange('frecuencia_medicion', e.target.value)}
              placeholder="-- Seleccione frecuencia --"
              options={frecuenciaOptions}
            />
          </div>

          {/* Row 4: Meta + Unidad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Meta Programada"
              value={form.meta_programada}
              onChange={(e) => handleChange('meta_programada', e.target.value)}
              placeholder="0"
              type="number"
            />
            <Input
              label="Unidad de Medida"
              value={form.unidad_medida}
              onChange={(e) => handleChange('unidad_medida', e.target.value)}
              placeholder="Ej. Porcentaje, Personas, Acciones"
            />
          </div>

          {/* Medios de verificacion */}
          <div className="w-full">
            <label className="block text-sm font-medium text-text-heading mb-1.5">
              Medios de Verificacion
            </label>
            <textarea
              value={form.medios_verificacion}
              onChange={(e) => handleChange('medios_verificacion', e.target.value)}
              placeholder="Describa los medios de verificacion del indicador"
              rows={2}
              className="block w-full rounded-md border border-border bg-white text-text-heading text-[0.9375rem] px-3.5 py-2.5 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda resize-none"
            />
          </div>

          {/* Supuestos */}
          <div className="w-full">
            <label className="block text-sm font-medium text-text-heading mb-1.5">
              Supuestos
            </label>
            <textarea
              value={form.supuestos}
              onChange={(e) => handleChange('supuestos', e.target.value)}
              placeholder="Describa los supuestos del indicador"
              rows={2}
              className="block w-full rounded-md border border-border bg-white text-text-heading text-[0.9375rem] px-3.5 py-2.5 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              loading={isSaving}
              disabled={!form.nivel || !form.resumen_narrativo.trim() || !form.nombre_indicador.trim()}
            >
              Crear indicador
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        title="Eliminar indicador"
        message={
          deleteTarget
            ? `¿Esta seguro de eliminar el indicador "${deleteTarget.nombre_indicador}"? Se eliminaran tambien los avances asociados. Esta accion no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        loading={removeMut.isPending}
      />
    </div>
  );
}
