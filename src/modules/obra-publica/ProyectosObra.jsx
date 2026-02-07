import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProyectos } from '../../hooks/useObraPublica';
import { useCreate, useUpdate, useRemove } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { canEdit } from '../../utils/rbac';
import { TIPOS_PROYECTO_OBRA, MODALIDADES_CONTRATACION, ESTADOS_PROYECTO } from '../../config/constants';
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

const emptyForm = {
  nombre: '',
  clave: '',
  tipo: 'obra_publica',
  modalidad_contratacion: 'licitacion_publica',
  contratista: '',
  monto_contratado: '',
  monto_ejercido: '',
  avance_fisico: '',
  fecha_inicio: today(),
  fecha_fin_programada: '',
  estado: 'planeacion',
  descripcion: '',
};

export default function ProyectosObra() {
  const navigate = useNavigate();
  const { entePublico, ejercicioFiscal, rol } = useAppStore();
  const editable = canEdit(rol, 'obra_publica');

  // --- CRUD state ---
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');

  // --- Data hooks ---
  const { data: proyectos = [], isLoading } = useProyectos();

  const createMut = useCreate('proyecto_obra');
  const updateMut = useUpdate('proyecto_obra');
  const removeMut = useRemove('proyecto_obra');

  // --- Filtered data ---
  const filteredData = useMemo(() => {
    if (!filtroEstado) return proyectos;
    return proyectos.filter((p) => p.estado === filtroEstado);
  }, [proyectos, filtroEstado]);

  // --- Select options ---
  const tipoOptions = useMemo(
    () => Object.entries(TIPOS_PROYECTO_OBRA).map(([value, label]) => ({ value, label })),
    []
  );

  const modalidadOptions = useMemo(
    () => Object.entries(MODALIDADES_CONTRATACION).map(([value, label]) => ({ value, label })),
    []
  );

  const estadoOptions = useMemo(
    () => Object.entries(ESTADOS_PROYECTO).map(([value, { label }]) => ({ value, label })),
    []
  );

  const filtroEstadoOptions = useMemo(
    () => [{ value: '', label: 'Todos los estados' }, ...estadoOptions],
    [estadoOptions]
  );

  // --- Helpers ---
  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  // --- Handlers ---
  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, fecha_inicio: today() });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      nombre: row.nombre ?? '',
      clave: row.clave ?? '',
      tipo: row.tipo ?? 'obra_publica',
      modalidad_contratacion: row.modalidad_contratacion ?? 'licitacion_publica',
      contratista: row.contratista ?? '',
      monto_contratado: row.monto_contratado ?? '',
      monto_ejercido: row.monto_ejercido ?? '',
      avance_fisico: row.avance_fisico ?? '',
      fecha_inicio: row.fecha_inicio ?? today(),
      fecha_fin_programada: row.fecha_fin_programada ?? '',
      estado: row.estado ?? 'planeacion',
      descripcion: row.descripcion ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      ente_id: entePublico?.id,
      ejercicio_id: ejercicioFiscal?.id,
      monto_contratado: Number(form.monto_contratado) || 0,
      monto_ejercido: Number(form.monto_ejercido) || 0,
      avance_fisico: Number(form.avance_fisico) || 0,
      fecha_fin_programada: form.fecha_fin_programada || null,
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

  const handleRowClick = (row) => {
    navigate(`/obra-publica/proyectos/${row.id}`);
  };

  // --- Export handler ---
  const handleExport = () => {
    const excelCols = [
      { key: 'clave', label: 'Clave' },
      { key: 'nombre', label: 'Nombre' },
      { key: 'tipo', label: 'Tipo', getValue: (row) => TIPOS_PROYECTO_OBRA[row.tipo] || row.tipo },
      { key: 'modalidad_contratacion', label: 'Modalidad', getValue: (row) => MODALIDADES_CONTRATACION[row.modalidad_contratacion] || row.modalidad_contratacion },
      { key: 'contratista', label: 'Contratista' },
      { key: 'monto_contratado', label: 'Monto Contratado', getValue: (row) => Number(row.monto_contratado || 0) },
      { key: 'monto_ejercido', label: 'Monto Ejercido', getValue: (row) => Number(row.monto_ejercido || 0) },
      { key: 'avance_fisico', label: 'Avance Fisico %', getValue: (row) => Number(row.avance_fisico || 0) },
      { key: 'fecha_inicio', label: 'Fecha Inicio' },
      { key: 'fecha_fin_programada', label: 'Fecha Fin Programada' },
      { key: 'estado', label: 'Estado', getValue: (row) => ESTADOS_PROYECTO[row.estado]?.label || row.estado },
      { key: 'descripcion', label: 'Descripcion' },
    ];
    exportToExcel(filteredData, excelCols, 'proyectos_obra');
  };

  // --- Table columns ---
  const columns = useMemo(
    () => [
      { key: 'clave', label: 'Clave', width: '110px' },
      { key: 'nombre', label: 'Nombre' },
      {
        key: 'tipo',
        label: 'Tipo',
        width: '160px',
        render: (val) => TIPOS_PROYECTO_OBRA[val] || val || '\u2014',
      },
      {
        key: 'contratista',
        label: 'Contratista',
        width: '180px',
        render: (val) => val || '\u2014',
      },
      {
        key: 'monto_contratado',
        label: 'Monto Contratado',
        width: '160px',
        render: (val) => (
          <span className="text-right block tabular-nums">
            {fmtMoney(val)}
          </span>
        ),
      },
      {
        key: 'avance_fisico',
        label: 'Avance',
        width: '100px',
        render: (val) => {
          const pct = Number(val || 0);
          const variant = pct >= 80 ? 'success' : pct >= 40 ? 'warning' : 'default';
          return <Badge variant={variant}>{pct.toFixed(0)}%</Badge>;
        },
      },
      {
        key: 'estado',
        label: 'Estado',
        width: '130px',
        render: (val) => {
          const est = ESTADOS_PROYECTO[val] || { label: val, variant: 'default' };
          return <Badge variant={est.variant}>{est.label}</Badge>;
        },
      },
      {
        key: 'id',
        label: 'Acciones',
        width: '160px',
        sortable: false,
        render: (_val, row) => (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/obra-publica/proyectos/${row.id}`); }}
              className="text-xs text-info hover:text-info/80 transition-colors cursor-pointer"
            >
              Ver
            </button>
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
    [editable, navigate]
  );

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Proyectos de Obra Publica</h1>
        <p className="text-sm text-text-muted mt-1">
          Registro y seguimiento de proyectos de obra publica del ejercicio fiscal
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-text-secondary">
            Proyectos
            <span className="ml-2 text-text-muted font-normal">
              ({filteredData.length} registros)
            </span>
          </h2>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="h-[38px] rounded-md border border-border text-[0.8125rem] px-3 focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda"
          >
            {filtroEstadoOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExport} variant="outline-primary" size="sm">
            Exportar Excel
          </Button>
          {editable && (
            <Button onClick={openCreate} size="sm">
              + Nuevo Proyecto
            </Button>
          )}
        </div>
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando proyectos de obra publica...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredData}
          onRowClick={handleRowClick}
        />
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Proyecto' : 'Nuevo Proyecto'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Row 1: Nombre, Clave */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre del Proyecto"
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              placeholder="Nombre del proyecto"
              required
            />
            <Input
              label="Clave"
              value={form.clave}
              onChange={(e) => set('clave', e.target.value)}
              placeholder="Ej. OP-2026-001"
              required
            />
          </div>

          {/* Row 2: Tipo, Modalidad Contratacion */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Tipo de Proyecto"
              value={form.tipo}
              onChange={(e) => set('tipo', e.target.value)}
              options={tipoOptions}
              placeholder="-- Seleccione tipo --"
              required
            />
            <Select
              label="Modalidad de Contratacion"
              value={form.modalidad_contratacion}
              onChange={(e) => set('modalidad_contratacion', e.target.value)}
              options={modalidadOptions}
              placeholder="-- Seleccione modalidad --"
              required
            />
          </div>

          {/* Row 3: Contratista, Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Contratista"
              value={form.contratista}
              onChange={(e) => set('contratista', e.target.value)}
              placeholder="Nombre del contratista"
            />
            <Select
              label="Estado"
              value={form.estado}
              onChange={(e) => set('estado', e.target.value)}
              options={estadoOptions}
              placeholder="-- Seleccione estado --"
              required
            />
          </div>

          {/* Row 4: Monto Contratado, Monto Ejercido, Avance Fisico */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Monto Contratado"
              type="number"
              value={form.monto_contratado}
              onChange={(e) => set('monto_contratado', e.target.value)}
              placeholder="0.00"
              required
            />
            <Input
              label="Monto Ejercido"
              type="number"
              value={form.monto_ejercido}
              onChange={(e) => set('monto_ejercido', e.target.value)}
              placeholder="0.00"
            />
            <Input
              label="Avance Fisico (%)"
              type="number"
              value={form.avance_fisico}
              onChange={(e) => set('avance_fisico', e.target.value)}
              placeholder="0"
            />
          </div>

          {/* Row 5: Fecha Inicio, Fecha Fin Programada */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fecha de Inicio"
              type="date"
              value={form.fecha_inicio}
              onChange={(e) => set('fecha_inicio', e.target.value)}
              required
            />
            <Input
              label="Fecha Fin Programada"
              type="date"
              value={form.fecha_fin_programada}
              onChange={(e) => set('fecha_fin_programada', e.target.value)}
            />
          </div>

          {/* Row 6: Descripcion */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Descripcion
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) => set('descripcion', e.target.value)}
              placeholder="Describa el proyecto de obra publica"
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
              disabled={!form.nombre.trim() || !form.clave.trim()}
            >
              {editing ? 'Guardar cambios' : 'Crear proyecto'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setToDelete(null); }}
        onConfirm={confirmDelete}
        title="Eliminar proyecto"
        message={
          toDelete
            ? `¿Esta seguro de eliminar el proyecto "${toDelete.nombre}"? Esta accion no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        loading={removeMut.isPending}
      />
    </div>
  );
}
