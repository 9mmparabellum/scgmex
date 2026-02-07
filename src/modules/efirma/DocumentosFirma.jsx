import { useState, useMemo } from 'react';
import { useCreate, useUpdate, useRemove } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { useDocumentosFirmados, useCertificados } from '../../hooks/useEFirma';
import { canEdit } from '../../utils/rbac';
import {
  TIPOS_DOCUMENTO_FIRMA,
  ESTADOS_FIRMA,
} from '../../config/constants';
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
  folio: '',
  tipo_documento: 'poliza',
  descripcion: '',
  certificado_id: '',
  firmante: '',
  fecha_firma: today(),
  cadena_original: '',
  sello_digital: '',
  estado: 'pendiente',
  notas: '',
};

export default function DocumentosFirma() {
  const { entePublico, ejercicioFiscal, rol } = useAppStore();
  const editable = canEdit(rol, 'seguridad');

  // --- CRUD state ---
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // --- Data hooks ---
  const { data: documentos = [], isLoading } = useDocumentosFirmados();
  const { data: certificados = [] } = useCertificados();

  const createMut = useCreate('documento_firmado');
  const updateMut = useUpdate('documento_firmado');
  const removeMut = useRemove('documento_firmado');

  // --- Select options ---
  const tipoDocOptions = useMemo(
    () => Object.entries(TIPOS_DOCUMENTO_FIRMA).map(([value, label]) => ({ value, label })),
    []
  );

  const estadoOptions = useMemo(
    () => Object.entries(ESTADOS_FIRMA).map(([value, { label }]) => ({ value, label })),
    []
  );

  const certificadoOptions = useMemo(
    () =>
      certificados.map((c) => ({
        value: c.id,
        label: `${c.numero_serie} - ${c.titular}`,
      })),
    [certificados]
  );

  const filtroTipoOptions = useMemo(
    () => [
      { value: '', label: 'Todos los tipos' },
      ...Object.entries(TIPOS_DOCUMENTO_FIRMA).map(([value, label]) => ({ value, label })),
    ],
    []
  );

  const filtroEstadoOptions = useMemo(
    () => [
      { value: '', label: 'Todos los estados' },
      ...Object.entries(ESTADOS_FIRMA).map(([value, { label }]) => ({ value, label })),
    ],
    []
  );

  // --- Filtered data ---
  const filteredData = useMemo(() => {
    let result = documentos;
    if (filtroTipo) result = result.filter((d) => d.tipo_documento === filtroTipo);
    if (filtroEstado) result = result.filter((d) => d.estado === filtroEstado);
    return result;
  }, [documentos, filtroTipo, filtroEstado]);

  // --- Helpers ---
  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const truncate = (str, len = 40) => {
    if (!str) return '';
    return str.length > len ? str.slice(0, len) + '...' : str;
  };

  // --- Handlers ---
  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, fecha_firma: today() });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      folio: row.folio ?? '',
      tipo_documento: row.tipo_documento ?? 'poliza',
      descripcion: row.descripcion ?? '',
      certificado_id: row.certificado_id ?? '',
      firmante: row.firmante ?? '',
      fecha_firma: row.fecha_firma ?? today(),
      cadena_original: row.cadena_original ?? '',
      sello_digital: row.sello_digital ?? '',
      estado: row.estado ?? 'pendiente',
      notas: row.notas ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      ente_id: entePublico?.id,
      ejercicio_id: ejercicioFiscal?.id,
      certificado_id: form.certificado_id || null,
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
      { key: 'folio', label: 'Folio' },
      {
        key: 'tipo_documento',
        label: 'Tipo Documento',
        getValue: (row) => TIPOS_DOCUMENTO_FIRMA[row.tipo_documento] || row.tipo_documento,
      },
      { key: 'descripcion', label: 'Descripcion' },
      {
        key: 'certificado_id',
        label: 'Certificado',
        getValue: (row) => row.certificado?.numero_serie || '',
      },
      { key: 'firmante', label: 'Firmante' },
      { key: 'fecha_firma', label: 'Fecha Firma' },
      { key: 'cadena_original', label: 'Cadena Original' },
      { key: 'sello_digital', label: 'Sello Digital' },
      {
        key: 'estado',
        label: 'Estado',
        getValue: (row) => ESTADOS_FIRMA[row.estado]?.label || row.estado,
      },
      { key: 'notas', label: 'Notas' },
    ];
    exportToExcel(filteredData, excelCols, 'documentos_firmados');
  };

  // --- Table columns ---
  const columns = useMemo(
    () => [
      { key: 'folio', label: 'Folio', width: '100px' },
      {
        key: 'tipo_documento',
        label: 'Tipo Documento',
        width: '150px',
        render: (val) => TIPOS_DOCUMENTO_FIRMA[val] || val,
      },
      {
        key: 'descripcion',
        label: 'Descripcion',
        render: (val) => (
          <span title={val || ''}>{truncate(val)}</span>
        ),
      },
      {
        key: 'certificado',
        label: 'Certificado',
        width: '160px',
        render: (val) => val?.numero_serie || '-',
      },
      { key: 'firmante', label: 'Firmante', width: '150px' },
      { key: 'fecha_firma', label: 'Fecha Firma', width: '120px' },
      {
        key: 'cadena_original',
        label: 'Cadena Original',
        width: '160px',
        render: (val) => (
          <span title={val || ''} className="font-mono text-xs">
            {truncate(val, 24)}
          </span>
        ),
      },
      {
        key: 'estado',
        label: 'Estado',
        width: '120px',
        render: (val) => {
          const est = ESTADOS_FIRMA[val] || { label: val, variant: 'default' };
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
        <h1 className="text-xl font-bold text-text-primary">Documentos Firmados</h1>
        <p className="text-sm text-text-muted mt-1">
          Control de documentos firmados electronicamente
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold text-text-secondary">
            Documentos
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
              + Nuevo Documento
            </Button>
          )}
        </div>
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando documentos firmados...
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
        title={editing ? 'Editar Documento Firmado' : 'Nuevo Documento Firmado'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Row 1: Folio, Tipo Documento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Folio"
              value={form.folio}
              onChange={(e) => set('folio', e.target.value)}
              placeholder="Ej. DOC-001"
              required
            />
            <Select
              label="Tipo de Documento"
              value={form.tipo_documento}
              onChange={(e) => set('tipo_documento', e.target.value)}
              options={tipoDocOptions}
              placeholder="-- Seleccione tipo --"
              required
            />
          </div>

          {/* Row 2: Descripcion */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Descripcion
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) => set('descripcion', e.target.value)}
              placeholder="Descripcion del documento a firmar"
              rows={2}
              className="w-full h-auto rounded-md border border-border text-[0.9375rem] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda"
            />
          </div>

          {/* Row 3: Certificado, Firmante */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Certificado"
              value={form.certificado_id}
              onChange={(e) => set('certificado_id', e.target.value)}
              options={certificadoOptions}
              placeholder="-- Seleccione certificado --"
            />
            <Input
              label="Firmante"
              value={form.firmante}
              onChange={(e) => set('firmante', e.target.value)}
              placeholder="Nombre del firmante"
              required
            />
          </div>

          {/* Row 4: Fecha Firma, Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fecha de Firma"
              type="date"
              value={form.fecha_firma}
              onChange={(e) => set('fecha_firma', e.target.value)}
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

          {/* Row 5: Cadena Original */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Cadena Original
            </label>
            <textarea
              value={form.cadena_original}
              onChange={(e) => set('cadena_original', e.target.value)}
              placeholder="||version|uuid|fecha|..."
              rows={3}
              className="w-full h-auto rounded-md border border-border text-[0.9375rem] font-mono text-xs px-3 py-2 focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda"
            />
          </div>

          {/* Row 6: Sello Digital */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Sello Digital
            </label>
            <textarea
              value={form.sello_digital}
              onChange={(e) => set('sello_digital', e.target.value)}
              placeholder="Base64 del sello digital"
              rows={3}
              className="w-full h-auto rounded-md border border-border text-[0.9375rem] font-mono text-xs px-3 py-2 focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda"
            />
          </div>

          {/* Row 7: Notas */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Notas
            </label>
            <textarea
              value={form.notas}
              onChange={(e) => set('notas', e.target.value)}
              placeholder="Observaciones o notas adicionales"
              rows={2}
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
              disabled={!form.folio.trim() || !form.firmante.trim()}
            >
              {editing ? 'Guardar cambios' : 'Crear Documento'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setToDelete(null); }}
        onConfirm={confirmDelete}
        title="Eliminar documento firmado"
        message={
          toDelete
            ? `¿Esta seguro de eliminar el documento firmado "${toDelete.folio || ''}"? Esta accion no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        loading={removeMut.isPending}
      />
    </div>
  );
}
