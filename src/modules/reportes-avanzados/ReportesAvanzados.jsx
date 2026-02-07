import { useState, useMemo } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useToastStore } from '../../stores/toastStore';
import { useReportesPersonalizados, useResumenReportes } from '../../hooks/useReportesAvanzados';
import { useCreate, useUpdate, useRemove } from '../../hooks/useCrud';
import { canEdit } from '../../utils/rbac';
import { exportToExcel } from '../../utils/exportHelpers';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

/* ── Constants ─────────────────────────────────────────────────────── */

const TIPOS_REPORTE_AVANZADO = {
  financiero: 'Financiero',
  presupuestal: 'Presupuestal',
  patrimonial: 'Patrimonial',
  fiscal: 'Fiscal',
  personalizado: 'Personalizado',
};

const ESTADOS_REPORTE = {
  borrador: { label: 'Borrador', variant: 'default' },
  generado: { label: 'Generado', variant: 'info' },
  aprobado: { label: 'Aprobado', variant: 'success' },
  exportado: { label: 'Exportado', variant: 'primary' },
};

const FORMATOS = [
  { value: 'PDF', label: 'PDF' },
  { value: 'Excel', label: 'Excel' },
  { value: 'CSV', label: 'CSV' },
];

const TIPOS_OPTIONS = Object.entries(TIPOS_REPORTE_AVANZADO).map(([value, label]) => ({
  value,
  label,
}));

const ESTADOS_OPTIONS = Object.entries(ESTADOS_REPORTE).map(([value, { label }]) => ({
  value,
  label,
}));

const EMPTY_FORM = {
  nombre: '',
  tipo: '',
  descripcion: '',
  formato: '',
  parametros: '',
  fecha_generacion: '',
  estado: 'borrador',
  notas: '',
};

/* ── Predefined LGCG report templates ─────────────────────────────── */

const REPORTES_PREDEFINIDOS = [
  {
    id: 'esf',
    titulo: 'Estado de Situacion Financiera',
    descripcion: 'Muestra la posicion financiera del ente publico a una fecha determinada: activos, pasivos y hacienda publica.',
    tipo: 'financiero',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 7h6m-6 4h6m-6 4h4M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
      </svg>
    ),
  },
  {
    id: 'ea',
    titulo: 'Estado de Actividades',
    descripcion: 'Presenta los ingresos y gastos del periodo, asi como el resultado del ejercicio (ahorro/desahorro).',
    tipo: 'financiero',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 8v8m-4-5v5m-4-2v2m-2 4h16a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'evhp',
    titulo: 'Estado de Variacion en Hacienda Publica',
    descripcion: 'Refleja las variaciones de la hacienda publica contribuida y generada durante el periodo.',
    tipo: 'patrimonial',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
      </svg>
    ),
  },
  {
    id: 'eaa',
    titulo: 'Estado Analitico del Activo',
    descripcion: 'Detalla los movimientos de las cuentas de activo: saldo inicial, cargos, abonos y saldo final.',
    tipo: 'financiero',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: 'efe',
    titulo: 'Estado de Flujos de Efectivo',
    descripcion: 'Muestra las entradas y salidas de efectivo clasificadas en actividades de operacion, inversion y financiamiento.',
    tipo: 'financiero',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'cipc',
    titulo: 'Conciliacion entre Ingresos Presupuestarios y Contables',
    descripcion: 'Concilia las diferencias entre los ingresos registrados en el presupuesto y los registrados contablemente.',
    tipo: 'presupuestal',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: 'cepc',
    titulo: 'Conciliacion entre Egresos Presupuestarios y Contables',
    descripcion: 'Concilia las diferencias entre los egresos registrados en el presupuesto y los registrados contablemente.',
    tipo: 'presupuestal',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    id: 'eai',
    titulo: 'Estado Analitico de Ingresos',
    descripcion: 'Presenta el detalle de los ingresos presupuestarios: estimado, recaudado y diferencia por rubro.',
    tipo: 'presupuestal',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
  },
  {
    id: 'eaepe',
    titulo: 'Estado Analitico del Ejercicio del Presupuesto de Egresos',
    descripcion: 'Muestra el ejercicio del gasto por partida: aprobado, modificado, comprometido, devengado, ejercido y pagado.',
    tipo: 'presupuestal',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    ),
  },
];

/* ── Summary card component ───────────────────────────────────────── */

