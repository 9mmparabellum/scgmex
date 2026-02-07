import { useState, useMemo } from 'react';
import { useCreate, useUpdate, useRemove } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { useEmpleados } from '../../hooks/useNomina';
import { TIPOS_CONTRATO, ESTADOS_EMPLEADO } from '../../config/constants';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { exportToExcel } from '../../utils/exportHelpers';

const emptyForm = {
  numero_empleado: '',
  nombre: '',
  rfc: '',
  curp: '',
  nss: '',
  fecha_ingreso: '',
  puesto: '',
  area: '',
  nivel_tabulador: '',
  tipo_contrato: 'base',
  estado: 'activo',
  cuenta_bancaria: '',
  banco: '',
};

export default function Empleados() {
  const { entePublico } = useAppStore();

  // --- CRUD state ---
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  // --- Data hooks ---
  const { data: empleados = [], isLoading } = useEmpleados();

  const createMut = useCreate('empleado');
  const updateMut = useUpdate('empleado');
  const removeMut = useRemove('empleado');

  // --- Select options ---
  const tipoContratoOptions = useMemo(
    () => Object.entries(TIPOS_CONTRATO).map(([value, label]) => ({ value, label })),
    []
  );

  const estadoOptions = useMemo(
    () =>
      Object.entries(ESTADOS_EMPLEADO).map(([value, { label }]) => ({ value, label })),
    []
  );

  // --- Helpers ---
  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const estadoBadge = (estado) => {
    const cfg = ESTADOS_EMPLEADO[estado];
    return cfg ? (
      <Badge variant={cfg.variant}>{cfg.label}</Badge>
    ) : (
      <Badge variant="default">{estado}</Badge>
    );
  };

  const tipoContratoLabel = (tipo) => TIPOS_CONTRATO[tipo] || tipo;

  const tipoContratoBadge = (tipo) => {
    const variants = {
      base: 'primary',
      confianza: 'info',
      eventual: 'warning',
      honorarios: 'default',
    };
    return variants[tipo] || 'default';
  };

  // --- Handlers ---
  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      numero_empleado: row.numero_empleado ?? '',
      nombre: row.nombre ?? '',
      rfc: row.rfc ?? '',
      curp: row.curp ?? '',
      nss: row.nss ?? '',
      fecha_ingreso: row.fecha_ingreso ?? '',
      puesto: row.puesto ?? '',
      area: row.area ?? '',
      nivel_tabulador: row.nivel_tabulador ?? '',
      tipo_contrato: row.tipo_contrato ?? 'base',
      estado: row.estado ?? 'activo',
      cuenta_bancaria: row.cuenta_bancaria ?? '',
      banco: row.banco ?? '',
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
      { key: 'numero_empleado', label: 'No. Empleado' },
      { key: 'nombre', label: 'Nombre' },
      { key: 'rfc', label: 'RFC' },
      { key: 'curp', label: 'CURP' },
      { key: 'nss', label: 'NSS' },
      { key: 'fecha_ingreso', label: 'Fecha Ingreso' },
      { key: 'puesto', label: 'Puesto' },
      { key: 'area', label: 'Area' },
      { key: 'nivel_tabulador', label: 'Nivel Tabulador' },
      {
        key: 'tipo_contrato',
        label: 'Tipo Contrato',
        getValue: (row) => tipoContratoLabel(row.tipo_contrato),
      },
      {
        key: 'estado',
        label: 'Estado',
        getValue: (row) => ESTADOS_EMPLEADO[row.estado]?.label || row.estado,
      },
      { key: 'cuenta_bancaria', label: 'Cuenta Bancaria' },
      { key: 'banco', label: 'Banco' },
    ];
    exportToExcel(empleados, excelCols, 'empleados');
  };

  // --- Table columns ---
  const columns = useMemo(
    () => [
      { key: 'numero_empleado', label: 'No. Empleado', width: '120px' },
      { key: 'nombre', label: 'Nombre' },
      { key: 'rfc', label: 'RFC', width: '140px' },
      { key: 'puesto', label: 'Puesto', width: '150px' },
      { key: 'area', label: 'Area', width: '130px' },
      {
        key: 'tipo_contrato',
        label: 'Tipo Contrato',
        width: '130px',
        render: (val) => (
          <Badge variant={tipoContratoBadge(val)}>
            {tipoContratoLabel(val)}
          </Badge>
        ),
      },
      {
        key: 'estado',
        label: 'Estado',
        width: '110px',
        render: (val) => estadoBadge(val),
      },
      {
        key: 'id',
        label: 'Acciones',
        width: '140px',
        sortable: false,
        render: (_val, row) => (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openEdit(row);
              }}
              className="text-xs text-primary hover:text-primary-light transition-colors cursor-pointer"
            >
              Editar
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                askDelete(row);
              }}
              className="text-xs text-danger hover:text-danger/80 transition-colors cursor-pointer"
            >
              Eliminar
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Empleados</h1>
        <p className="text-sm text-text-muted mt-1">
          Administracion del padron de empleados del ente publico
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-secondary">
          Empleados
          <span className="ml-2 text-text-muted font-normal">
            ({empleados.length} registros)
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <Button onClick={handleExport} variant="outline-primary" size="sm">
            Exportar Excel
          </Button>
          <Button onClick={openCreate} size="sm">
            + Nuevo Empleado
          </Button>
        </div>
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando empleados...
        </div>
      ) : (
        <DataTable columns={columns} data={empleados} onRowClick={openEdit} />
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Empleado' : 'Nuevo Empleado'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Row 1: No. Empleado, Nombre */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Numero de Empleado"
              value={form.numero_empleado}
              onChange={(e) => set('numero_empleado', e.target.value)}
              placeholder="Ej. EMP-001"
              required
            />
            <Input
              label="Nombre Completo"
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              placeholder="Nombre completo del empleado"
              required
            />
          </div>

          {/* Row 2: RFC, CURP */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="RFC"
              value={form.rfc}
              onChange={(e) => set('rfc', e.target.value)}
              placeholder="13 caracteres"
            />
            <Input
              label="CURP"
              value={form.curp}
              onChange={(e) => set('curp', e.target.value)}
              placeholder="18 caracteres"
            />
          </div>

          {/* Row 3: NSS, Fecha Ingreso */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="NSS"
              value={form.nss}
              onChange={(e) => set('nss', e.target.value)}
              placeholder="Numero de Seguridad Social"
            />
            <Input
              label="Fecha de Ingreso"
              type="date"
              value={form.fecha_ingreso}
              onChange={(e) => set('fecha_ingreso', e.target.value)}
            />
          </div>

          {/* Row 4: Puesto, Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Puesto"
              value={form.puesto}
              onChange={(e) => set('puesto', e.target.value)}
              placeholder="Puesto del empleado"
            />
            <Input
              label="Area"
              value={form.area}
              onChange={(e) => set('area', e.target.value)}
              placeholder="Area o departamento"
            />
          </div>

          {/* Row 5: Nivel Tabulador, Tipo Contrato */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nivel Tabulador"
              value={form.nivel_tabulador}
              onChange={(e) => set('nivel_tabulador', e.target.value)}
              placeholder="Nivel en el tabulador"
            />
            <Select
              label="Tipo de Contrato"
              value={form.tipo_contrato}
              onChange={(e) => set('tipo_contrato', e.target.value)}
              options={tipoContratoOptions}
              placeholder="-- Seleccione tipo --"
              required
            />
          </div>

          {/* Row 6: Estado, Cuenta Bancaria */}
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
              label="Cuenta Bancaria"
              value={form.cuenta_bancaria}
              onChange={(e) => set('cuenta_bancaria', e.target.value)}
              placeholder="Numero de cuenta"
            />
          </div>

          {/* Row 7: Banco */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Banco"
              value={form.banco}
              onChange={(e) => set('banco', e.target.value)}
              placeholder="Nombre del banco"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button
              variant="ghost"
              onClick={() => setModalOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              loading={isSaving}
              disabled={!form.numero_empleado.trim() || !form.nombre.trim()}
            >
              {editing ? 'Guardar cambios' : 'Crear empleado'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Eliminar empleado"
        message={
          toDelete
            ? `¿Esta seguro de eliminar al empleado "${toDelete.numero_empleado} — ${toDelete.nombre}"? Esta accion no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        loading={removeMut.isPending}
      />
    </div>
  );
}
