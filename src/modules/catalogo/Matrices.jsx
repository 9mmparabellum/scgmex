import { useState, useMemo } from 'react';
import { useList, useCreate, useUpdate, useRemove } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const MOMENTOS = [
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'modificado', label: 'Modificado' },
  { value: 'comprometido', label: 'Comprometido' },
  { value: 'devengado', label: 'Devengado' },
  { value: 'ejercido', label: 'Ejercido' },
  { value: 'pagado', label: 'Pagado' },
  { value: 'estimado', label: 'Estimado' },
  { value: 'recaudado', label: 'Recaudado' },
];

const momentoColors = {
  aprobado: 'primary',
  modificado: 'info',
  comprometido: 'warning',
  devengado: 'success',
  ejercido: 'success',
  pagado: 'success',
  estimado: 'info',
  recaudado: 'primary',
};

const emptyForm = {
  clasificador_id: '',
  momento: '',
  cuenta_cargo_id: '',
  cuenta_abono_id: '',
  descripcion: '',
  activo: true,
};

export default function Matrices() {
  const { entePublico } = useAppStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // --- Data hooks ---
  const { data: matrices = [], isLoading } = useList('matriz_conversion', {
    filter: { ente_id: entePublico?.id },
  });

  const { data: clasificadores = [] } = useList('clasificador_presupuestal', {
    filter: { ente_id: entePublico?.id },
  });

  const { data: cuentas = [] } = useList('plan_de_cuentas', {
    filter: { ente_id: entePublico?.id },
  });

  const createMut = useCreate('matriz_conversion');
  const updateMut = useUpdate('matriz_conversion');
  const removeMut = useRemove('matriz_conversion');

  // --- Helper maps ---
  const clasificadorMap = useMemo(() => {
    const map = {};
    clasificadores.forEach((c) => { map[c.id] = c; });
    return map;
  }, [clasificadores]);

  const cuentaMap = useMemo(() => {
    const map = {};
    cuentas.forEach((c) => { map[c.id] = c; });
    return map;
  }, [cuentas]);

  // --- Derived options ---
  const clasificadorOptions = useMemo(
    () => clasificadores.map((c) => ({
      value: c.id,
      label: `${c.codigo} — ${c.nombre}`,
    })),
    [clasificadores],
  );

  const cuentaOptions = useMemo(
    () => cuentas
      .filter((c) => c.es_detalle === true || (c.nivel != null && c.nivel >= 3))
      .map((c) => ({
        value: c.id,
        label: `${c.codigo} — ${c.nombre}`,
      })),
    [cuentas],
  );

  // --- Formatters ---
  const fmtClasificador = (id) => {
    const c = clasificadorMap[id];
    return c ? `${c.codigo} — ${c.nombre}` : '—';
  };

  const fmtCuenta = (id) => {
    const c = cuentaMap[id];
    return c ? `${c.codigo} — ${c.nombre}` : '—';
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
      clasificador_id: row.clasificador_id ?? '',
      momento: row.momento ?? '',
      cuenta_cargo_id: row.cuenta_cargo_id ?? '',
      cuenta_abono_id: row.cuenta_abono_id ?? '',
      descripcion: row.descripcion ?? '',
      activo: row.activo ?? true,
    });
    setModalOpen(true);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const record = {
      ...form,
      ente_id: entePublico?.id,
      clasificador_id: form.clasificador_id || null,
      cuenta_cargo_id: form.cuenta_cargo_id || null,
      cuenta_abono_id: form.cuenta_abono_id || null,
    };

    if (editing) {
      await updateMut.mutateAsync({ id: editing.id, ...record });
    } else {
      await createMut.mutateAsync(record);
    }
    setModalOpen(false);
  };

  const askDelete = (row) => {
    setDeleteTarget(row);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      await removeMut.mutateAsync(deleteTarget.id);
    }
    setConfirmOpen(false);
    setDeleteTarget(null);
  };

  // --- Table columns ---
  const columns = [
    {
      key: 'clasificador_id',
      label: 'Clasificador',
      render: (val) => (
        <span className="text-sm">{fmtClasificador(val)}</span>
      ),
    },
    {
      key: 'momento',
      label: 'Momento',
      width: '140px',
      render: (val) => (
        <Badge variant={momentoColors[val] || 'default'}>
          {MOMENTOS.find((m) => m.value === val)?.label ?? val ?? '—'}
        </Badge>
      ),
    },
    {
      key: 'cuenta_cargo_id',
      label: 'Cuenta Cargo',
      render: (val) => (
        <span className="text-sm">{fmtCuenta(val)}</span>
      ),
    },
    {
      key: 'cuenta_abono_id',
      label: 'Cuenta Abono',
      render: (val) => (
        <span className="text-sm">{fmtCuenta(val)}</span>
      ),
    },
    {
      key: 'activo',
      label: 'Estado',
      width: '100px',
      render: (val) => (
        <Badge variant={val ? 'success' : 'default'}>
          {val ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'id',
      label: 'Acciones',
      width: '160px',
      sortable: false,
      render: (_val, row) => (
        <div className="flex items-center gap-2">
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
        </div>
      ),
    },
  ];

  const isSaving = createMut.isPending || updateMut.isPending;
  const isFormValid = form.clasificador_id && form.momento && form.cuenta_cargo_id && form.cuenta_abono_id;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Matrices de Conversion</h1>
        <p className="text-sm text-text-muted mt-1">
          Art. 41 &mdash; Vinculacion presupuestal-contable para registro dual automatico
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-secondary">
          Reglas de conversion
          <span className="ml-2 text-text-muted font-normal">
            ({matrices.length} registros)
          </span>
        </h2>
        <Button onClick={openCreate} size="sm">
          + Nueva regla
        </Button>
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando matrices de conversion...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={matrices}
          onRowClick={openEdit}
        />
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Regla de Conversion' : 'Nueva Regla de Conversion'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Clasificador */}
          <Select
            label="Clasificador presupuestal"
            value={form.clasificador_id}
            onChange={(e) => handleChange('clasificador_id', e.target.value)}
            placeholder="— Seleccionar clasificador —"
            options={clasificadorOptions}
          />

          {/* Momento */}
          <Select
            label="Momento contable"
            value={form.momento}
            onChange={(e) => handleChange('momento', e.target.value)}
            placeholder="— Seleccionar momento —"
            options={MOMENTOS}
          />

          {/* Cuenta Cargo */}
          <Select
            label="Cuenta de cargo"
            value={form.cuenta_cargo_id}
            onChange={(e) => handleChange('cuenta_cargo_id', e.target.value)}
            placeholder="— Seleccionar cuenta de cargo —"
            options={cuentaOptions}
          />

          {/* Cuenta Abono */}
          <Select
            label="Cuenta de abono"
            value={form.cuenta_abono_id}
            onChange={(e) => handleChange('cuenta_abono_id', e.target.value)}
            placeholder="— Seleccionar cuenta de abono —"
            options={cuentaOptions}
          />

          {/* Descripcion */}
          <div className="w-full">
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Descripcion
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              placeholder="Descripcion de la regla de conversion (opcional)"
              rows={3}
              className="block w-full rounded-lg border border-border bg-bg-input text-text-primary text-sm px-3 py-2 placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
            />
          </div>

          {/* Activo */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => handleChange('activo', e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary/30 h-4 w-4 cursor-pointer"
            />
            <span className="text-sm text-text-secondary">Activo</span>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              loading={isSaving}
              disabled={!isFormValid}
            >
              {editing ? 'Guardar cambios' : 'Crear regla'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setDeleteTarget(null); }}
        onConfirm={confirmDelete}
        title="Eliminar regla de conversion"
        message={
          deleteTarget
            ? `¿Esta seguro de eliminar esta regla de conversion para "${fmtClasificador(deleteTarget.clasificador_id)}"? Esta accion no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        loading={removeMut.isPending}
      />
    </div>
  );
}