function SummaryCard({ label, value, icon, color }) {
  return (
    <div className="bg-white rounded-lg card-shadow p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-text-muted mb-1">{label}</p>
          <h3 className="text-2xl font-bold text-text-heading">{value}</h3>
        </div>
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Main Component                                                     */
/* ================================================================== */

export default function ReportesAvanzados() {
  const { entePublico, ejercicioFiscal, user, rol } = useAppStore();
  const addToast = useToastStore((s) => s.addToast);
  const editable = canEdit(rol, 'reportes');

  /* ---- Data hooks ---- */
  const { data: reportes = [], isLoading } = useReportesPersonalizados();
  const { data: resumen } = useResumenReportes();

  /* ---- CRUD mutations ---- */
  const createMut = useCreate('reporte_personalizado');
  const updateMut = useUpdate('reporte_personalizado');
  const removeMut = useRemove('reporte_personalizado');

  /* ---- UI state ---- */
  const [activeTab, setActiveTab] = useState('mis_reportes');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  /* ---- Resumen values ---- */
  const total = resumen?.total ?? 0;
  const generados = resumen?.generados ?? 0;
  const aprobados = resumen?.aprobados ?? 0;
  const exportados = resumen?.exportados ?? 0;

  /* ---- Modal open/close helpers ---- */
  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      nombre: row.nombre || '',
      tipo: row.tipo || '',
      descripcion: row.descripcion || '',
      formato: row.formato || '',
      parametros: row.parametros || '',
      fecha_generacion: row.fecha_generacion || '',
      estado: row.estado || 'borrador',
      notas: row.notas || '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  /* ---- Save handler ---- */
  const handleSave = () => {
    if (!form.nombre.trim() || !form.tipo) {
      addToast({ type: 'warning', title: 'Campos requeridos', message: 'Nombre y tipo son obligatorios' });
      return;
    }
    const payload = {
      ...form,
      ente_id: entePublico?.id,
      ejercicio_id: ejercicioFiscal?.id,
      creado_por: user?.id,
    };
    if (editing) {
      updateMut.mutate({ id: editing.id, ...payload }, { onSuccess: closeModal });
    } else {
      createMut.mutate(payload, { onSuccess: closeModal });
    }
  };

  /* ---- Delete handler ---- */
  const askDelete = (row) => {
    setDeleteTarget(row);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    removeMut.mutate(deleteTarget.id, {
      onSuccess: () => {
        setConfirmOpen(false);
        setDeleteTarget(null);
      },
    });
  };

  /* ---- Generate predefined report ---- */
  const handleGeneratePredefined = (template) => {
    const payload = {
      nombre: template.titulo,
      tipo: template.tipo,
      descripcion: template.descripcion,
      formato: 'PDF',
      parametros: '',
      fecha_generacion: new Date().toISOString().split('T')[0],
      estado: 'generado',
      notas: 'Generado desde plantilla predefinida',
      ente_id: entePublico?.id,
      ejercicio_id: ejercicioFiscal?.id,
      creado_por: user?.id,
    };
    createMut.mutate(payload, {
      onSuccess: () => {
        addToast({ type: 'success', title: 'Reporte generado', message: `"${template.titulo}" generado exitosamente` });
        setActiveTab('mis_reportes');
      },
    });
  };

  /* ---- Mark as generated ---- */
  const handleGenerar = (row) => {
    updateMut.mutate({
      id: row.id,
      estado: 'generado',
      fecha_generacion: new Date().toISOString().split('T')[0],
    });
  };

  /* ---- Mark as exported ---- */
  const handleExportar = (row) => {
    updateMut.mutate({ id: row.id, estado: 'exportado' }, {
      onSuccess: () => {
        addToast({ type: 'success', title: 'Reporte exportado', message: `"${row.nombre}" marcado como exportado` });
      },
    });
  };

  /* ---- Export table to Excel ---- */
  const handleExportTable = () => {
    const cols = [
      { key: 'nombre', label: 'Nombre' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'descripcion', label: 'Descripcion' },
      { key: 'formato', label: 'Formato' },
      { key: 'fecha_generacion', label: 'Fecha Generacion' },
      { key: 'estado', label: 'Estado' },
    ];
    exportToExcel(reportes, cols, 'reportes_personalizados');
  };

  /* ---- DataTable columns ---- */
  const columns = useMemo(() => [
    { key: 'nombre', label: 'Nombre', width: '18%' },
    {
      key: 'tipo',
      label: 'Tipo',
      width: '12%',
      render: (val) => TIPOS_REPORTE_AVANZADO[val] || val || '\u2014',
    },
    {
      key: 'descripcion',
      label: 'Descripcion',
      width: '20%',
      render: (val) => {
        if (!val) return '\u2014';
        return val.length > 60 ? val.slice(0, 60) + '...' : val;
      },
    },
    { key: 'formato', label: 'Formato', width: '8%' },
    { key: 'fecha_generacion', label: 'Fecha Generacion', width: '12%' },
    {
      key: 'estado',
      label: 'Estado',
      width: '10%',
      render: (val) => {
        const est = ESTADOS_REPORTE[val];
        if (!est) return val || '\u2014';
        return <Badge variant={est.variant}>{est.label}</Badge>;
      },
    },
    {
      key: 'acciones',
      label: 'Acciones',
      sortable: false,
      width: '20%',
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          {row.estado === 'borrador' && editable && (
            <button
              onClick={(e) => { e.stopPropagation(); handleGenerar(row); }}
              className="inline-flex items-center h-[30px] px-2.5 rounded-md text-xs font-medium bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors cursor-pointer"
              title="Generar"
            >
              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Generar
            </button>
          )}
          {(row.estado === 'generado' || row.estado === 'aprobado') && editable && (
            <button
              onClick={(e) => { e.stopPropagation(); handleExportar(row); }}
              className="inline-flex items-center h-[30px] px-2.5 rounded-md text-xs font-medium bg-guinda/10 text-guinda hover:bg-guinda/20 transition-colors cursor-pointer"
              title="Exportar"
            >
              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar
            </button>
          )}
          {editable && (
            <button
              onClick={(e) => { e.stopPropagation(); openEdit(row); }}
              className="inline-flex items-center h-[30px] px-2.5 rounded-md text-xs font-medium bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors cursor-pointer"
              title="Editar"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {editable && (
            <button
              onClick={(e) => { e.stopPropagation(); askDelete(row); }}
              className="inline-flex items-center h-[30px] px-2.5 rounded-md text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
              title="Eliminar"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      ),
    },
  ], [editable]);

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  return (
    <div>
      {/* ---- Page header ---- */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Reportes Avanzados</h1>
        <p className="text-sm text-text-muted mt-1">
          Generacion y gestion de reportes personalizados
        </p>
      </div>

      {/* ---- Summary cards ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          label="Total Reportes"
          value={total}
          color="bg-guinda/10"
          icon={
            <svg className="w-6 h-6 text-guinda" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <SummaryCard
          label="Generados"
          value={generados}
          color="bg-sky-50"
          icon={
            <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <SummaryCard
          label="Aprobados"
          value={aprobados}
          color="bg-emerald-50"
          icon={
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <SummaryCard
          label="Exportados"
          value={exportados}
          color="bg-guinda/10"
          icon={
            <svg className="w-6 h-6 text-guinda" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
      </div>

      {/* ---- Tab buttons ---- */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setActiveTab('mis_reportes')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
            activeTab === 'mis_reportes'
              ? 'bg-guinda text-white shadow-md'
              : 'bg-gray-100 text-text-secondary hover:text-text-primary'
          }`}
        >
          Mis Reportes
        </button>
        <button
          onClick={() => setActiveTab('predefinidos')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
            activeTab === 'predefinidos'
              ? 'bg-guinda text-white shadow-md'
              : 'bg-gray-100 text-text-secondary hover:text-text-primary'
          }`}
        >
          Reportes Predefinidos
        </button>
      </div>

      {/* ================================================================ */}
      {/*  TAB: Mis Reportes                                               */}
      {/* ================================================================ */}
      {activeTab === 'mis_reportes' && (
        <div className="bg-white rounded-lg card-shadow p-5">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-text-heading">
              Reportes Personalizados
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={handleExportTable} disabled={reportes.length === 0}>
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar XLSX
              </Button>
              {editable && (
                <Button onClick={openCreate}>
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Nuevo Reporte
                </Button>
              )}
            </div>
          </div>

          {/* Loading state */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-text-muted text-sm">
              <svg className="animate-spin h-5 w-5 mr-3 text-guinda" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Cargando reportes...
            </div>
          ) : (
            <DataTable columns={columns} data={reportes} />
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/*  TAB: Reportes Predefinidos                                      */}
      {/* ================================================================ */}
      {activeTab === 'predefinidos' && (
        <div>
          <div className="bg-white rounded-lg card-shadow p-5 mb-4">
            <h2 className="text-base font-semibold text-text-heading mb-1">
              Plantillas de Reportes LGCG
            </h2>
            <p className="text-sm text-text-muted">
              Seleccione un reporte predefinido para generarlo automaticamente. El reporte se agregara a "Mis Reportes".
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {REPORTES_PREDEFINIDOS.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-white rounded-lg card-shadow p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  {/* Icon + badge */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-lg bg-guinda/10 flex items-center justify-center text-guinda">
                      {tpl.icon}
                    </div>
                    <Badge variant={tpl.tipo === 'financiero' ? 'info' : tpl.tipo === 'presupuestal' ? 'warning' : 'success'}>
                      {TIPOS_REPORTE_AVANZADO[tpl.tipo]}
                    </Badge>
                  </div>

                  {/* Title + description */}
                  <h3 className="text-sm font-semibold text-text-heading mb-1.5">{tpl.titulo}</h3>
                  <p className="text-xs text-text-muted leading-relaxed mb-4">{tpl.descripcion}</p>
                </div>

                {/* Action */}
                {editable ? (
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handleGeneratePredefined(tpl)}
                    loading={createMut.isPending}
                    className="w-full"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Generar
                  </Button>
                ) : (
                  <p className="text-xs text-text-muted text-center italic">Sin permisos de edicion</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/*  Modal: Create / Edit Report                                     */}
      {/* ================================================================ */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar Reporte' : 'Nuevo Reporte'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Row 1: Nombre + Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre"
              placeholder="Nombre del reporte"
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
            />
            <Select
              label="Tipo"
              placeholder="Seleccionar tipo..."
              options={TIPOS_OPTIONS}
              value={form.tipo}
              onChange={(e) => set('tipo', e.target.value)}
            />
          </div>

          {/* Row 2: Descripcion */}
          <div>
            <label className="block text-sm font-medium text-text-heading mb-1.5">
              Descripcion
            </label>
            <textarea
              rows={3}
              placeholder="Descripcion del reporte..."
              value={form.descripcion}
              onChange={(e) => set('descripcion', e.target.value)}
              className="block w-full rounded-md border border-border bg-white text-text-heading text-[0.9375rem] px-3.5 py-2.5 placeholder:text-text-muted transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda resize-none"
            />
          </div>

          {/* Row 3: Formato + Estado + Fecha */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Formato"
              placeholder="Seleccionar formato..."
              options={FORMATOS}
              value={form.formato}
              onChange={(e) => set('formato', e.target.value)}
            />
            <Select
              label="Estado"
              placeholder="Seleccionar estado..."
              options={ESTADOS_OPTIONS}
              value={form.estado}
              onChange={(e) => set('estado', e.target.value)}
            />
            <Input
              label="Fecha Generacion"
              type="date"
              value={form.fecha_generacion}
              onChange={(e) => set('fecha_generacion', e.target.value)}
            />
          </div>

          {/* Row 4: Parametros */}
          <div>
            <label className="block text-sm font-medium text-text-heading mb-1.5">
              Parametros (JSON)
            </label>
            <textarea
              rows={3}
              placeholder='{"periodo": "mensual", "cuentas": ["1000","2000"]}'
              value={form.parametros}
              onChange={(e) => set('parametros', e.target.value)}
              className="block w-full rounded-md border border-border bg-white text-text-heading text-[0.9375rem] px-3.5 py-2.5 placeholder:text-text-muted transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda resize-none font-mono text-sm"
            />
          </div>

          {/* Row 5: Notas */}
          <div>
            <label className="block text-sm font-medium text-text-heading mb-1.5">
              Notas
            </label>
            <textarea
              rows={2}
              placeholder="Notas adicionales..."
              value={form.notas}
              onChange={(e) => set('notas', e.target.value)}
              className="block w-full rounded-md border border-border bg-white text-text-heading text-[0.9375rem] px-3.5 py-2.5 placeholder:text-text-muted transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button variant="ghost" onClick={closeModal}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              loading={createMut.isPending || updateMut.isPending}
            >
              {editing ? 'Guardar Cambios' : 'Crear Reporte'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ================================================================ */}
      {/*  ConfirmDialog: Delete                                           */}
      {/* ================================================================ */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setDeleteTarget(null); }}
        onConfirm={confirmDelete}
        title="Eliminar Reporte"
        message={`Esta seguro de eliminar el reporte "${deleteTarget?.nombre}"? Esta accion no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        loading={removeMut.isPending}
      />
    </div>
  );
}
