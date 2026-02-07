import { useState, useMemo } from 'react';
import { useNotas, useGenerarNotasTemplate } from '../../hooks/useNotas';
import { useList, useUpdate } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { TIPOS_NOTA_EF, ESTADOS_NOTA, ESTADOS_FINANCIEROS_NOTA } from '../../config/constants';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';

/* -------------------------------------------------------------------------- */
/*  NotasEF — Notas a los Estados Financieros                                 */
/*  NIF / CONAC — Notas de desglose, memoria y gestion administrativa         */
/* -------------------------------------------------------------------------- */

const TABS = Object.entries(TIPOS_NOTA_EF).map(([key, label]) => ({ key, label }));

const estadoOptions = Object.entries(ESTADOS_NOTA).map(([value, obj]) => ({
  value,
  label: obj.label,
}));

export default function NotasEF() {
  const { entePublico, ejercicioFiscal } = useAppStore();

  /* ---- Local state -------------------------------------------------------- */
  const [periodoId, setPeriodoId] = useState('');
  const [activeTab, setActiveTab] = useState('desglose');
  const [editModal, setEditModal] = useState(false);
  const [editingNota, setEditingNota] = useState(null);
  const [editForm, setEditForm] = useState({ titulo: '', contenido: '', estado: 'borrador' });

  /* ---- Data --------------------------------------------------------------- */
  const { data: periodos = [] } = useList('periodo_contable', {
    filter: { ejercicio_id: ejercicioFiscal?.id },
    order: { column: 'numero', ascending: true },
  });

  const periodoOptions = useMemo(
    () => periodos.map((p) => ({ value: p.id, label: p.nombre || `Periodo ${p.numero}` })),
    [periodos]
  );

  const { data: notas = [], isLoading, isError } = useNotas(periodoId);
  const generarMut = useGenerarNotasTemplate();
  const updateMut = useUpdate('nota_estado_financiero');

  /* ---- Filtered notes by active tab --------------------------------------- */
  const filteredNotas = useMemo(
    () => notas.filter((n) => n.tipo_nota === activeTab),
    [notas, activeTab]
  );

  /* ---- Handlers ----------------------------------------------------------- */
  const handleGenerarPlantillas = async () => {
    if (!periodoId) return;
    try {
      await generarMut.mutateAsync({
        enteId: entePublico?.id,
        ejercicioId: ejercicioFiscal?.id,
        periodoId,
      });
    } catch {
      // mutation error handled by React Query
    }
  };

  const openEdit = (nota) => {
    setEditingNota(nota);
    setEditForm({
      titulo: nota.titulo || '',
      contenido: nota.contenido || '',
      estado: nota.estado || 'borrador',
    });
    setEditModal(true);
  };

  const handleSave = async () => {
    if (!editingNota) return;
    try {
      await updateMut.mutateAsync({
        id: editingNota.id,
        titulo: editForm.titulo,
        contenido: editForm.contenido,
        estado: editForm.estado,
      });
      setEditModal(false);
      setEditingNota(null);
    } catch {
      // mutation error handled by React Query
    }
  };

  const setField = (key, value) => setEditForm((prev) => ({ ...prev, [key]: value }));

  const truncate = (text, maxLen = 120) => {
    if (!text) return '';
    return text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
  };

  /* ---- Render ------------------------------------------------------------- */
  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">
          Notas a los Estados Financieros
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Notas de desglose, memoria y gestion administrativa (NIF, CONAC)
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
          <div>{/* spacer */}</div>
          <div className="flex justify-end">
            <Button
              onClick={handleGenerarPlantillas}
              loading={generarMut.isPending}
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Generar Plantillas
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg card-shadow mb-6">
        <div className="border-b border-border px-5">
          <nav className="flex gap-6 -mb-px" aria-label="Tipo de nota">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              const count = notas.filter((n) => n.tipo_nota === tab.key).length;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-3 text-[0.9375rem] font-medium border-b-2 transition-colors cursor-pointer ${
                    isActive
                      ? 'border-guinda text-guinda'
                      : 'border-transparent text-text-muted hover:text-text-primary hover:border-border'
                  }`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span
                      className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-guinda/10 text-guinda' : 'bg-[#f5f5f9] text-text-muted'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
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
              Error al cargar notas
            </h3>
            <p className="text-sm text-text-muted max-w-sm mx-auto">
              Ocurrio un error al obtener las notas. Intente nuevamente.
            </p>
          </div>
        </div>
      ) : !periodoId ? (
        <div className="bg-white rounded-lg card-shadow p-5">
          <div className="text-center py-16">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-[#f5f5f9] flex items-center justify-center text-text-muted">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
            </div>
            <h3 className="text-[0.9375rem] font-semibold text-text-heading mb-1">
              Seleccione un periodo
            </h3>
            <p className="text-sm text-text-muted max-w-sm mx-auto">
              Seleccione un periodo contable para ver las notas a los estados financieros
            </p>
          </div>
        </div>
      ) : filteredNotas.length === 0 ? (
        <div className="bg-white rounded-lg card-shadow p-5">
          <div className="text-center py-16">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-[#f5f5f9] flex items-center justify-center text-text-muted">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
            </div>
            <h3 className="text-[0.9375rem] font-semibold text-text-heading mb-1">
              Sin notas de {TIPOS_NOTA_EF[activeTab] || activeTab}
            </h3>
            <p className="text-sm text-text-muted max-w-sm mx-auto">
              No hay notas registradas para este tipo y periodo. Presione &quot;Generar Plantillas&quot; para crear las notas base.
            </p>
          </div>
        </div>
      ) : (
        /* Notes list */
        <div className="space-y-3">
          {filteredNotas.map((nota) => {
            const estado = ESTADOS_NOTA[nota.estado] || { label: nota.estado, variant: 'default' };
            const efLabel = ESTADOS_FINANCIEROS_NOTA[nota.estado_financiero] || nota.estado_financiero;
            return (
              <div
                key={nota.id}
                onClick={() => openEdit(nota)}
                className="bg-white rounded-lg card-shadow p-5 hover:ring-2 hover:ring-guinda/15 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      {nota.numero && (
                        <span className="text-xs font-mono font-semibold text-guinda bg-guinda/10 px-2 py-0.5 rounded">
                          #{nota.numero}
                        </span>
                      )}
                      <h3 className="text-[0.9375rem] font-semibold text-text-heading truncate">
                        {nota.titulo || 'Sin titulo'}
                      </h3>
                    </div>
                    {efLabel && (
                      <p className="text-xs text-text-muted mb-2">
                        {efLabel}
                      </p>
                    )}
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {truncate(nota.contenido) || 'Sin contenido'}
                    </p>
                  </div>

                  {/* Right: badge */}
                  <div className="flex-shrink-0">
                    <Badge variant={estado.variant}>{estado.label}</Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit modal */}
      <Modal
        open={editModal}
        onClose={() => { setEditModal(false); setEditingNota(null); }}
        title={editingNota ? `Editar Nota #${editingNota.numero || ''}` : 'Editar Nota'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Titulo"
            value={editForm.titulo}
            onChange={(e) => setField('titulo', e.target.value)}
            placeholder="Titulo de la nota"
          />

          <div className="w-full">
            <label className="block text-sm font-medium text-text-heading mb-1.5">
              Contenido
            </label>
            <textarea
              value={editForm.contenido}
              onChange={(e) => setField('contenido', e.target.value)}
              placeholder="Contenido de la nota..."
              rows={10}
              className="w-full rounded-md border border-border px-3 py-2 text-[0.9375rem] focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda resize-y min-h-[200px]"
            />
          </div>

          <Select
            label="Estado"
            value={editForm.estado}
            onChange={(e) => setField('estado', e.target.value)}
            options={estadoOptions}
            placeholder="Seleccionar estado..."
          />

          {/* Estado financiero info (read-only) */}
          {editingNota?.estado_financiero && (
            <div className="bg-[#f9fafb] rounded-md p-3">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-0.5">
                Estado Financiero Asociado
              </p>
              <p className="text-sm text-text-primary font-medium">
                {ESTADOS_FINANCIEROS_NOTA[editingNota.estado_financiero] || editingNota.estado_financiero}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button
              variant="ghost"
              onClick={() => { setEditModal(false); setEditingNota(null); }}
              disabled={updateMut.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              loading={updateMut.isPending}
              disabled={!editForm.titulo.trim()}
            >
              Guardar cambios
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
