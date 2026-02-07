import { useState, useMemo } from 'react';
import { useCreate, useUpdate, useRemove } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { useCertificados, useResumenEFirma } from '../../hooks/useEFirma';
import { canEdit } from '../../utils/rbac';
import { TIPOS_CERTIFICADO, ESTADOS_CERTIFICADO } from '../../config/constants';
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
  numero_serie: '',
  titular: '',
  rfc: '',
  tipo: 'fiel',
  fecha_vigencia_inicio: today(),
  fecha_vigencia_fin: '',
  estado: 'vigente',
  emisor: '',
  notas: '',
};

export default function EFirmaMain() {
  const { entePublico, rol } = useAppStore();
  const editable = canEdit(rol, 'seguridad');

  // --- CRUD state ---
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  // --- Data hooks ---
  const { data: certificados = [], isLoading } = useCertificados();
  const { data: resumen = {}, isLoading: loadingResumen } = useResumenEFirma();

  const createMut = useCreate('certificado_efirma');
  const updateMut = useUpdate('certificado_efirma');
  const removeMut = useRemove('certificado_efirma');

  // --- Select options ---
  const tipoOptions = useMemo(
    () => Object.entries(TIPOS_CERTIFICADO).map(([value, label]) => ({ value, label })),
    []
  );

  const estadoOptions = useMemo(
    () => Object.entries(ESTADOS_CERTIFICADO).map(([value, { label }]) => ({ value, label })),
    []
  );

  // --- Summary cards ---
  const summaryCards = useMemo(() => {
    const totalCerts = resumen.totalCertificados || 0;
    const vigentes = resumen.vigentes || 0;
    const porVencer = resumen.porVencer || 0;
    const totalDocs = resumen.totalDocumentos || 0;
    const firmados = resumen.firmados || 0;
    const pendientes = resumen.pendientes || 0;

    return [
      { label: 'Total Certificados', value: totalCerts, color: 'text-text-primary' },
      { label: 'Vigentes', value: vigentes, color: 'text-[#56ca00]' },
      { label: 'Por Vencer', value: porVencer, color: 'text-[#e09600]' },
      { label: 'Total Documentos', value: totalDocs, color: 'text-text-primary' },
      { label: 'Firmados', value: firmados, color: 'text-[#56ca00]' },
      { label: 'Pendientes', value: pendientes, color: 'text-[#e09600]' },
    ];
  }, [resumen]);

  // --- Helpers ---
  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const isExpiringSoon = (row) => {
    if (row.estado !== 'vigente' || !row.fecha_vigencia_fin) return false;
    const now = new Date();
    const end = new Date(row.fecha_vigencia_fin);
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    return end.getTime() - now.getTime() < thirtyDays;
  };

  // --- Handlers ---
  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, fecha_vigencia_inicio: today() });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      numero_serie: row.numero_serie ?? '',
      titular: row.titular ?? '',
      rfc: row.rfc ?? '',
      tipo: row.tipo ?? 'fiel',
      fecha_vigencia_inicio: row.fecha_vigencia_inicio ?? today(),
      fecha_vigencia_fin: row.fecha_vigencia_fin ?? '',
      estado: row.estado ?? 'vigente',
      emisor: row.emisor ?? '',
      notas: row.notas ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      ente_id: entePublico?.id,
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
      { key: 'numero_serie', label: 'Numero de Serie' },
      { key: 'titular', label: 'Titular' },
      { key: 'rfc', label: 'RFC' },
      { key: 'tipo', label: 'Tipo', getValue: (row) => TIPOS_CERTIFICADO[row.tipo] || row.tipo },
      { key: 'fecha_vigencia_inicio', label: 'Fecha Inicio' },
      { key: 'fecha_vigencia_fin', label: 'Fecha Fin' },
      { key: 'estado', label: 'Estado', getValue: (row) => ESTADOS_CERTIFICADO[row.estado]?.label || row.estado },
      { key: 'emisor', label: 'Emisor' },
      { key: 'notas', label: 'Notas' },
    ];
    exportToExcel(certificados, excelCols, 'certificados_efirma');
  };

  // --- Table columns ---
  const columns = useMemo(
    () => [
      { key: 'numero_serie', label: 'Numero de Serie', width: '160px' },
      { key: 'titular', label: 'Titular' },
      { key: 'rfc', label: 'RFC', width: '140px' },
      {
        key: 'tipo',
        label: 'Tipo',
        width: '160px',
        render: (val) => TIPOS_CERTIFICADO[val] || val,
      },
      { key: 'fecha_vigencia_inicio', label: 'Fecha Inicio', width: '120px' },
      { key: 'fecha_vigencia_fin', label: 'Fecha Fin', width: '120px' },
      {
        key: 'estado',
        label: 'Estado',
        width: '120px',
        render: (val) => {
          const est = ESTADOS_CERTIFICADO[val] || { label: val, variant: 'default' };
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
        <h1 className="text-xl font-bold text-text-primary">e.firma / FIEL</h1>
        <p className="text-sm text-text-muted mt-1">
          Gestion de certificados de firma electronica y documentos firmados
        </p>
      </div>

      {/* Summary cards */}
      {loadingResumen ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando resumen de e.firma...
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {summaryCards.map((card) => (
            <div key={card.label} className="bg-white rounded-lg card-shadow p-4">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
                {card.label}
              </p>
              <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-secondary">
          Certificados
          <span className="ml-2 text-text-muted font-normal">
            ({certificados.length} registros)
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <Button onClick={handleExport} variant="outline-primary" size="sm">
            Exportar Excel
          </Button>
          {editable && (
            <Button onClick={openCreate} size="sm">
              + Nuevo Certificado
            </Button>
          )}
        </div>
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando certificados...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={certificados}
          onRowClick={openEdit}
          rowClassName={(row) =>
            isExpiringSoon(row) ? 'bg-amber-50' : ''
          }
        />
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Certificado' : 'Nuevo Certificado'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Row 1: Numero de Serie, RFC */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Numero de Serie"
              value={form.numero_serie}
              onChange={(e) => set('numero_serie', e.target.value)}
              placeholder="Ej. 30001000000400002434"
              required
            />
            <Input
              label="RFC"
              value={form.rfc}
              onChange={(e) => set('rfc', e.target.value)}
              placeholder="RFC del titular"
              required
            />
          </div>

          {/* Row 2: Titular, Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Titular"
              value={form.titular}
              onChange={(e) => set('titular', e.target.value)}
              placeholder="Nombre del titular del certificado"
              required
            />
            <Select
              label="Tipo"
              value={form.tipo}
              onChange={(e) => set('tipo', e.target.value)}
              options={tipoOptions}
              placeholder="-- Seleccione tipo --"
              required
            />
          </div>

          {/* Row 3: Fecha Inicio, Fecha Fin */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fecha de Vigencia Inicio"
              type="date"
              value={form.fecha_vigencia_inicio}
              onChange={(e) => set('fecha_vigencia_inicio', e.target.value)}
              required
            />
            <Input
              label="Fecha de Vigencia Fin"
              type="date"
              value={form.fecha_vigencia_fin}
              onChange={(e) => set('fecha_vigencia_fin', e.target.value)}
              required
            />
          </div>

          {/* Row 4: Estado, Emisor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Estado"
              value={form.estado}
              onChange={(e) => set('estado', e.target.value)}
              options={estadoOptions}
              placeholder="-- Seleccione estado --"
              required
            />
            <Input
              label="Emisor"
              value={form.emisor}
              onChange={(e) => set('emisor', e.target.value)}
              placeholder="Ej. SAT, Autoridad Certificadora"
            />
          </div>

          {/* Row 5: Notas */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Notas
            </label>
            <textarea
              value={form.notas}
              onChange={(e) => set('notas', e.target.value)}
              placeholder="Observaciones o notas adicionales"
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
              disabled={
                !form.numero_serie.trim() ||
                !form.titular.trim() ||
                !form.rfc.trim() ||
                !form.fecha_vigencia_fin
              }
            >
              {editing ? 'Guardar cambios' : 'Crear Certificado'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setToDelete(null); }}
        onConfirm={confirmDelete}
        title="Eliminar certificado"
        message={
          toDelete
            ? `¿Esta seguro de eliminar el certificado con numero de serie "${toDelete.numero_serie || ''}"? Esta accion no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        loading={removeMut.isPending}
      />
    </div>
  );
}
