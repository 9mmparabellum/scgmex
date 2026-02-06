import { useState, useMemo } from 'react';
import { useList, useCreate, useUpdate, useRemove } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import TreeView from '../../components/ui/TreeView';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

// ---------------------------------------------------------------------------
// Constantes CONAC
// ---------------------------------------------------------------------------

const TIPOS_CUENTA = [
  { value: 'activo', label: 'Activo' },
  { value: 'pasivo', label: 'Pasivo' },
  { value: 'hacienda', label: 'Hacienda Publica' },
  { value: 'ingresos', label: 'Ingresos' },
  { value: 'gastos', label: 'Gastos' },
  { value: 'cierre', label: 'Cierre Contable' },
  { value: 'orden_contable', label: 'Orden Contable' },
  { value: 'orden_presupuestario', label: 'Orden Presupuestario' },
];

const NATURALEZAS = [
  { value: 'deudora', label: 'Deudora' },
  { value: 'acreedora', label: 'Acreedora' },
];

const NIVEL_NOMBRES = {
  1: 'Genero',
  2: 'Grupo',
  3: 'Rubro',
  4: 'Cuenta',
  5: 'Subcuenta',
};

const TIPO_BADGE_VARIANT = {
  activo: 'primary',
  pasivo: 'danger',
  hacienda: 'info',
  ingresos: 'success',
  gastos: 'warning',
  cierre: 'default',
  orden_contable: 'default',
  orden_presupuestario: 'default',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildTree(items) {
  const map = {};
  const roots = [];
  items.forEach((item) => {
    map[item.id] = { ...item, children: [] };
  });
  items.forEach((item) => {
    if (item.padre_id && map[item.padre_id]) {
      map[item.padre_id].children.push(map[item.id]);
    } else {
      roots.push(map[item.id]);
    }
  });
  return roots;
}

function tipoLabel(value) {
  const found = TIPOS_CUENTA.find((t) => t.value === value);
  return found ? found.label : value;
}

function naturalezaLabel(value) {
  const found = NATURALEZAS.find((n) => n.value === value);
  return found ? found.label : value;
}

const EMPTY_FORM = {
  codigo: '',
  nombre: '',
  nivel: 1,
  tipo_cuenta: '',
  naturaleza: '',
  es_detalle: false,
  activo: true,
  padre_id: null,
};

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function PlanCuentas() {
  const { entePublico } = useAppStore();

  // Data fetching
  const { data: cuentas = [], isLoading, isError } = useList('plan_de_cuentas', {
    filter: { ente_id: entePublico?.id },
  });
  const createMutation = useCreate('plan_de_cuentas');
  const updateMutation = useUpdate('plan_de_cuentas');
  const removeMutation = useRemove('plan_de_cuentas');

  // UI state
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  // Build tree
  const tree = useMemo(() => buildTree(cuentas), [cuentas]);

  // Lookup the currently selected node in the flat array (fresh data)
  const selectedAccount = useMemo(() => {
    if (!selected) return null;
    return cuentas.find((c) => c.id === selected.id) || null;
  }, [cuentas, selected]);

  // Count children for the selected account
  const selectedChildrenCount = useMemo(() => {
    if (!selectedAccount) return 0;
    return cuentas.filter((c) => c.padre_id === selectedAccount.id).length;
  }, [cuentas, selectedAccount]);

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  function handleSelect(node) {
    setSelected(node);
  }

  function openCreateRoot() {
    setForm({
      ...EMPTY_FORM,
      nivel: 1,
      padre_id: null,
    });
    setIsEditing(false);
    setModalOpen(true);
  }

  function openCreateChild() {
    if (!selectedAccount) return;
    if (selectedAccount.nivel >= 5) return;

    setForm({
      ...EMPTY_FORM,
      padre_id: selectedAccount.id,
      nivel: selectedAccount.nivel + 1,
      tipo_cuenta: selectedAccount.tipo_cuenta || '',
      naturaleza: selectedAccount.naturaleza || '',
      codigo: selectedAccount.codigo ? selectedAccount.codigo + '.' : '',
    });
    setIsEditing(false);
    setModalOpen(true);
  }

  function openEdit() {
    if (!selectedAccount) return;
    setForm({
      codigo: selectedAccount.codigo || '',
      nombre: selectedAccount.nombre || '',
      nivel: selectedAccount.nivel || 1,
      tipo_cuenta: selectedAccount.tipo_cuenta || '',
      naturaleza: selectedAccount.naturaleza || '',
      es_detalle: selectedAccount.es_detalle || false,
      activo: selectedAccount.activo !== false,
      padre_id: selectedAccount.padre_id || null,
    });
    setIsEditing(true);
    setModalOpen(true);
  }

  function handleFormChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    const payload = {
      ...form,
      ente_id: entePublico?.id,
    };

    if (isEditing && selectedAccount) {
      await updateMutation.mutateAsync({ id: selectedAccount.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setModalOpen(false);
  }

  async function handleDelete() {
    if (!selectedAccount) return;
    await removeMutation.mutateAsync(selectedAccount.id);
    setConfirmOpen(false);
    setSelected(null);
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // -----------------------------------------------------------------------
  // Render helpers
  // -----------------------------------------------------------------------

  function renderTreeNode(node) {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-mono text-xs text-text-muted flex-shrink-0">
          {node.codigo}
        </span>
        <span className="truncate">{node.nombre}</span>
        {node.tipo_cuenta && (
          <Badge
            variant={TIPO_BADGE_VARIANT[node.tipo_cuenta] || 'default'}
            className="flex-shrink-0 ml-auto"
          >
            {tipoLabel(node.tipo_cuenta)}
          </Badge>
        )}
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // JSX
  // -----------------------------------------------------------------------

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">
          Plan de Cuentas CONAC
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Art. 4, 37 &mdash; Ley General de Contabilidad Gubernamental
        </p>
      </div>

      {/* Top toolbar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-text-secondary">
          {cuentas.length} cuenta{cuentas.length !== 1 ? 's' : ''} registrada
          {cuentas.length !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={openCreateRoot}>
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Nuevo Genero
          </Button>
          {selectedAccount && selectedAccount.nivel < 5 && (
            <Button size="sm" onClick={openCreateChild}>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Nueva Cuenta Hija
            </Button>
          )}
        </div>
      </div>

      {/* Loading / Error states */}
      {isLoading && (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          <svg
            className="animate-spin h-5 w-5 mr-2"
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
          Cargando plan de cuentas...
        </div>
      )}

      {isError && (
        <div className="bg-danger/5 border border-danger/30 rounded-lg p-4 text-sm text-danger">
          Error al cargar el plan de cuentas. Verifique su conexion e intente de
          nuevo.
        </div>
      )}

      {/* Main split layout */}
      {!isLoading && !isError && (
        <div className="flex gap-6">
          {/* Left panel — Tree View */}
          <div className="w-1/3 bg-white rounded-lg card-shadow p-4 max-h-[calc(100vh-240px)] overflow-y-auto">
            <h2 className="text-sm font-semibold text-text-primary mb-3">
              Estructura de Cuentas
            </h2>
            {tree.length === 0 ? (
              <div className="text-center py-12 text-text-muted text-sm">
                <svg
                  className="w-10 h-10 mx-auto mb-3 text-border"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                No hay cuentas registradas.
                <br />
                Cree un nuevo Genero para comenzar.
              </div>
            ) : (
              <TreeView
                data={tree}
                renderNode={renderTreeNode}
                onSelect={handleSelect}
                selectedId={selectedAccount?.id}
                searchable
              />
            )}
          </div>

          {/* Right panel — Detail */}
          <div className="w-2/3 bg-white rounded-lg card-shadow p-6 max-h-[calc(100vh-240px)] overflow-y-auto">
            {selectedAccount ? (
              <div>
                {/* Detail header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={
                          TIPO_BADGE_VARIANT[selectedAccount.tipo_cuenta] ||
                          'default'
                        }
                      >
                        {NIVEL_NOMBRES[selectedAccount.nivel] ||
                          `Nivel ${selectedAccount.nivel}`}
                      </Badge>
                      {selectedAccount.es_detalle && (
                        <Badge variant="success">Detalle</Badge>
                      )}
                      {selectedAccount.activo === false && (
                        <Badge variant="danger">Inactiva</Badge>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-text-primary">
                      {selectedAccount.codigo} &mdash; {selectedAccount.nombre}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={openEdit}>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Editar
                    </Button>
                    {selectedAccount.nivel < 5 && (
                      <Button size="sm" onClick={openCreateChild}>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Agregar Hija
                      </Button>
                    )}
                    {selectedChildrenCount === 0 && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setConfirmOpen(true)}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Eliminar
                      </Button>
                    )}
                  </div>
                </div>

                {/* Detail grid */}
                <div className="grid grid-cols-2 gap-4">
                  <DetailField label="Codigo" value={selectedAccount.codigo} />
                  <DetailField label="Nombre" value={selectedAccount.nombre} />
                  <DetailField
                    label="Nivel"
                    value={`${selectedAccount.nivel} — ${NIVEL_NOMBRES[selectedAccount.nivel] || ''}`}
                  />
                  <DetailField
                    label="Tipo de Cuenta"
                    value={tipoLabel(selectedAccount.tipo_cuenta)}
                  />
                  <DetailField
                    label="Naturaleza"
                    value={naturalezaLabel(selectedAccount.naturaleza)}
                  />
                  <DetailField
                    label="Cuenta de Detalle"
                    value={selectedAccount.es_detalle ? 'Si' : 'No'}
                  />
                  <DetailField
                    label="Estado"
                    value={selectedAccount.activo !== false ? 'Activa' : 'Inactiva'}
                  />
                  {selectedAccount.padre_id && (
                    <DetailField
                      label="Cuenta Padre"
                      value={(() => {
                        const parent = cuentas.find(
                          (c) => c.id === selectedAccount.padre_id
                        );
                        return parent
                          ? `${parent.codigo} — ${parent.nombre}`
                          : selectedAccount.padre_id;
                      })()}
                    />
                  )}
                </div>

                {/* Children summary */}
                {selectedChildrenCount > 0 && (
                  <div className="mt-6 pt-4 border-t border-border">
                    <p className="text-sm text-text-muted">
                      Esta cuenta tiene{' '}
                      <span className="font-medium text-text-primary">
                        {selectedChildrenCount}
                      </span>{' '}
                      subcuenta{selectedChildrenCount !== 1 ? 's' : ''} directa
                      {selectedChildrenCount !== 1 ? 's' : ''}.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-text-muted">
                <svg
                  className="w-12 h-12 mb-3 text-border"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p className="text-sm">
                  Seleccione una cuenta del arbol para ver sus detalles.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal — Crear / Editar cuenta */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditing ? 'Editar Cuenta' : 'Nueva Cuenta'}
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-4"
        >
          {/* Nivel indicator */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 text-sm text-primary">
            Nivel {form.nivel} &mdash;{' '}
            <span className="font-medium">
              {NIVEL_NOMBRES[form.nivel] || `Nivel ${form.nivel}`}
            </span>
            {form.padre_id && (
              <span className="text-text-muted ml-2">
                (Hija de{' '}
                {(() => {
                  const parent = cuentas.find((c) => c.id === form.padre_id);
                  return parent
                    ? `${parent.codigo} — ${parent.nombre}`
                    : form.padre_id;
                })()}
                )
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Codigo *"
              value={form.codigo}
              onChange={(e) => handleFormChange('codigo', e.target.value)}
              placeholder="Ej. 1.1.3"
              required
            />
            <Input
              label="Nombre *"
              value={form.nombre}
              onChange={(e) => handleFormChange('nombre', e.target.value)}
              placeholder="Nombre de la cuenta"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nivel"
              value={`${form.nivel} — ${NIVEL_NOMBRES[form.nivel] || ''}`}
              disabled
            />
            <Select
              label="Tipo de Cuenta *"
              options={TIPOS_CUENTA}
              value={form.tipo_cuenta}
              onChange={(e) => handleFormChange('tipo_cuenta', e.target.value)}
              placeholder="Seleccione tipo"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Naturaleza *"
              options={NATURALEZAS}
              value={form.naturaleza}
              onChange={(e) => handleFormChange('naturaleza', e.target.value)}
              placeholder="Seleccione naturaleza"
              required
            />
            <div />
          </div>

          {/* Checkboxes */}
          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={form.es_detalle}
                onChange={(e) => handleFormChange('es_detalle', e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30 cursor-pointer"
              />
              Cuenta de detalle (permite movimientos)
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(e) => handleFormChange('activo', e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30 cursor-pointer"
              />
              Activa
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="ghost"
              onClick={() => setModalOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={isSaving}>
              {isEditing ? 'Guardar Cambios' : 'Crear Cuenta'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Cuenta"
        message={
          selectedAccount
            ? `Esta a punto de eliminar la cuenta "${selectedAccount.codigo} — ${selectedAccount.nombre}". Esta accion no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={removeMutation.isPending}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DetailField({ label, value }) {
  return (
    <div className="py-2">
      <dt className="text-xs font-medium text-text-muted mb-0.5">{label}</dt>
      <dd className="text-sm text-text-primary">{value || '—'}</dd>
    </div>
  );
}
