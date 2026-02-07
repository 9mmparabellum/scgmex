import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreate, useUpdate, useRemove } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { useNominaPeriodos } from '../../hooks/useNomina';
import { ESTADOS_NOMINA } from '../../config/constants';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

const emptyForm = {
  numero_quincena: '',
  fecha_inicio: '',
  fecha_fin: '',
  fecha_pago: '',
  estado: 'borrador',
};

export default function NominaPeriodos() {
  const navigate = useNavigate();
  const { entePublico, ejercicioFiscal } = useAppStore();

  // --- CRUD state ---
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  // --- Data hooks ---
  const { data: periodos = [], isLoading } = useNominaPeriodos();

  const createMut = useCreate('nomina_periodo');
  const updateMut = useUpdate('nomina_periodo');
  const removeMut = useRemove('nomina_periodo');

  // --- Select options ---
  const estadoOptions = useMemo(
    () =>
      Object.entries(ESTADOS_NOMINA).map(([value, { label }]) => ({ value, label })),
    []
  );

  // --- Helpers ---
  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const estadoBadge = (estado) => {
    const cfg = ESTADOS_NOMINA[estado];
    return cfg ? (
      <Badge variant={cfg.variant}>{cfg.label}</Badge>
    ) : (
      <Badge variant="default">{estado}</Badge>
    );
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
      numero_quincena: row.numero_quincena ?? '',
      fecha_inicio: row.fecha_inicio ?? '',
      fecha_fin: row.fecha_fin ?? '',
      fecha_pago: row.fecha_pago ?? '',
      estado: row.estado ?? 'borrador',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      ente_id: entePublico?.id,
      ejercicio_id: ejercicioFiscal?.id,
      numero_quincena: Number(form.numero_quincena) || 0,
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

  const goToDetalle = (row) => {
    navigate(`/nomina/periodos/${row.id}`);
  };

  // --- Table columns ---
  const columns = useMemo(
    () => [
      { key: 'numero_quincena', label: 'Quincena', width: '100px' },
      {
        key: 'fecha_inicio',
        label: 'Fecha Inicio',
        width: '120px',
        render: (val) =>
          val ? new Date(val).toLocaleDateString('es-MX') : '\u2014',
      },
      {
        key: 'fecha_fin',
        label: 'Fecha Fin',
        width: '120px',
        render: (val) =>
          val ? new Date(val).toLocaleDateString('es-MX') : '\u2014',
      },
      {
        key: 'fecha_pago',
        label: 'Fecha Pago',
        width: '120px',
        render: (val) =>
          val ? new Date(val).toLocaleDateString('es-MX') : '\u2014',
      },
      {
        key: 'total_percepciones',
        label: 'Percepciones',
        width: '150px',
        render: (val) => (
          <span className="text-right block tabular-nums">
            {fmtMoney(val)}
          </span>
        ),
      },
      {
        key: 'total_deducciones',
        label: 'Deducciones',
        width: '150px',
        render: (val) => (
          <span className="text-right block tabular-nums">
            {fmtMoney(val)}
          </span>
        ),
      },
      {
        key: 'total_neto',
        label: 'Neto',
        width: '150px',
        render: (val) => (
          <span className="text-right block tabular-nums font-bold">
            {fmtMoney(val)}
          </span>
        ),
      },
      { key: 'total_empleados', label: 'Empleados', width: '100px' },
      {
        key: 'estado',
        label: 'Estado',
        width: '120px',
        render: (val) => estadoBadge(val),
      },
      {
        key: 'id',
        label: 'Acciones',
        width: '200px',
        sortable: false,
        render: (_val, row) => (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToDetalle(row);
              }}
              className="text-xs text-primary hover:text-primary-light transition-colors cursor-pointer"
            >
              Ver Detalle
            </button>
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
        <h1 className="text-xl font-bold text-text-primary">Periodos de Nomina</h1>
        <p className="text-sm text-text-muted mt-1">
          Administracion de quincenas y periodos de pago del ejercicio fiscal
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-secondary">
          Periodos
          <span className="ml-2 text-text-muted font-normal">
            ({periodos.length} registros)
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <Button onClick={openCreate} size="sm">
            + Nuevo Periodo
          </Button>
        </div>
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando periodos de nomina...
        </div>
      ) : (
        <DataTable columns={columns} data={periodos} onRowClick={goToDetalle} />
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Periodo' : 'Nuevo Periodo'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Numero de Quincena"
            type="number"
            value={form.numero_quincena}
            onChange={(e) => set('numero_quincena', e.target.value)}
            placeholder="Ej. 1, 2, 3..."
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fecha Inicio"
              type="date"
              value={form.fecha_inicio}
              onChange={(e) => set('fecha_inicio', e.target.value)}
              required
            />
            <Input
              label="Fecha Fin"
              type="date"
              value={form.fecha_fin}
              onChange={(e) => set('fecha_fin', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fecha de Pago"
              type="date"
              value={form.fecha_pago}
              onChange={(e) => set('fecha_pago', e.target.value)}
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
              disabled={!form.numero_quincena || !form.fecha_inicio || !form.fecha_fin}
            >
              {editing ? 'Guardar cambios' : 'Crear periodo'}
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
        title="Eliminar periodo de nomina"
        message={
          toDelete
            ? `¿Esta seguro de eliminar la quincena ${toDelete.numero_quincena}? Esta accion no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        loading={removeMut.isPending}
      />
    </div>
  );
}
