import { useState, useMemo } from 'react';
import { useCreate, useUpdate, useRemove } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { useBienes, useResumenPatrimonio } from '../../hooks/usePatrimonio';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { exportToExcel } from '../../utils/exportHelpers';
import { TIPOS_BIEN, ESTADOS_BIEN } from '../../config/constants';

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

const emptyForm = {
  clave: '',
  descripcion: '',
  tipo: 'mueble',
  fecha_adquisicion: '',
  valor_adquisicion: '',
  depreciacion_acumulada: '0',
  vida_util_anios: '',
  tasa_depreciacion: '',
  ubicacion: '',
  responsable: '',
  numero_serie: '',
  marca: '',
  modelo: '',
  estado: 'activo',
};

const tipoBadgeVariant = {
  mueble: 'info',
  inmueble: 'success',
  intangible: 'warning',
};

export default function Bienes() {
  const { entePublico, ejercicioFiscal } = useAppStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  // --- Data hooks ---
  const { data: bienes = [], isLoading } = useBienes();
  const { data: resumen = {} } = useResumenPatrimonio();

  const createMut = useCreate('bien_patrimonial');
  const updateMut = useUpdate('bien_patrimonial');
  const removeMut = useRemove('bien_patrimonial');

  // --- Filtered data ---
  const filteredData = useMemo(() => {
    let result = bienes;
    if (filterTipo) {
      result = result.filter((b) => b.tipo === filterTipo);
    }
    if (filterEstado) {
      result = result.filter((b) => b.estado === filterEstado);
    }
    return result;
  }, [bienes, filterTipo, filterEstado]);

  // --- Select options ---
  const tipoOptions = useMemo(
    () => Object.entries(TIPOS_BIEN).map(([value, label]) => ({ value, label })),
    []
  );

  const estadoOptions = useMemo(
    () => Object.entries(ESTADOS_BIEN).map(([value, obj]) => ({ value, label: obj.label })),
    []
  );

  // --- Form helper ---
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
      clave: row.clave ?? '',
      descripcion: row.descripcion ?? '',
      tipo: row.tipo ?? 'mueble',
      fecha_adquisicion: row.fecha_adquisicion ?? '',
      valor_adquisicion: row.valor_adquisicion ?? '',
      depreciacion_acumulada: row.depreciacion_acumulada ?? '0',
      vida_util_anios: row.vida_util_anios ?? '',
      tasa_depreciacion: row.tasa_depreciacion ?? '',
      ubicacion: row.ubicacion ?? '',
      responsable: row.responsable ?? '',
      numero_serie: row.numero_serie ?? '',
      marca: row.marca ?? '',
      modelo: row.modelo ?? '',
      estado: row.estado ?? 'activo',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      ente_id: entePublico?.id,
      ejercicio_id: ejercicioFiscal?.id,
      valor_adquisicion: Number(form.valor_adquisicion) || 0,
      depreciacion_acumulada: Number(form.depreciacion_acumulada) || 0,
      vida_util_anios: form.vida_util_anios ? Number(form.vida_util_anios) : null,
      tasa_depreciacion: form.tasa_depreciacion ? Number(form.tasa_depreciacion) : null,
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

  // --- Export ---
  const handleExport = () => {
    const excelCols = [
      { key: 'clave', label: 'Clave' },
      { key: 'descripcion', label: 'Descripcion' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'fecha_adquisicion', label: 'Fecha Adquisicion' },
      { key: 'valor_adquisicion', label: 'Valor Adquisicion' },
      { key: 'depreciacion_acumulada', label: 'Depreciacion Acumulada' },
      {
        key: 'valor_neto',
        label: 'Valor Neto',
        getValue: (row) => (Number(row.valor_adquisicion) || 0) - (Number(row.depreciacion_acumulada) || 0),
      },
      { key: 'estado', label: 'Estado' },
      { key: 'ubicacion', label: 'Ubicacion' },
      { key: 'responsable', label: 'Responsable' },
    ];
    exportToExcel(filteredData, excelCols, 'bienes_patrimoniales');
  };

  // --- Table columns ---
  const columns = [
    { key: 'clave', label: 'Clave', width: '100px' },
    { key: 'descripcion', label: 'Descripcion' },
    {
      key: 'tipo',
      label: 'Tipo',
      width: '100px',
      render: (val) => (
        <Badge variant={tipoBadgeVariant[val] || 'default'}>
          {val ? val.charAt(0).toUpperCase() + val.slice(1) : '\u2014'}
        </Badge>
      ),
    },
    {
      key: 'fecha_adquisicion',
      label: 'Fecha Adq.',
      width: '110px',
      render: (val) => {
        if (!val) return '\u2014';
        const d = new Date(val + 'T00:00:00');
        return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
      },
    },
    {
      key: 'valor_adquisicion',
      label: 'Valor Adq.',
      width: '130px',
      render: (val) => (
        <span className="block text-right tabular-nums">{fmtMoney(val)}</span>
      ),
    },
    {
      key: 'depreciacion_acumulada',
      label: 'Deprec. Acum.',
      width: '130px',
      render: (val) => (
        <span className="block text-right tabular-nums">{fmtMoney(val)}</span>
      ),
    },
    {
      key: 'valor_neto',
      label: 'Valor Neto',
      width: '130px',
      render: (_val, row) => {
        const neto = (Number(row.valor_adquisicion) || 0) - (Number(row.depreciacion_acumulada) || 0);
        return <span className="block text-right tabular-nums">{fmtMoney(neto)}</span>;
      },
    },
    {
      key: 'estado',
      label: 'Estado',
      width: '100px',
      render: (val) => {
        const variantMap = { activo: 'success', baja: 'danger', transferido: 'warning', en_comodato: 'info' };
        return (
          <Badge variant={variantMap[val] || 'default'}>
            {val ? val.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()) : '\u2014'}
          </Badge>
        );
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

  // --- Summary cards data ---
  const summaryCards = [
    { label: 'Total Muebles', value: resumen.total_muebles ?? 0 },
    { label: 'Total Inmuebles', value: resumen.total_inmuebles ?? 0 },
    { label: 'Total Intangibles', value: resumen.total_intangibles ?? 0 },
    { label: 'Valor Neto Total', value: fmtMoney(resumen.valor_neto_total), isCurrency: true },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Bienes Patrimoniales</h1>
        <p className="text-sm text-text-muted mt-1">
          Art. 23 LGCG &mdash; Control de bienes muebles, inmuebles e intangibles
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg card-shadow p-4">
            <p className="text-sm text-text-muted mb-1">{card.label}</p>
            <p className="text-xl font-bold text-text-primary">
              {card.isCurrency ? card.value : Number(card.value).toLocaleString('es-MX')}
            </p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-lg card-shadow p-5 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Tipo de Bien"
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            options={tipoOptions}
            placeholder="— Todos los tipos —"
          />
          <Select
            label="Estado"
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            options={estadoOptions}
            placeholder="— Todos los estados —"
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-secondary">
          Bienes
          <span className="ml-2 text-text-muted font-normal">
            ({filteredData.length} registros)
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <Button onClick={handleExport} variant="secondary" size="sm">
            Exportar Excel
          </Button>
          <Button onClick={openCreate} size="sm">
            + Nuevo Bien
          </Button>
        </div>
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando bienes patrimoniales...
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
        title={editing ? 'Editar Bien Patrimonial' : 'Nuevo Bien Patrimonial'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Row 1: Clave + Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Clave"
              value={form.clave}
              onChange={(e) => set('clave', e.target.value)}
              placeholder="Ej. BM-001"
              required
            />
            <Select
              label="Tipo de Bien"
              value={form.tipo}
              onChange={(e) => set('tipo', e.target.value)}
              options={tipoOptions}
              placeholder="— Seleccione tipo —"
            />
          </div>

          {/* Row 2: Descripcion */}
          <div className="w-full">
            <label className="block text-sm font-medium text-text-heading mb-1.5">
              Descripcion <span className="text-danger">*</span>
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) => set('descripcion', e.target.value)}
              placeholder="Descripcion del bien patrimonial"
              rows={3}
              className="w-full h-[40px] min-h-[80px] rounded-md border border-border px-3 py-2 text-[0.9375rem] focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda"
            />
          </div>

          {/* Row 3: Fecha, Valor, Depreciacion */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Fecha Adquisicion"
              type="date"
              value={form.fecha_adquisicion}
              onChange={(e) => set('fecha_adquisicion', e.target.value)}
            />
            <Input
              label="Valor Adquisicion"
              type="number"
              value={form.valor_adquisicion}
              onChange={(e) => set('valor_adquisicion', e.target.value)}
              placeholder="0.00"
            />
            <Input
              label="Depreciacion Acumulada"
              type="number"
              value={form.depreciacion_acumulada}
              onChange={(e) => set('depreciacion_acumulada', e.target.value)}
              placeholder="0.00"
            />
          </div>

          {/* Row 4: Vida Util + Tasa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Vida Util (anios)"
              type="number"
              value={form.vida_util_anios}
              onChange={(e) => set('vida_util_anios', e.target.value)}
              placeholder="Ej. 10"
            />
            <Input
              label="Tasa Depreciacion (%)"
              type="number"
              value={form.tasa_depreciacion}
              onChange={(e) => set('tasa_depreciacion', e.target.value)}
              placeholder="Ej. 10"
            />
          </div>

          {/* Row 5: Ubicacion + Responsable */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Ubicacion"
              value={form.ubicacion}
              onChange={(e) => set('ubicacion', e.target.value)}
              placeholder="Ubicacion fisica del bien"
            />
            <Input
              label="Responsable"
              value={form.responsable}
              onChange={(e) => set('responsable', e.target.value)}
              placeholder="Nombre del responsable"
            />
          </div>

          {/* Row 6: Serie, Marca, Modelo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Numero de Serie"
              value={form.numero_serie}
              onChange={(e) => set('numero_serie', e.target.value)}
              placeholder="N/S"
            />
            <Input
              label="Marca"
              value={form.marca}
              onChange={(e) => set('marca', e.target.value)}
              placeholder="Marca"
            />
            <Input
              label="Modelo"
              value={form.modelo}
              onChange={(e) => set('modelo', e.target.value)}
              placeholder="Modelo"
            />
          </div>

          {/* Row 7: Estado */}
          <Select
            label="Estado"
            value={form.estado}
            onChange={(e) => set('estado', e.target.value)}
            options={estadoOptions}
            placeholder="— Seleccione estado —"
          />

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              loading={isSaving}
              disabled={!form.clave.trim() || !form.descripcion.trim()}
            >
              {editing ? 'Guardar cambios' : 'Crear bien'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setToDelete(null); }}
        onConfirm={confirmDelete}
        title="Eliminar bien patrimonial"
        message={
          toDelete
            ? `¿Esta seguro de eliminar el bien "${toDelete.clave} — ${toDelete.descripcion}"? Esta accion no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        loading={removeMut.isPending}
      />
    </div>
  );
}
