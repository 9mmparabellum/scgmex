import { useState, useMemo, useCallback } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useReglas } from '../../hooks/useAnomalias';
import { useCreate, useUpdate, useRemove } from '../../hooks/useCrud';
import { canEdit } from '../../utils/rbac';
import { TIPOS_ANOMALIA, NIVELES_RIESGO } from '../../config/constants';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { exportToExcel } from '../../utils/exportHelpers';

/* -------------------------------------------------------------------------- */
/*  Default rules — shown when no rules exist in the database                 */
/* -------------------------------------------------------------------------- */
const REGLAS_DEFAULT = [
  {
    nombre: 'Monto mayor a 3 desviaciones estandar',
    descripcion: 'Detecta movimientos cuyo monto supera 3 desviaciones estandar respecto a la media del periodo.',
    tipo: 'monto_inusual',
    nivel_riesgo: 'alto',
    umbral: 3,
    activa: true,
    parametros: { campo: 'monto', metodo: 'desviacion_estandar' },
  },
  {
    nombre: 'Poliza duplicada en 7 dias',
    descripcion: 'Identifica movimientos con la misma cuenta y monto registrados dentro de un periodo de 7 dias.',
    tipo: 'patron_duplicado',
    nivel_riesgo: 'medio',
    umbral: 7,
    activa: true,
    parametros: { dias: 7, comparar: 'cuenta_monto' },
  },
  {
    nombre: 'Transaccion fin de semana',
    descripcion: 'Marca polizas registradas en sabado, domingo o fuera de horario laboral.',
    tipo: 'horario_sospechoso',
    nivel_riesgo: 'medio',
    umbral: 0,
    activa: true,
    parametros: { dias_habiles: 'lun-vie', horario: '07:00-20:00' },
  },
  {
    nombre: 'Monto redondo > $100,000',
    descripcion: 'Detecta montos que son multiplos exactos de $10,000 y superan $100,000.',
    tipo: 'monto_inusual',
    nivel_riesgo: 'bajo',
    umbral: 100000,
    activa: true,
    parametros: { multiplo: 10000, minimo: 100000 },
  },
  {
    nombre: 'Desviacion presupuestal > 20%',
    descripcion: 'Alerta cuando el monto ejercido supera en mas de 20% al monto aprobado.',
    tipo: 'desviacion_presupuestal',
    nivel_riesgo: 'alto',
    umbral: 20,
    activa: true,
    parametros: { porcentaje: 20, comparar: 'ejercido_vs_aprobado' },
  },
  {
    nombre: 'Concentracion proveedor > 40%',
    descripcion: 'Detecta cuando un solo proveedor concentra mas del 40% del total de compras.',
    tipo: 'proveedor_concentrado',
    nivel_riesgo: 'critico',
    umbral: 40,
    activa: true,
    parametros: { porcentaje: 40, metodo: 'concentracion' },
  },
];

/* -------------------------------------------------------------------------- */
/*  Empty form state                                                          */
/* -------------------------------------------------------------------------- */
const EMPTY_FORM = {
  nombre: '',
  descripcion: '',
  tipo: '',
  nivel_riesgo: '',
  umbral: '',
  activa: true,
  parametros: [],
};

