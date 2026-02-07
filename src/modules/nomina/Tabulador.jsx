import { useState, useMemo } from 'react';
import { useCreate, useUpdate, useRemove } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { useTabulador } from '../../hooks/useNomina';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

const emptyForm = {
  nivel: '',
  puesto_tipo: '',
  sueldo_mensual: '',
};

export default function Tabulador() {
  const { entePublico, ejercicioFiscal } = useAppStore();

  // --- CRUD state ---
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  // --- Data hooks ---
  const { data: tabulador = [], isLoading } = useTabulador();

  const createMut = useCreate('tabulador');
  const updateMut = useUpdate('tabulador');
  const removeMut = useRemove('tabulador');

  // --- Helpers ---
  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  // --- Handlers ---
  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      nivel: row.nivel ?? '',
      puesto_tipo: row.puesto_tipo ?? '',
      sueldo_mensual: row.sueldo_mensual ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      ente_id: entePublico?.id,
      ejercicio_id: ejercicioFiscal?.id,
      sueldo_mensual: Number(form.sueldo_mensual) || 0,
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

  // --- Table columns ---
  const columns = useMemo(
    () => [
      { key: 'nivel', label: 'Nivel', width: '120px' },
      { key: 'puesto_tipo', label: 'Tipo de Puesto' },
      {
        key: 'sueldo_mensual',
        label: 'Sueldo Mensual',
        width: '180px',
        render: (val) => (
          <span className="text-right block tabular-nums">
            {fmtMoney(val)}
          </span>
        ),
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
        <h1 className="text-xl font-bold text-text-primary">Tabulador de Sueldos</h1>
        <p className="text-sm text-text-muted mt-1">
          Escala salarial por niveles y tipos de puesto del ejercicio fiscal
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-secondary">
          Tabulador
          <span className="ml-2 text-text-muted font-normal">
            ({tabulador.length} registros)
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <Button onClick={openCreate} size="sm">
            + Nuevo Nivel
          </Button>
        </div>
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando tabulador...
        </div>
      ) : (
        <DataTable columns={columns} data={tabulador} onRowClick={openEdit} />
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Nivel' : 'Nuevo Nivel'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Nivel"
            value={form.nivel}
            onChange={(e) => set('nivel', e.target.value)}
            placeholder="Ej. 1, 2, 3..."
            required
          />
          <Input
            label="Tipo de Puesto"
            value={form.puesto_tipo}
            onChange={(e) => set('puesto_tipo', e.target.value)}
            placeholder="Ej. Directivo, Operativo..."
            required
          />
          <Input
            label="Sueldo Mensual"
            type="number"
            value={form.sueldo_mensual}
            onChange={(e) => set('sueldo_mensual', e.target.value)}
            placeholder="0.00"
            required
          />

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
              disabled={!form.nivel || !form.puesto_tipo.trim()}
            >
              {editing ? 'Guardar cambios' : 'Crear nivel'}
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
        title="Eliminar nivel de tabulador"
        message={
          toDelete
            ? `¿Esta seguro de eliminar el nivel "${toDelete.nivel} — ${toDelete.puesto_tipo}"? Esta accion no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        loading={removeMut.isPending}
      />
    </div>
  );
}
