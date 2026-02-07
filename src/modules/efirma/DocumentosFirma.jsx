import { useState, useMemo, useRef } from 'react';
import { useCreate, useUpdate, useRemove } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import {
  useDocumentosFirmados,
  useCertificados,
  useFirmarDocumento,
  useVerificarDocumento,
} from '../../hooks/useEFirma';
import { canEdit } from '../../utils/rbac';
import {
  TIPOS_DOCUMENTO_FIRMA,
  ESTADOS_FIRMA,
} from '../../config/constants';
import { hashArchivo, hashDocumento } from '../../utils/efirmaCrypto';
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
  folio: '',
  tipo_documento: 'poliza',
  descripcion: '',
  certificado_id: '',
  firmante: '',
  fecha_firma: today(),
  cadena_original: '',
  sello_digital: '',
  estado: 'pendiente',
  notas: '',
};

export default function DocumentosFirma() {
  const { entePublico, ejercicioFiscal, rol } = useAppStore();
  const editable = canEdit(rol, 'seguridad');

  // --- CRUD state ---
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // --- Signing flow state ---
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [signDoc, setSignDoc] = useState(null);
  const [signCertId, setSignCertId] = useState('');
  const [signContent, setSignContent] = useState('');
  const [signFileRef] = useState(() => ({ current: null }));
  const signFileInputRef = useRef(null);

  // --- Verify flow state ---
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyDoc, setVerifyDoc] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const verifyFileInputRef = useRef(null);

  // --- Hash tool state ---
  const [hashModalOpen, setHashModalOpen] = useState(false);
  const [hashResult, setHashResult] = useState(null);
  const [hashLoading, setHashLoading] = useState(false);
  const hashFileInputRef = useRef(null);

  // --- Data hooks ---
  const { data: documentos = [], isLoading } = useDocumentosFirmados();
  const { data: certificados = [] } = useCertificados();

  const createMut = useCreate('documento_firmado');
  const updateMut = useUpdate('documento_firmado');
  const removeMut = useRemove('documento_firmado');
  const firmarMut = useFirmarDocumento();

  // --- Select options ---
  const tipoDocOptions = useMemo(
    () => Object.entries(TIPOS_DOCUMENTO_FIRMA).map(([value, label]) => ({ value, label })),
    []
  );

  const estadoOptions = useMemo(
    () => Object.entries(ESTADOS_FIRMA).map(([value, { label }]) => ({ value, label })),
    []
  );

  const certificadoOptions = useMemo(
    () =>
      certificados
        .filter((c) => c.estado === 'vigente')
        .map((c) => ({
          value: c.id,
          label: `${c.numero_serie} - ${c.titular}`,
        })),
    [certificados]
  );

  const allCertificadoOptions = useMemo(
    () =>
      certificados.map((c) => ({
        value: c.id,
        label: `${c.numero_serie} - ${c.titular}`,
      })),
    [certificados]
  );

  const filtroTipoOptions = useMemo(
    () => [
      { value: '', label: 'Todos los tipos' },
      ...Object.entries(TIPOS_DOCUMENTO_FIRMA).map(([value, label]) => ({ value, label })),
    ],
    []
  );

  const filtroEstadoOptions = useMemo(
    () => [
      { value: '', label: 'Todos los estados' },
      ...Object.entries(ESTADOS_FIRMA).map(([value, { label }]) => ({ value, label })),
    ],
    []
  );

  // --- Filtered data ---
  const filteredData = useMemo(() => {
    let result = documentos;
    if (filtroTipo) result = result.filter((d) => d.tipo_documento === filtroTipo);
    if (filtroEstado) result = result.filter((d) => d.estado === filtroEstado);
    return result;
  }, [documentos, filtroTipo, filtroEstado]);

  // --- Helpers ---
  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const truncate = (str, len = 40) => {
    if (!str) return '';
    return str.length > len ? str.slice(0, len) + '...' : str;
  };

  // --- Handlers ---
  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, fecha_firma: today() });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      folio: row.folio ?? '',
      tipo_documento: row.tipo_documento ?? 'poliza',
      descripcion: row.descripcion ?? '',
      certificado_id: row.certificado_id ?? '',
      firmante: row.firmante ?? '',
      fecha_firma: row.fecha_firma ?? today(),
      cadena_original: row.cadena_original ?? '',
      sello_digital: row.sello_digital ?? '',
      estado: row.estado ?? 'pendiente',
      notas: row.notas ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      ente_id: entePublico?.id,
      ejercicio_id: ejercicioFiscal?.id,
      certificado_id: form.certificado_id || null,
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

  // --- Signing flow ---
  const openSign = (row) => {
    setSignDoc(row);
    setSignCertId(row.certificado_id || '');
    setSignContent('');
    setSignModalOpen(true);
  };

  const handleSignFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const buffer = await file.arrayBuffer();
    // Store the file content as ArrayBuffer for hashing
    signFileRef.current = buffer;
    setSignContent(`[Archivo: ${file.name} - ${(file.size / 1024).toFixed(1)} KB]`);
  };

  const handleSign = async () => {
    if (!signDoc || !signCertId) return;

    // Use file content if uploaded, otherwise use text description
    const contenido = signFileRef.current || signDoc.descripcion || signDoc.folio || '';
    await firmarMut.mutateAsync({
      documentoId: signDoc.id,
      contenido,
      certificadoId: signCertId,
    });
    setSignModalOpen(false);
    signFileRef.current = null;
  };

  // --- Verify flow ---
  const openVerify = (row) => {
    setVerifyDoc(row);
    setVerifyResult(null);
    setVerifyModalOpen(true);
  };

  const handleVerifyFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !verifyDoc?.hash_documento) return;

    setVerifyLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const hashActual = await hashDocumento(buffer);
      setVerifyResult({
        valido: hashActual === verifyDoc.hash_documento,
        hashActual,
        hashOriginal: verifyDoc.hash_documento,
      });
    } catch (err) {
      setVerifyResult({
        valido: false,
        error: err.message,
      });
    }
    setVerifyLoading(false);
  };

  // --- Hash tool ---
  const openHashTool = () => {
    setHashResult(null);
    setHashModalOpen(true);
  };

  const handleHashFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setHashLoading(true);
    try {
      const result = await hashArchivo(file);
      setHashResult(result);
    } catch (err) {
      setHashResult({ error: err.message });
    }
    setHashLoading(false);
  };

  // --- Export handler ---
  const handleExport = () => {
    const excelCols = [
      { key: 'folio', label: 'Folio' },
      {
        key: 'tipo_documento',
        label: 'Tipo Documento',
        getValue: (row) => TIPOS_DOCUMENTO_FIRMA[row.tipo_documento] || row.tipo_documento,
      },
      { key: 'descripcion', label: 'Descripcion' },
      {
        key: 'certificado_id',
        label: 'Certificado',
        getValue: (row) => row.certificado?.numero_serie || '',
      },
      { key: 'firmante', label: 'Firmante' },
      { key: 'fecha_firma', label: 'Fecha Firma' },
      { key: 'hash_documento', label: 'Hash SHA-256' },
      { key: 'cadena_original', label: 'Cadena Original' },
      { key: 'sello_digital', label: 'Sello Digital' },
      {
        key: 'estado',
        label: 'Estado',
        getValue: (row) => ESTADOS_FIRMA[row.estado]?.label || row.estado,
      },
      { key: 'notas', label: 'Notas' },
    ];
    exportToExcel(filteredData, excelCols, 'documentos_firmados');
  };

  // --- Table columns ---
  const columns = useMemo(
    () => [
      { key: 'folio', label: 'Folio', width: '100px' },
      {
        key: 'tipo_documento',
        label: 'Tipo',
        width: '130px',
        render: (val) => TIPOS_DOCUMENTO_FIRMA[val] || val,
      },
      {
        key: 'descripcion',
        label: 'Descripcion',
        render: (val) => (
          <span title={val || ''}>{truncate(val)}</span>
        ),
      },
      {
        key: 'certificado',
        label: 'Certificado',
        width: '150px',
        render: (val) => val?.numero_serie || '-',
      },
      { key: 'firmante', label: 'Firmante', width: '130px' },
      { key: 'fecha_firma', label: 'Fecha', width: '100px' },
      {
        key: 'hash_documento',
        label: 'Hash SHA-256',
        width: '140px',
        render: (val) => val ? (
          <span title={val} className="font-mono text-[10px] text-text-secondary">
            {val.slice(0, 16)}...
          </span>
        ) : (
          <span className="text-text-muted text-xs">-</span>
        ),
      },
      {
        key: 'estado',
        label: 'Estado',
        width: '110px',
        render: (val) => {
          const est = ESTADOS_FIRMA[val] || { label: val, variant: 'default' };
          return <Badge variant={est.variant}>{est.label}</Badge>;
        },
      },
      {
        key: 'id',
        label: 'Acciones',
        width: '180px',
        sortable: false,
        render: (_val, row) => (
          <div className="flex items-center gap-2">
            {row.estado === 'pendiente' && editable && (
              <button
                onClick={(e) => { e.stopPropagation(); openSign(row); }}
                className="text-xs text-[#56ca00] hover:text-[#56ca00]/80 transition-colors cursor-pointer font-medium"
              >
                Firmar
              </button>
            )}
            {row.estado === 'firmado' && row.hash_documento && (
              <button
                onClick={(e) => { e.stopPropagation(); openVerify(row); }}
                className="text-xs text-[#03a9ce] hover:text-[#03a9ce]/80 transition-colors cursor-pointer"
              >
                Verificar
              </button>
            )}
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
        <h1 className="text-xl font-bold text-text-primary">Documentos Firmados</h1>
        <p className="text-sm text-text-muted mt-1">
          Control de documentos firmados electronicamente con e.firma
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold text-text-secondary">
            Documentos
            <span className="ml-2 text-text-muted font-normal">
              ({filteredData.length} registros)
            </span>
          </h2>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="h-[38px] rounded-md border border-border text-[0.9375rem] px-3 focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda"
          >
            {filtroTipoOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="h-[38px] rounded-md border border-border text-[0.9375rem] px-3 focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda"
          >
            {filtroEstadoOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={openHashTool} variant="outline-secondary" size="sm">
            Calcular Hash
          </Button>
          <Button onClick={handleExport} variant="outline-primary" size="sm">
            Exportar Excel
          </Button>
          {editable && (
            <Button onClick={openCreate} size="sm">
              + Nuevo Documento
            </Button>
          )}
        </div>
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando documentos firmados...
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
        title={editing ? 'Editar Documento Firmado' : 'Nuevo Documento Firmado'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Row 1: Folio, Tipo Documento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Folio"
              value={form.folio}
              onChange={(e) => set('folio', e.target.value)}
              placeholder="Ej. DOC-001"
              required
            />
            <Select
              label="Tipo de Documento"
              value={form.tipo_documento}
              onChange={(e) => set('tipo_documento', e.target.value)}
              options={tipoDocOptions}
              placeholder="-- Seleccione tipo --"
              required
            />
          </div>

          {/* Row 2: Descripcion */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Descripcion
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) => set('descripcion', e.target.value)}
              placeholder="Descripcion del documento a firmar"
              rows={2}
              className="w-full h-auto rounded-md border border-border text-[0.9375rem] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda"
            />
          </div>

          {/* Row 3: Certificado, Firmante */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Certificado"
              value={form.certificado_id}
              onChange={(e) => set('certificado_id', e.target.value)}
              options={allCertificadoOptions}
              placeholder="-- Seleccione certificado --"
            />
            <Input
              label="Firmante"
              value={form.firmante}
              onChange={(e) => set('firmante', e.target.value)}
              placeholder="Nombre del firmante"
              required
            />
          </div>

          {/* Row 4: Fecha Firma, Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fecha de Firma"
              type="date"
              value={form.fecha_firma}
              onChange={(e) => set('fecha_firma', e.target.value)}
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

          {/* Row 5: Cadena Original (read-only if signed) */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Cadena Original
            </label>
            <textarea
              value={form.cadena_original}
              onChange={(e) => set('cadena_original', e.target.value)}
              placeholder="Se genera automaticamente al firmar"
              rows={3}
              readOnly={form.estado === 'firmado'}
              className={`w-full h-auto rounded-md border border-border text-[0.9375rem] font-mono text-xs px-3 py-2 focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda ${form.estado === 'firmado' ? 'bg-[#f8f8f8]' : ''}`}
            />
          </div>

          {/* Row 6: Sello Digital (read-only if signed) */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Sello Digital
            </label>
            <textarea
              value={form.sello_digital}
              onChange={(e) => set('sello_digital', e.target.value)}
              placeholder="Se genera automaticamente al firmar"
              rows={3}
              readOnly={form.estado === 'firmado'}
              className={`w-full h-auto rounded-md border border-border text-[0.9375rem] font-mono text-xs px-3 py-2 focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda ${form.estado === 'firmado' ? 'bg-[#f8f8f8]' : ''}`}
            />
          </div>

          {/* Row 7: Notas */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Notas
            </label>
            <textarea
              value={form.notas}
              onChange={(e) => set('notas', e.target.value)}
              placeholder="Observaciones o notas adicionales"
              rows={2}
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
              disabled={!form.folio.trim() || !form.firmante.trim()}
            >
              {editing ? 'Guardar cambios' : 'Crear Documento'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Signing modal */}
      <Modal
        open={signModalOpen}
        onClose={() => setSignModalOpen(false)}
        title="Firmar Documento"
        size="md"
      >
        {signDoc && (
          <div className="space-y-4">
            {/* Document info */}
            <div className="bg-[#f8f8f8] rounded-lg p-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-text-muted">Folio:</span>
                  <span className="ml-2 font-semibold text-text-primary">{signDoc.folio}</span>
                </div>
                <div>
                  <span className="text-text-muted">Tipo:</span>
                  <span className="ml-2 text-text-primary">
                    {TIPOS_DOCUMENTO_FIRMA[signDoc.tipo_documento] || signDoc.tipo_documento}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-text-muted">Descripcion:</span>
                  <span className="ml-2 text-text-primary">{signDoc.descripcion || '-'}</span>
                </div>
              </div>
            </div>

            {/* Select certificate */}
            <Select
              label="Certificado para firmar"
              value={signCertId}
              onChange={(e) => setSignCertId(e.target.value)}
              options={certificadoOptions}
              placeholder="-- Seleccione certificado vigente --"
              required
            />
            {certificadoOptions.length === 0 && (
              <p className="text-xs text-danger">
                No hay certificados vigentes. Cargue un certificado .cer en la seccion de e.firma.
              </p>
            )}

            {/* Optional: upload file to sign */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Archivo a firmar (opcional)
              </label>
              <p className="text-xs text-text-muted mb-2">
                Si selecciona un archivo, se generara el hash SHA-256 de su contenido.
                Si no, se usara la descripcion del documento.
              </p>
              <input
                ref={signFileInputRef}
                type="file"
                onChange={handleSignFileUpload}
                className="block w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-guinda/10 file:text-guinda hover:file:bg-guinda/20 file:cursor-pointer"
              />
              {signContent && (
                <p className="mt-1 text-xs text-[#56ca00]">{signContent}</p>
              )}
            </div>

            {/* Error */}
            {firmarMut.isError && (
              <p className="text-xs text-danger">
                Error: {firmarMut.error?.message || 'No se pudo firmar el documento'}
              </p>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t border-border">
              <Button variant="ghost" onClick={() => setSignModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="success"
                onClick={handleSign}
                loading={firmarMut.isPending}
                disabled={!signCertId}
              >
                Firmar Documento
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Verify modal */}
      <Modal
        open={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        title="Verificar Integridad del Documento"
        size="md"
      >
        {verifyDoc && (
          <div className="space-y-4">
            {/* Document info */}
            <div className="bg-[#f8f8f8] rounded-lg p-4 space-y-2">
              <div className="text-sm">
                <span className="text-text-muted">Folio:</span>
                <span className="ml-2 font-semibold text-text-primary">{verifyDoc.folio}</span>
              </div>
              <div className="text-sm">
                <span className="text-text-muted">Hash original (SHA-256):</span>
                <p className="mt-1 font-mono text-[11px] text-text-primary bg-white rounded p-2 border border-border break-all">
                  {verifyDoc.hash_documento}
                </p>
              </div>
            </div>

            {/* Upload file to verify */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Seleccione el archivo original para verificar
              </label>
              <p className="text-xs text-text-muted mb-2">
                Se calculara el hash SHA-256 del archivo y se comparara con el hash registrado al firmar.
              </p>
              <input
                ref={verifyFileInputRef}
                type="file"
                onChange={handleVerifyFile}
                className="block w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-guinda/10 file:text-guinda hover:file:bg-guinda/20 file:cursor-pointer"
              />
            </div>

            {/* Result */}
            {verifyLoading && (
              <div className="text-sm text-text-muted text-center py-3">
                Calculando hash...
              </div>
            )}
            {verifyResult && !verifyResult.error && (
              <div className={`rounded-lg p-4 ${verifyResult.valido ? 'bg-[#56ca00]/10' : 'bg-danger/10'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {verifyResult.valido ? (
                    <>
                      <svg className="w-5 h-5 text-[#56ca00]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-semibold text-[#56ca00]">
                        Documento integro - Los hashes coinciden
                      </span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-semibold text-danger">
                        Documento alterado - Los hashes NO coinciden
                      </span>
                    </>
                  )}
                </div>
                <div className="text-xs space-y-1">
                  <div>
                    <span className="text-text-muted">Hash original:</span>
                    <span className="ml-1 font-mono">{truncate(verifyResult.hashOriginal, 32)}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Hash actual:</span>
                    <span className="ml-1 font-mono">{truncate(verifyResult.hashActual, 32)}</span>
                  </div>
                </div>
              </div>
            )}
            {verifyResult?.error && (
              <p className="text-xs text-danger">Error: {verifyResult.error}</p>
            )}

            <div className="flex justify-end pt-2 border-t border-border">
              <Button variant="ghost" onClick={() => setVerifyModalOpen(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Hash tool modal */}
      <Modal
        open={hashModalOpen}
        onClose={() => setHashModalOpen(false)}
        title="Calcular Hash SHA-256"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Seleccione un archivo para calcular su hash SHA-256 usando la Web Crypto API del navegador.
            Este hash es identico al que se genera al firmar un documento.
          </p>

          <input
            ref={hashFileInputRef}
            type="file"
            onChange={handleHashFile}
            className="block w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-guinda/10 file:text-guinda hover:file:bg-guinda/20 file:cursor-pointer"
          />

          {hashLoading && (
            <div className="text-sm text-text-muted text-center py-3">
              Calculando hash SHA-256...
            </div>
          )}

          {hashResult && !hashResult.error && (
            <div className="bg-[#f8f8f8] rounded-lg p-4 space-y-3">
              <div className="text-sm">
                <span className="text-text-muted">Archivo:</span>
                <span className="ml-2 text-text-primary">{hashResult.name}</span>
                <span className="ml-2 text-text-muted">({(hashResult.size / 1024).toFixed(1)} KB)</span>
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Hash SHA-256 (Hex)</label>
                <div className="font-mono text-[11px] text-text-primary bg-white rounded p-2 border border-border break-all select-all">
                  {hashResult.hex}
                </div>
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Hash SHA-256 (Base64)</label>
                <div className="font-mono text-[11px] text-text-primary bg-white rounded p-2 border border-border break-all select-all">
                  {hashResult.base64}
                </div>
              </div>
            </div>
          )}
          {hashResult?.error && (
            <p className="text-xs text-danger">Error: {hashResult.error}</p>
          )}

          <div className="flex justify-end pt-2 border-t border-border">
            <Button variant="ghost" onClick={() => setHashModalOpen(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setToDelete(null); }}
        onConfirm={confirmDelete}
        title="Eliminar documento firmado"
        message={
          toDelete
            ? `¿Esta seguro de eliminar el documento firmado "${toDelete.folio || ''}"? Esta accion no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        loading={removeMut.isPending}
      />
    </div>
  );
}