/* -------------------------------------------------------------------------- */
/*  LoadingSpinner                                                            */
/* -------------------------------------------------------------------------- */
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <svg className="animate-spin h-8 w-8 text-guinda" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  ReglasAnomalia — CRUD for detection rules                                 */
/* -------------------------------------------------------------------------- */
export default function ReglasAnomalia() {
  const { entePublico, rol } = useAppStore();
  const enteId = entePublico?.id;
  const editable = canEdit(rol, 'anomalias');

  /* ---- Data hooks -------------------------------------------------------- */
  const { data: reglasRaw = [], isLoading } = useReglas(enteId);
  const createRegla = useCreate('regla_anomalia');
  const updateRegla = useUpdate('regla_anomalia');
  const removeRegla = useRemove('regla_anomalia');

  // If no rules exist, show pre-loaded defaults (display only, not persisted until created)
  const reglas = reglasRaw.length > 0 ? reglasRaw : REGLAS_DEFAULT;
  const usingDefaults = reglasRaw.length === 0;

  /* ---- Modal state ------------------------------------------------------- */
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = new, object = editing
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  /* ---- Delete dialog state ----------------------------------------------- */
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ---- Select options ---------------------------------------------------- */
  const tipoOptions = useMemo(
    () => Object.entries(TIPOS_ANOMALIA).map(([value, label]) => ({ value, label })),
    [],
  );
  const riesgoOptions = useMemo(
    () => Object.entries(NIVELES_RIESGO).map(([value, { label }]) => ({ value, label })),
    [],
  );

  /* ---- Form helpers ------------------------------------------------------ */
  const setField = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const paramToArray = (obj) => {
    if (!obj || typeof obj !== 'object') return [];
    return Object.entries(obj).map(([k, v]) => ({ key: k, value: String(v) }));
  };

  const arrayToParam = (arr) => {
    const result = {};
    (arr || []).forEach(({ key, value }) => {
      if (key.trim()) result[key.trim()] = value;
    });
    return result;
  };

  /* ---- Handlers: modal --------------------------------------------------- */
  const openNew = useCallback(() => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, parametros: [] });
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((regla) => {
    setEditing(regla);
    setForm({
      nombre: regla.nombre || '',
      descripcion: regla.descripcion || '',
      tipo: regla.tipo || '',
      nivel_riesgo: regla.nivel_riesgo || '',
      umbral: regla.umbral ?? '',
      activa: regla.activa !== false,
      parametros: paramToArray(regla.parametros),
    });
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.nombre.trim() || !form.tipo || !form.nivel_riesgo) return;
    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        tipo: form.tipo,
        nivel_riesgo: form.nivel_riesgo,
        umbral: Number(form.umbral) || 0,
        activa: form.activa,
        parametros: arrayToParam(form.parametros),
        ente_id: enteId,
      };

      if (editing?.id) {
        await updateRegla.mutateAsync({ id: editing.id, ...payload });
      } else {
        await createRegla.mutateAsync(payload);
      }
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  }, [form, editing, enteId, createRegla, updateRegla]);

  /* ---- Handlers: toggle active ------------------------------------------- */
  const handleToggleActiva = useCallback(async (regla) => {
    if (!regla.id) return; // default rules can't be toggled
    await updateRegla.mutateAsync({
      id: regla.id,
      activa: !regla.activa,
    });
  }, [updateRegla]);

  /* ---- Handlers: delete -------------------------------------------------- */
  const handleDelete = useCallback(async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      await removeRegla.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, removeRegla]);

  /* ---- Handlers: create defaults ----------------------------------------- */
  const handleCreateDefaults = useCallback(async () => {
    setSaving(true);
    try {
      for (const regla of REGLAS_DEFAULT) {
        await createRegla.mutateAsync({ ...regla, ente_id: enteId });
      }
    } finally {
      setSaving(false);
    }
  }, [createRegla, enteId]);

  /* ---- Parametros key-value management ----------------------------------- */
  const addParam = () => {
    setForm((p) => ({
      ...p,
      parametros: [...(p.parametros || []), { key: '', value: '' }],
    }));
  };

  const updateParam = (idx, field, value) => {
    setForm((p) => ({
      ...p,
      parametros: p.parametros.map((param, i) =>
        i === idx ? { ...param, [field]: value } : param
      ),
    }));
  };

  const removeParam = (idx) => {
    setForm((p) => ({
      ...p,
      parametros: p.parametros.filter((_, i) => i !== idx),
    }));
  };

  /* ---- Table columns ----------------------------------------------------- */
  const columns = useMemo(
    () => [
      {
        key: 'nombre',
        label: 'Nombre',
        render: (val) => <span className="font-medium text-text-heading">{val || '\u2014'}</span>,
      },
      {
        key: 'tipo',
        label: 'Tipo',
        width: '160px',
        render: (val) => (
          <Badge variant="primary">
            {TIPOS_ANOMALIA[val] || val || '\u2014'}
          </Badge>
        ),
      },
      {
        key: 'nivel_riesgo',
        label: 'Riesgo',
        width: '110px',
        render: (val) => {
          const cfg = NIVELES_RIESGO[val];
          return <Badge variant={cfg?.variant || 'default'}>{cfg?.label || val || '\u2014'}</Badge>;
        },
      },
      {
        key: 'umbral',
        label: 'Umbral',
        width: '100px',
        render: (val) => <span className="font-mono text-sm">{val ?? '\u2014'}</span>,
      },
      {
        key: 'activa',
        label: 'Activa',
        width: '90px',
        sortable: false,
        render: (val, row) => (
          <button
            type="button"
            className={[
              'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
              val !== false ? 'bg-guinda' : 'bg-gray-200',
              row.id && editable ? 'cursor-pointer' : 'cursor-default opacity-60',
            ].join(' ')}
            onClick={(e) => {
              e.stopPropagation();
              if (row.id && editable) handleToggleActiva(row);
            }}
            disabled={!row.id || !editable}
          >
            <span
              className={[
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                val !== false ? 'translate-x-5' : 'translate-x-0',
              ].join(' ')}
            />
          </button>
        ),
      },
      {
        key: 'id',
        label: 'Acciones',
        width: '120px',
        sortable: false,
        render: (_, row) => (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                openEdit(row);
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </Button>
            {row.id && editable && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(row);
                }}
              >
                <svg className="w-4 h-4 text-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </Button>
            )}
          </div>
        ),
      },
    ],
    [editable, handleToggleActiva, openEdit],
  );

  /* ---- Export ------------------------------------------------------------- */
  const exportCols = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'tipo', label: 'Tipo', getValue: (r) => TIPOS_ANOMALIA[r.tipo] || r.tipo },
    { key: 'nivel_riesgo', label: 'Nivel Riesgo', getValue: (r) => NIVELES_RIESGO[r.nivel_riesgo]?.label || r.nivel_riesgo },
    { key: 'umbral', label: 'Umbral' },
    { key: 'activa', label: 'Activa', getValue: (r) => r.activa !== false ? 'Si' : 'No' },
    { key: 'descripcion', label: 'Descripcion' },
  ];

  const handleExportExcel = () => {
    exportToExcel(reglas, exportCols, 'reglas_anomalia');
  };

  /* ---- Render ------------------------------------------------------------ */
  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            Reglas de Deteccion
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Configuracion de reglas para el motor de deteccion de anomalias
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline-secondary" size="sm" onClick={handleExportExcel}>
            <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Excel
          </Button>
          {editable && (
            <Button onClick={openNew}>
              <svg className="w-4 h-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Nueva Regla
            </Button>
          )}
        </div>
      </div>

      {/* Default rules notice */}
      {usingDefaults && (
        <div className="bg-[#03c3ec]/10 border border-[#03c3ec]/30 rounded-lg p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-[#03a9ce] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <p className="text-sm text-text-heading">
              Se muestran las reglas predeterminadas. Para personalizarlas, haga clic en
              <strong> &ldquo;Crear Reglas Predeterminadas&rdquo;</strong> para guardarlas en la base de datos.
            </p>
          </div>
          {editable && (
            <Button size="sm" variant="outline-primary" onClick={handleCreateDefaults} loading={saving}>
              Crear Reglas Predeterminadas
            </Button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg card-shadow p-5">
        <DataTable
          columns={columns}
          data={reglas}
        />
      </div>

      {/* CRUD Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Regla' : 'Nueva Regla'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Nombre"
            value={form.nombre}
            onChange={(e) => setField('nombre', e.target.value)}
            placeholder="Nombre de la regla"
          />

          <div>
            <label className="block text-sm font-medium text-text-heading mb-1.5">
              Descripcion
            </label>
            <textarea
              className="block w-full rounded-md border border-border bg-white text-text-heading text-[0.9375rem] px-3.5 py-2.5 placeholder:text-text-muted transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda min-h-[80px]"
              rows={3}
              value={form.descripcion}
              onChange={(e) => setField('descripcion', e.target.value)}
              placeholder="Descripcion de la regla de deteccion..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Tipo de Anomalia"
              options={tipoOptions}
              value={form.tipo}
              onChange={(e) => setField('tipo', e.target.value)}
              placeholder="Seleccionar tipo"
            />
            <Select
              label="Nivel de Riesgo"
              options={riesgoOptions}
              value={form.nivel_riesgo}
              onChange={(e) => setField('nivel_riesgo', e.target.value)}
              placeholder="Seleccionar nivel"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <Input
              label="Umbral"
              type="number"
              value={form.umbral}
              onChange={(e) => setField('umbral', e.target.value)}
              placeholder="Valor numerico del umbral"
            />
            <div className="flex items-center gap-3 h-[40px]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.activa}
                  onChange={(e) => setField('activa', e.target.checked)}
                  className="h-4 w-4 rounded border-border text-guinda focus:ring-guinda/25 cursor-pointer"
                />
                <span className="text-[0.9375rem] text-text-heading font-medium">Regla activa</span>
              </label>
            </div>
          </div>

          {/* Parametros key-value pairs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-text-heading">
                Parametros
              </label>
              <Button size="sm" variant="ghost" onClick={addParam}>
                <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Agregar
              </Button>
            </div>
            {(form.parametros || []).length === 0 ? (
              <p className="text-sm text-text-muted bg-[#f9fafb] rounded-md p-3 text-center">
                Sin parametros configurados
              </p>
            ) : (
              <div className="space-y-2">
                {form.parametros.map((param, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      className="flex-1 h-[36px] rounded-md border border-border bg-white text-text-heading text-[0.875rem] px-3 focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda"
                      placeholder="Clave"
                      value={param.key}
                      onChange={(e) => updateParam(idx, 'key', e.target.value)}
                    />
                    <input
                      type="text"
                      className="flex-1 h-[36px] rounded-md border border-border bg-white text-text-heading text-[0.875rem] px-3 focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda"
                      placeholder="Valor"
                      value={param.value}
                      onChange={(e) => updateParam(idx, 'value', e.target.value)}
                    />
                    <button
                      type="button"
                      className="p-1.5 rounded-md text-text-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                      onClick={() => removeParam(idx)}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              loading={saving}
              disabled={!form.nombre.trim() || !form.tipo || !form.nivel_riesgo}
            >
              {editing ? 'Actualizar Regla' : 'Crear Regla'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ConfirmDialog for deletion */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar Regla"
        message={`¿Esta seguro de eliminar la regla "${deleteTarget?.nombre}"? Esta accion no se puede deshacer.`}
        confirmText="Eliminar"
        loading={deleting}
      />
    </div>
  );
}
