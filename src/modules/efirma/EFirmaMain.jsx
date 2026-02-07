import { useState, useMemo, useRef, useCallback } from 'react';
import { useCreate, useUpdate, useRemove } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { useCertificados, useResumenEFirma, useRegistrarCertificado } from '../../hooks/useEFirma';
import { canEdit } from '../../utils/rbac';
import { TIPOS_CERTIFICADO, ESTADOS_CERTIFICADO } from '../../config/constants';
import {
  parseCertificadoCER,
  esCertificadoSAT,
  certificadoVigente,
  diasParaVencer,
  getEstadoCertificado,
} from '../../utils/efirmaCrypto';
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

  // --- .cer upload state ---
  const [cerFile, setCerFile] = useState(null);
  const [cerParsed, setCerParsed] = useState(null);
  const [cerError, setCerError] = useState('');
  const [cerDragOver, setCerDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // --- Detail modal ---
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailCert, setDetailCert] = useState(null);

  // --- Data hooks ---
  const { data: certificados = [], isLoading } = useCertificados();
  const { data: resumen = {}, isLoading: loadingResumen } = useResumenEFirma();

  const registrarMut = useRegistrarCertificado();
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

  // --- .cer file handling ---
  const handleCerFile = useCallback(async (file) => {
    setCerError('');
    setCerParsed(null);

    if (!file) return;

    // Validate extension
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'cer') {
      setCerError('Solo se aceptan archivos con extension .cer');
      return;
    }

    // Validate size (max 10KB for a certificate)
    if (file.size > 10240) {
      setCerError('El archivo es demasiado grande. Los certificados .cer no deben exceder 10 KB.');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const info = parseCertificadoCER(buffer);
      setCerFile(file);
      setCerParsed(info);

      // Auto-fill form with parsed data
      setForm((prev) => ({
        ...prev,
        numero_serie: info.numeroSerie || prev.numero_serie,
        titular: info.titular || prev.titular,
        rfc: info.rfc || prev.rfc,
        emisor: info.emisor || prev.emisor,
        fecha_vigencia_inicio: info.fechaInicio
          ? info.fechaInicio.toISOString().slice(0, 10)
          : prev.fecha_vigencia_inicio,
        fecha_vigencia_fin: info.fechaFin
          ? info.fechaFin.toISOString().slice(0, 10)
          : prev.fecha_vigencia_fin,
        estado: info.vigente ? 'vigente' : 'vencido',
      }));
    } catch (err) {
      setCerError(`Error al leer el certificado: ${err.message}`);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setCerDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleCerFile(file);
  }, [handleCerFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setCerDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setCerDragOver(false);
  }, []);

  const clearCerFile = () => {
    setCerFile(null);
    setCerParsed(null);
    setCerError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Handlers ---
  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, fecha_vigencia_inicio: today() });
    clearCerFile();
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
    clearCerFile();
    setModalOpen(true);
  };

  const openDetail = (row) => {
    setDetailCert(row);
    setDetailOpen(true);
  };

  const handleSave = async () => {
    if (!editing && cerFile && cerParsed) {
      // New certificate with .cer file: use crypto registration
      await registrarMut.mutateAsync({ file: cerFile, tipo: form.tipo });
    } else if (editing) {
      // Editing existing: use standard update
      const payload = {
        ...form,
        ente_id: entePublico?.id,
      };
      await updateMut.mutateAsync({ id: editing.id, ...payload });
    } else {
      // New certificate without file: manual entry (kept for backwards compat)
      const payload = {
        ...form,
        ente_id: entePublico?.id,
      };
      // Use the registrarMut would fail without a file, so fallback to direct insert
      const { useCreate: _ } = await import('../../hooks/useCrud');
      const { supabase } = await import('../../config/supabase');
      const { error } = await supabase.from('certificado_efirma').insert(payload);
      if (error) throw error;
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
      { key: 'numero_serie', label: 'Numero de Serie', width: '180px' },
      { key: 'titular', label: 'Titular' },
      { key: 'rfc', label: 'RFC', width: '140px' },
      {
        key: 'tipo',
        label: 'Tipo',
        width: '140px',
        render: (val) => TIPOS_CERTIFICADO[val] || val,
      },
      { key: 'fecha_vigencia_fin', label: 'Vigencia', width: '120px' },
      {
        key: 'estado',
        label: 'Estado',
        width: '120px',
        render: (val, row) => {
          const est = ESTADOS_CERTIFICADO[val] || { label: val, variant: 'default' };
          return (
            <div className="flex items-center gap-1.5">
              <Badge variant={est.variant}>{est.label}</Badge>
              {row.certificado_pem && (
                <span title="Certificado cargado desde .cer" className="text-[10px] text-[#56ca00]">
                  CER
                </span>
              )}
            </div>
          );
        },
      },
      {
        key: 'emisor',
        label: 'Emisor',
        width: '160px',
        render: (val) => {
          if (!val) return '-';
          const isSAT = val.toLowerCase().includes('sat') || val.toLowerCase().includes('servicio de administracion');
          return (
            <div className="flex items-center gap-1.5">
              <span className="truncate" title={val}>{val}</span>
              {isSAT && <Badge variant="success">SAT</Badge>}
            </div>
          );
        },
      },
      {
        key: 'id',
        label: 'Acciones',
        width: '160px',
        sortable: false,
        render: (_val, row) => (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); openDetail(row); }}
              className="text-xs text-[#03a9ce] hover:text-[#03a9ce]/80 transition-colors cursor-pointer"
            >
              Detalle
            </button>
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

  const isSaving = registrarMut.isPending || updateMut.isPending;

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
              + Cargar Certificado (.cer)
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
          onRowClick={openDetail}
          rowClassName={(row) =>
            isExpiringSoon(row) ? 'bg-amber-50' : ''
          }
        />
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Certificado' : 'Cargar Certificado (.cer)'}
        size="lg"
      >
        <div className="space-y-4">
          {/* .cer file upload zone (only for new certificates) */}
          {!editing && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Archivo de Certificado (.cer)
              </label>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                  transition-colors duration-150
                  ${cerDragOver
                    ? 'border-guinda bg-guinda/5'
                    : cerParsed
                      ? 'border-[#56ca00] bg-[#56ca00]/5'
                      : cerError
                        ? 'border-danger bg-danger/5'
                        : 'border-border hover:border-guinda/50 hover:bg-bg-hover'
                  }
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".cer"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCerFile(file);
                  }}
                />

                {cerParsed ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 text-[#56ca00]">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium">Certificado leido correctamente</span>
                    </div>
                    <p className="text-xs text-text-muted">{cerFile?.name}</p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); clearCerFile(); }}
                      className="text-xs text-danger hover:text-danger/80 cursor-pointer"
                    >
                      Quitar archivo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <svg className="mx-auto w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3v11.25" />
                    </svg>
                    <p className="text-sm text-text-secondary">
                      Arrastre su archivo <strong>.cer</strong> aqui o haga clic para seleccionar
                    </p>
                    <p className="text-xs text-text-muted">
                      Se leeran automaticamente: numero de serie, titular, RFC, emisor y vigencia
                    </p>
                  </div>
                )}
              </div>
              {cerError && (
                <p className="mt-1 text-xs text-danger">{cerError}</p>
              )}
            </div>
          )}

          {/* Parsed certificate preview */}
          {cerParsed && !editing && (
            <div className="bg-[#f8f8f8] rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-semibold text-text-primary mb-2">
                Datos del certificado
              </h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <span className="text-text-muted">No. Serie:</span>
                  <span className="ml-2 font-mono text-xs text-text-primary">{cerParsed.numeroSerie}</span>
                </div>
                <div>
                  <span className="text-text-muted">RFC:</span>
                  <span className="ml-2 font-semibold text-text-primary">{cerParsed.rfc || 'No encontrado'}</span>
                </div>
                <div>
                  <span className="text-text-muted">Titular:</span>
                  <span className="ml-2 text-text-primary">{cerParsed.titular || 'No encontrado'}</span>
                </div>
                <div>
                  <span className="text-text-muted">Emisor:</span>
                  <span className="ml-2 text-text-primary">{cerParsed.emisor || 'Desconocido'}</span>
                </div>
                <div>
                  <span className="text-text-muted">Vigencia inicio:</span>
                  <span className="ml-2 text-text-primary">
                    {cerParsed.fechaInicio?.toLocaleDateString('es-MX') || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted">Vigencia fin:</span>
                  <span className="ml-2 text-text-primary">
                    {cerParsed.fechaFin?.toLocaleDateString('es-MX') || '-'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                {esCertificadoSAT(cerParsed) && (
                  <Badge variant="success">SAT Verificado</Badge>
                )}
                {cerParsed.vigente ? (
                  <Badge variant="success">Vigente</Badge>
                ) : (
                  <Badge variant="danger">
                    {new Date() > cerParsed.fechaFin ? 'Vencido' : 'No vigente aun'}
                  </Badge>
                )}
                {cerParsed.vigente && diasParaVencer(cerParsed) <= 30 && (
                  <Badge variant="warning">
                    Vence en {diasParaVencer(cerParsed)} dias
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Type selection (always shown) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Tipo de Certificado"
              value={form.tipo}
              onChange={(e) => set('tipo', e.target.value)}
              options={tipoOptions}
              placeholder="-- Seleccione tipo --"
              required
            />
            {editing && (
              <Select
                label="Estado"
                value={form.estado}
                onChange={(e) => set('estado', e.target.value)}
                options={estadoOptions}
                placeholder="-- Seleccione estado --"
                required
              />
            )}
          </div>

          {/* Manual fields (shown when editing OR no .cer file loaded) */}
          {(editing || !cerParsed) && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Numero de Serie"
                  value={form.numero_serie}
                  onChange={(e) => set('numero_serie', e.target.value)}
                  placeholder="Ej. 30001000000400002434"
                  required
                  disabled={!!cerParsed && !editing}
                />
                <Input
                  label="RFC"
                  value={form.rfc}
                  onChange={(e) => set('rfc', e.target.value)}
                  placeholder="RFC del titular"
                  required
                  disabled={!!cerParsed && !editing}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Titular"
                  value={form.titular}
                  onChange={(e) => set('titular', e.target.value)}
                  placeholder="Nombre del titular del certificado"
                  required
                  disabled={!!cerParsed && !editing}
                />
                <Input
                  label="Emisor"
                  value={form.emisor}
                  onChange={(e) => set('emisor', e.target.value)}
                  placeholder="Ej. SAT, Autoridad Certificadora"
                  disabled={!!cerParsed && !editing}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Fecha de Vigencia Inicio"
                  type="date"
                  value={form.fecha_vigencia_inicio}
                  onChange={(e) => set('fecha_vigencia_inicio', e.target.value)}
                  required
                  disabled={!!cerParsed && !editing}
                />
                <Input
                  label="Fecha de Vigencia Fin"
                  type="date"
                  value={form.fecha_vigencia_fin}
                  onChange={(e) => set('fecha_vigencia_fin', e.target.value)}
                  required
                  disabled={!!cerParsed && !editing}
                />
              </div>
            </>
          )}

          {/* Notas (always shown for editing) */}
          {editing && (
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
          )}

          {/* Error from mutation */}
          {registrarMut.isError && (
            <p className="text-xs text-danger">
              Error: {registrarMut.error?.message || 'No se pudo registrar el certificado'}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              loading={isSaving}
              disabled={
                editing
                  ? !form.numero_serie.trim() || !form.titular.trim() || !form.rfc.trim() || !form.fecha_vigencia_fin
                  : !cerParsed && (!form.numero_serie.trim() || !form.titular.trim() || !form.rfc.trim() || !form.fecha_vigencia_fin)
              }
            >
              {editing ? 'Guardar cambios' : cerParsed ? 'Registrar Certificado' : 'Crear Certificado'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Certificate detail modal */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Detalle del Certificado"
        size="lg"
      >
        {detailCert && (
          <div className="space-y-4">
            {/* Status badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={ESTADOS_CERTIFICADO[detailCert.estado]?.variant || 'default'}>
                {ESTADOS_CERTIFICADO[detailCert.estado]?.label || detailCert.estado}
              </Badge>
              {detailCert.emisor && (
                (detailCert.emisor.toLowerCase().includes('sat') ||
                 detailCert.emisor.toLowerCase().includes('servicio de administracion'))
                  ? <Badge variant="success">SAT Verificado</Badge>
                  : <Badge variant="default">Emisor externo</Badge>
              )}
              {detailCert.certificado_pem && (
                <Badge variant="info">Archivo .cer cargado</Badge>
              )}
            </div>

            {/* Detail grid */}
            <div className="bg-[#f8f8f8] rounded-lg p-5 space-y-3">
              <DetailRow label="Numero de Serie" value={detailCert.numero_serie} mono />
              <DetailRow label="Titular" value={detailCert.titular} />
              <DetailRow label="RFC" value={detailCert.rfc} bold />
              <DetailRow label="Tipo" value={TIPOS_CERTIFICADO[detailCert.tipo] || detailCert.tipo} />
              <DetailRow label="Emisor" value={detailCert.emisor} />
              <DetailRow label="Vigencia Inicio" value={detailCert.fecha_vigencia_inicio?.slice(0, 10)} />
              <DetailRow label="Vigencia Fin" value={detailCert.fecha_vigencia_fin?.slice(0, 10)} />
              {detailCert.notas && (
                <DetailRow label="Notas" value={detailCert.notas} />
              )}
            </div>

            {/* PEM preview */}
            {detailCert.certificado_pem && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Certificado PEM
                </label>
                <pre className="bg-[#2b2c40] text-[#e0e0e0] rounded-lg p-3 text-[11px] font-mono overflow-x-auto max-h-40">
                  {detailCert.certificado_pem}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-border">
              <Button variant="ghost" onClick={() => setDetailOpen(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
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

/** Small helper component for detail rows */
function DetailRow({ label, value, mono = false, bold = false }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="text-text-muted min-w-[140px] shrink-0">{label}:</span>
      <span
        className={`text-text-primary ${mono ? 'font-mono text-xs' : ''} ${bold ? 'font-semibold' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}
