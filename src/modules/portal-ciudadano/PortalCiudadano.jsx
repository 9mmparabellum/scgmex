import { useState, useMemo } from 'react';
import { useCreate, useUpdate, useRemove } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { usePublicaciones, useResumenPortal } from '../../hooks/usePortalCiudadano';
import { canEdit } from '../../utils/rbac';
import { TIPOS_PUBLICACION_PORTAL, ESTADOS_PUBLICACION } from '../../config/constants';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { exportToExcel } from '../../utils/exportHelpers';

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = {
  titulo: '',
  tipo: 'estado_financiero',
  descripcion: '',
  contenido: '',
  fecha_publicacion: today(),
  fecha_vigencia: '',
  url_documento: '',
  estado: 'borrador',
};

export default function PortalCiudadano() {
  const { entePublico, ejercicioFiscal, rol } = useAppStore();
  const editable = canEdit(rol, 'portal');

  // --- CRUD state ---
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // --- Data hooks ---
  const { data: publicaciones = [], isLoading } = usePublicaciones();
  const { data: resumen = {}, isLoading: isLoadingResumen } = useResumenPortal();

  const createMut = useCreate('publicacion_portal');
  const updateMut = useUpdate('publicacion_portal');
  const removeMut = useRemove('publicacion_portal');

  // --- Select options ---
  const tipoOptions = useMemo(
    () => Object.entries(TIPOS_PUBLICACION_PORTAL).map(([value, label]) => ({ value, label })),
    []
  );

  const estadoOptions = useMemo(
    () => Object.entries(ESTADOS_PUBLICACION).map(([value, { label }]) => ({ value, label })),
    []
  );

  const filtroTipoOptions = useMemo(
    () => [
      { value: '', label: 'Todos los tipos' },
      ...Object.entries(TIPOS_PUBLICACION_PORTAL).map(([value, label]) => ({ value, label })),
    ],
    []
  );

  const filtroEstadoOptions = useMemo(
    () => [
      { value: '', label: 'Todos los estados' },
      ...Object.entries(ESTADOS_PUBLICACION).map(([value, { label }]) => ({ value, label })),
    ],
    []
  );

  // --- Filtered data ---
  const filteredData = useMemo(() => {
    let result = publicaciones;
    if (filtroTipo) result = result.filter((p) => p.tipo === filtroTipo);
    if (filtroEstado) result = result.filter((p) => p.estado === filtroEstado);
    return result;
  }, [publicaciones, filtroTipo, filtroEstado]);

  // --- Helpers ---
  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const truncate = (text, max = 50) => {
    if (!text) return '';
    return text.length > max ? text.slice(0, max) + '...' : text;
  };

  // --- Summary cards ---
  const summaryCards = [
    { label: 'Total Publicaciones', value: resumen.total || 0 },
    { label: 'Publicados', value: resumen.publicados || 0 },
    { label: 'En Revision', value: resumen.enRevision || 0 },
    { label: 'Borradores', value: resumen.borradores || 0 },
  ];

  // --- Handlers ---
  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, fecha_publicacion: today() });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      titulo: row.titulo ?? '',
      tipo: row.tipo ?? 'estado_financiero',
      descripcion: row.descripcion ?? '',
      contenido: row.contenido ?? '',
      fecha_publicacion: row.fecha_publicacion ?? today(),
      fecha_vigencia: row.fecha_vigencia ?? '',
      url_documento: row.url_documento ?? '',
      estado: row.estado ?? 'borrador',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      ente_id: entePublico?.id,
      ejercicio_id: ejercicioFiscal?.id,
      fecha_vigencia: form.fecha_vigencia || null,
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
      { key: 'titulo', label: 'Titulo' },
      { key: 'tipo', label: 'Tipo', getValue: (row) => TIPOS_PUBLICACION_PORTAL[row.tipo] || row.tipo },
      { key: 'descripcion', label: 'Descripcion' },
      { key: 'fecha_publicacion', label: 'Fecha Publicacion' },
      { key: 'fecha_vigencia', label: 'Fecha Vigencia' },
      { key: 'url_documento', label: 'URL Documento' },
      { key: 'estado', label: 'Estado', getValue: (row) => ESTADOS_PUBLICACION[row.estado]?.label || row.estado },
    ];
    exportToExcel(filteredData, excelCols, 'publicaciones_portal');
  };

  // --- Table columns ---
  const columns = useMemo(
    () => [
      { key: 'titulo', label: 'Titulo' },
      {
        key: 'tipo',
        label: 'Tipo',
        width: '160px',
        render: (val) => TIPOS_PUBLICACION_PORTAL[val] || val,
      },
      {
        key: 'descripcion',
        label: 'Descripcion',
        width: '220px',
        render: (val) => (
          <span title={val || ''}>{truncate(val)}</span>
        ),
      },
      { key: 'fecha_publicacion', label: 'Fecha Publicacion', width: '140px' },
      { key: 'fecha_vigencia', label: 'Fecha Vigencia', width: '130px' },
      {
        key: 'estado',
        label: 'Estado',
        width: '130px',
        render: (val) => {
          const est = ESTADOS_PUBLICACION[val] || { label: val, variant: 'default' };
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
            <button
              onClick={(e) => { e.stopPropagation(); openEdit(row); }}
              className="text-xs text-primary hover:text-primary-light transition-colors cursor-pointer"
            >
              Editar
            </button>
            {editable && (
              <button
                onClick={(e) => { e.stopPropagation(); askDelete(row); }}
                className="text-xs text-danger hover:text-danger/80 transition-colors cursor-pointer"
              >
                Eliminar
              </button>
            )}
          </div>
        ),
      },
    ],
    [editable]
  );

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Portal Ciudadano</h1>
        <p className="text-sm text-text-muted mt-1">
          Gestion de publicaciones de transparencia para el portal ciudadano
        </p>
      </div>

      {/* Summary cards */}
      {isLoadingResumen ? (
        <div className="flex items-center justify-center py-10 text-text-muted text-sm">
          Cargando resumen...
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {summaryCards.map((card) => (
            <div key={card.label} className="bg-white rounded-lg card-shadow p-4">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-1">{card.label}</p>
              <p className="text-lg font-bold text-text-primary">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold text-text-secondary">
            Publicaciones
            <span className="ml-2 text-text-muted font-normal">
              ({filteredData.length} registros)
            </span>
          </h2>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="h-[38px] rounded-md border border-border text-[0.9375rem] px-3 focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda"
          >
            {filtroTipoOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="h-[38px] rounded-md border border-border text-[0.9375rem] px-3 focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda"
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
              + Nueva Publicacion
            </Button>
          )}
        </div>
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando publicaciones...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredData}
          onRowClick={openEdit}
        />
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Publicacion' : 'Nueva Publicacion'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Row 1: Titulo */}
          <Input
            label="Titulo"
            value={form.titulo}
            onChange={(e) => set('titulo', e.target.value)}
            placeholder="Titulo de la publicacion"
            required
          />

          {/* Row 2: Tipo, Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Tipo"
              value={form.tipo}
              onChange={(e) => set('tipo', e.target.value)}
              options={tipoOptions}
              placeholder="-- Seleccione tipo --"
              required
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

          {/* Row 3: Descripcion */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Descripcion
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) => set('descripcion', e.target.value)}
              placeholder="Descripcion breve de la publicacion"
              rows={3}
              className="w-full h-auto rounded-md border border-border text-[0.9375rem] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda"
            />
          </div>

          {/* Row 4: Contenido */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Contenido
            </label>
            <textarea
              value={form.contenido}
              onChange={(e) => set('contenido', e.target.value)}
              placeholder="Contenido completo de la publicacion"
              rows={6}
              className="w-full h-auto rounded-md border border-border text-[0.9375rem] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda"
            />
          </div>

          {/* Row 5: Fecha Publicacion, Fecha Vigencia */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fecha de Publicacion"
              type="date"
              value={form.fecha_publicacion}
              onChange={(e) => set('fecha_publicacion', e.target.value)}
              required
            />
            <Input
              label="Fecha de Vigencia (opcional)"
              type="date"
              value={form.fecha_vigencia}
              onChange={(e) => set('fecha_vigencia', e.target.value)}
            />
          </div>

          {/* Row 6: URL Documento */}
          <Input
            label="URL del Documento"
            value={form.url_documento}
            onChange={(e) => set('url_documento', e.target.value)}
            placeholder="https://ejemplo.com/documento.pdf"
          />

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              loading={isSaving}
              disabled={!form.titulo.trim()}
            >
              {editing ? 'Guardar cambios' : 'Crear publicacion'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setToDelete(null); }}
        onConfirm={confirmDelete}
        title="Eliminar publicacion"
        message={
          toDelete
            ? `¿Esta seguro de eliminar la publicacion "${toDelete.titulo}"? Esta accion no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        loading={removeMut.isPending}
      />
    </div>
  );
}
