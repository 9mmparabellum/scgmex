import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProyectoById, useEstimaciones } from '../../hooks/useObraPublica';
import { useCreate, useUpdate, useRemove } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { canEdit } from '../../utils/rbac';
import { TIPOS_PROYECTO_OBRA, MODALIDADES_CONTRATACION, ESTADOS_PROYECTO, ESTADOS_ESTIMACION } from '../../config/constants';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { exportToExcel } from '../../utils/exportHelpers';

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

const today = () => new Date().toISOString().slice(0, 10);

const emptyEstimacion = {
  numero: '',
  concepto: '',
  monto: '',
  fecha: today(),
  estado: 'pendiente',
};

export default function ProyectoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { entePublico, ejercicioFiscal, rol } = useAppStore();
  const editable = canEdit(rol, 'obra_publica');

  // --- Data hooks ---
  const { data: proyecto, isLoading: loadingProyecto } = useProyectoById(id);
  const { data: estimaciones = [], isLoading: loadingEstimaciones } = useEstimaciones(id);

  // --- CRUD state for estimaciones ---
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyEstimacion });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const createMut = useCreate('estimacion_obra');
  const updateMut = useUpdate('estimacion_obra');
  const removeMut = useRemove('estimacion_obra');

  // --- Select options ---
  const estadoEstimacionOptions = useMemo(
    () => Object.entries(ESTADOS_ESTIMACION).map(([value, { label }]) => ({ value, label })),
    []
  );

  // --- Helpers ---
  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  // --- Computed values ---
  const totalEstimado = useMemo(
    () => estimaciones.reduce((s, e) => s + Number(e.monto || 0), 0),
    [estimaciones]
  );

  // --- Handlers ---
  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyEstimacion, fecha: today() });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      numero: row.numero ?? '',
      concepto: row.concepto ?? '',
      monto: row.monto ?? '',
      fecha: row.fecha ?? today(),
      estado: row.estado ?? 'pendiente',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      proyecto_id: id,
      ente_id: entePublico?.id,
      ejercicio_id: ejercicioFiscal?.id,
      monto: Number(form.monto) || 0,
    };

    if (editing) {
      await updateMut.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createMut.mutateAsync(payload);
    }
    setModalOpen(false);
  };

  const askDelete = (row) => {
    setToDelete(row);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (toDelete) {
      await removeMut.mutateAsync(toDelete.id);
    }
    setConfirmOpen(false);
    setToDelete(null);
  };

  // --- Export handler ---
  const handleExport = () => {
    const excelCols = [
      { key: 'numero', label: 'Numero' },
      { key: 'concepto', label: 'Concepto' },
      { key: 'monto', label: 'Monto', getValue: (row) => Number(row.monto || 0) },
      { key: 'fecha', label: 'Fecha' },
      { key: 'estado', label: 'Estado', getValue: (row) => ESTADOS_ESTIMACION[row.estado]?.label || row.estado },
    ];
    exportToExcel(estimaciones, excelCols, `estimaciones_${proyecto?.clave || id}`);
  };

  // --- Table columns ---
  const columns = useMemo(
    () => [
      { key: 'numero', label: 'Numero', width: '100px' },
      { key: 'concepto', label: 'Concepto' },
      {
        key: 'monto',
        label: 'Monto',
        width: '160px',
        render: (val) => (
          <span className="text-right block tabular-nums">
            {fmtMoney(val)}
          </span>
        ),
      },
      { key: 'fecha', label: 'Fecha', width: '110px' },
      {
        key: 'estado',
        label: 'Estado',
        width: '120px',
        render: (val) => {
          const est = ESTADOS_ESTIMACION[val] || { label: val, variant: 'default' };
          return <Badge variant={est.variant}>{est.label}</Badge>;
        },
      },
      {
        key: 'id',
        label: 'Acciones',
        width: '140px',
        sortable: false,
        render: (_val, row) => (
          <div className="flex items-center gap-2">
            {editable && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); openEdit(row); }}
                  className="text-xs text-primary hover:text-primary-light transition-colors cursor-pointer"
                >
                  Editar
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); askDelete(row); }}
                  className="text-xs text-danger hover:text-danger/80 transition-colors cursor-pointer"
                >
                  Eliminar
                </button>
              </>
            )}
          </div>
        ),
      },
    ],
    [editable]
  );

  const isSaving = createMut.isPending || updateMut.isPending;

  // --- Loading state ---
  if (loadingProyecto) {
    return (
      <div className="flex items-center justify-center py-16 text-text-muted text-sm">
        Cargando proyecto...
      </div>
    );
  }

  if (!proyecto) {
    return (
      <div className="flex items-center justify-center py-16 text-text-muted text-sm">
        Proyecto no encontrado.
      </div>
    );
  }

  const estadoProyecto = ESTADOS_PROYECTO[proyecto.estado] || { label: proyecto.estado, variant: 'default' };
  const avancePct = Number(proyecto.avance_fisico || 0);

  return (
    <div>
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/obra-publica/proyectos')}
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
              {proyecto.nombre}
            </h1>
            <p className="text-sm text-text-muted mt-1">
              {proyecto.clave}
              <span className="ml-3 inline-block">
                <Badge variant={estadoProyecto.variant}>{estadoProyecto.label}</Badge>
              </span>
            </p>
          </div>
        </div>
        <Button onClick={handleExport} variant="outline-primary" size="sm">
          Exportar Excel
        </Button>
      </div>

      {/* Project info card */}
      <div className="bg-white rounded-lg card-shadow p-5 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Tipo</p>
            <p className="text-sm font-semibold text-text-primary">
              {TIPOS_PROYECTO_OBRA[proyecto.tipo] || proyecto.tipo || '\u2014'}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Modalidad</p>
            <p className="text-sm font-semibold text-text-primary">
              {MODALIDADES_CONTRATACION[proyecto.modalidad_contratacion] || proyecto.modalidad_contratacion || '\u2014'}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Contratista</p>
            <p className="text-sm font-semibold text-text-primary">
              {proyecto.contratista || '\u2014'}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Fechas</p>
            <p className="text-sm font-semibold text-text-primary">
              {proyecto.fecha_inicio || '\u2014'} a {proyecto.fecha_fin_programada || '\u2014'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Monto Contratado</p>
            <p className="text-lg font-bold text-text-primary">{fmtMoney(proyecto.monto_contratado)}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Monto Ejercido</p>
            <p className="text-lg font-bold text-text-primary">{fmtMoney(proyecto.monto_ejercido)}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Total Estimado</p>
            <p className="text-lg font-bold text-text-primary">{fmtMoney(totalEstimado)}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Avance Fisico</p>
            <div className="mt-1">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(avancePct, 100)}%`,
                      backgroundColor: avancePct >= 80 ? '#56ca00' : avancePct >= 40 ? '#e09600' : '#9D2449',
                    }}
                  />
                </div>
                <span className="text-sm font-bold text-text-primary">{avancePct.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>

        {proyecto.descripcion && (
          <div className="border-t border-border pt-3">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Descripcion</p>
            <p className="text-sm text-text-secondary leading-relaxed">{proyecto.descripcion}</p>
          </div>
        )}
      </div>

      {/* Estimaciones section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-secondary">
          Estimaciones
          <span className="ml-2 text-text-muted font-normal">
            ({estimaciones.length} registros)
          </span>
        </h2>
        {editable && (
          <Button onClick={openCreate} size="sm">
            + Nueva Estimacion
          </Button>
        )}
      </div>

      {/* Estimaciones table */}
      {loadingEstimaciones ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando estimaciones...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={estimaciones}
          onRowClick={editable ? openEdit : undefined}
        />
      )}

      {/* Create / Edit estimacion modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Estimacion' : 'Nueva Estimacion'}
        size="md"
      >
        <div className="space-y-4">
          {/* Row 1: Numero, Fecha */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Numero"
              value={form.numero}
              onChange={(e) => set('numero', e.target.value)}
              placeholder="Ej. EST-001"
              required
            />
            <Input
              label="Fecha"
              type="date"
              value={form.fecha}
              onChange={(e) => set('fecha', e.target.value)}
              required
            />
          </div>

          {/* Row 2: Monto, Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Monto"
              type="number"
              value={form.monto}
              onChange={(e) => set('monto', e.target.value)}
              placeholder="0.00"
              required
            />
            <Select
              label="Estado"
              value={form.estado}
              onChange={(e) => set('estado', e.target.value)}
              options={estadoEstimacionOptions}
              placeholder="-- Seleccione estado --"
              required
            />
          </div>

          {/* Row 3: Concepto */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Concepto
            </label>
            <textarea
              value={form.concepto}
              onChange={(e) => set('concepto', e.target.value)}
              placeholder="Describa el concepto de la estimacion"
              rows={3}
              className="w-full h-auto rounded-md border border-border text-[0.9375rem] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda"
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
              disabled={!form.numero.trim() || !form.monto}
            >
              {editing ? 'Guardar cambios' : 'Crear estimacion'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setToDelete(null); }}
        onConfirm={confirmDelete}
        title="Eliminar estimacion"
        message={
          toDelete
            ? `¿Esta seguro de eliminar la estimacion "${toDelete.numero}"? Esta accion no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        loading={removeMut.isPending}
      />
    </div>
  );
}
