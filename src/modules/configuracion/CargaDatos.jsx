import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '../../stores/appStore';
import { canEdit } from '../../utils/rbac';
import {
  seedClasificadores,
  getClasificadorCounts,
  getClasificadorData,
} from '../../utils/seedClasificadores';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';

/* ------------------------------------------------------------------ */
/*  SVG Icons (one per clasificador type)                              */
/* ------------------------------------------------------------------ */

const ICONS = {
  objeto_gasto: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  ),
  administrativo: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
    </svg>
  ),
  funcional: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  programatico: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  economico: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  geografico: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  fuente_financiamiento: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  ),
};

/* ------------------------------------------------------------------ */
/*  Clasificadores config                                              */
/* ------------------------------------------------------------------ */

const CLASIFICADORES = [
  { key: 'objeto_gasto', label: 'Objeto del Gasto (COG)' },
  { key: 'administrativo', label: 'Administrativo' },
  { key: 'funcional', label: 'Funcional' },
  { key: 'programatico', label: 'Programatico' },
  { key: 'economico', label: 'Economico' },
  { key: 'geografico', label: 'Geografico' },
  { key: 'fuente_financiamiento', label: 'Fuente de Financiamiento' },
];

/* ------------------------------------------------------------------ */
/*  Preview Table columns                                              */
/* ------------------------------------------------------------------ */

const PREVIEW_COLUMNS = [
  { key: 'codigo', label: 'Codigo', width: '120px' },
  { key: 'nombre', label: 'Nombre' },
  {
    key: 'nivel',
    label: 'Nivel',
    width: '80px',
    render: (val) => val ?? '\u2014',
  },
  {
    key: 'padre_codigo',
    label: 'Padre',
    width: '120px',
    render: (val) => val ?? '\u2014',
  },
];

/* ------------------------------------------------------------------ */
/*  Status badge helper                                                */
/* ------------------------------------------------------------------ */

function getStatusBadge(loaded, available) {
  if (loaded === 0)
    return { label: 'Vacio', variant: 'danger' };
  if (loaded >= available)
    return { label: 'Completo', variant: 'success' };
  return { label: 'Pendiente', variant: 'warning' };
}

/* ------------------------------------------------------------------ */
/*  Clasificador Card                                                  */
/* ------------------------------------------------------------------ */

function ClasificadorCard({
  tipo,
  label,
  loaded,
  available,
  isLoading,
  onLoad,
  canEditConfig,
}) {
  const status = getStatusBadge(loaded, available);
  const pct = available > 0 ? Math.min(100, Math.round((loaded / available) * 100)) : 0;

  return (
    <div
      className="bg-white rounded-lg p-5 flex flex-col gap-3"
      style={{ boxShadow: '0 2px 6px 0 rgba(67,89,113,0.12)' }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-guinda/10 text-guinda flex items-center justify-center flex-shrink-0">
            {ICONS[tipo] || ICONS.objeto_gasto}
          </div>
          <div>
            <h3 className="text-[0.9375rem] font-semibold text-text-heading leading-tight">
              {label}
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              {loaded} / {available} registros
            </p>
          </div>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-[#f0f0f0] rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${
            status.variant === 'success'
              ? 'bg-success'
              : status.variant === 'warning'
              ? 'bg-warning'
              : 'bg-[#d0d0d0]'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Action button */}
      {canEditConfig && (
        <Button
          variant={status.variant === 'success' ? 'ghost' : 'primary'}
          size="sm"
          loading={isLoading}
          disabled={status.variant === 'success' || isLoading}
          onClick={() => onLoad(tipo)}
          className="w-full"
        >
          {isLoading
            ? 'Cargando...'
            : status.variant === 'success'
            ? 'Ya cargado'
            : 'Cargar'}
        </Button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Migration status check icon                                        */
/* ------------------------------------------------------------------ */

function CheckIcon({ exists }) {
  if (exists) {
    return (
      <svg
        className="w-5 h-5 text-success flex-shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }
  return (
    <svg
      className="w-5 h-5 text-danger flex-shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function CargaDatos() {
  const { entePublico, rol } = useAppStore();
  const enteId = entePublico?.id;
  const canEditConfig = canEdit(rol, 'configuracion');

  // -- State --
  const [counts, setCounts] = useState({});
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [loadingTipo, setLoadingTipo] = useState(null); // which single tipo is loading
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, label: '' });
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text }
  const [previewTipo, setPreviewTipo] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // -- Available counts from static data --
  const availableCounts = useMemo(() => {
    const result = {};
    for (const c of CLASIFICADORES) {
      result[c.key] = getClasificadorData(c.key).length;
    }
    return result;
  }, []);

  // -- Fetch current counts --
  const fetchCounts = useCallback(async () => {
    if (!enteId) return;
    setLoadingCounts(true);
    try {
      const result = await getClasificadorCounts(enteId);
      setCounts(result);
    } catch {
      // silently handle
    } finally {
      setLoadingCounts(false);
    }
  }, [enteId]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  // -- Load single clasificador --
  const handleLoadSingle = useCallback(
    async (tipo) => {
      if (!enteId) {
        setMessage({ type: 'error', text: 'Seleccione un ente publico primero.' });
        return;
      }
      setLoadingTipo(tipo);
      setMessage(null);
      try {
        const result = await seedClasificadores(enteId, tipo);
        if (result.ok) {
          setMessage({
            type: 'success',
            text: `Clasificador "${CLASIFICADORES.find((c) => c.key === tipo)?.label}" cargado exitosamente (${result.inserted} registros).`,
          });
        } else {
          setMessage({
            type: 'error',
            text: `Errores al cargar: ${result.errors.join(', ')}`,
          });
        }
        await fetchCounts();
      } catch (err) {
        setMessage({ type: 'error', text: `Error inesperado: ${err.message}` });
      } finally {
        setLoadingTipo(null);
      }
    },
    [enteId, fetchCounts]
  );

  // -- Load all clasificadores --
  const handleLoadAll = useCallback(async () => {
    if (!enteId) {
      setMessage({ type: 'error', text: 'Seleccione un ente publico primero.' });
      return;
    }
    setBulkLoading(true);
    setMessage(null);
    const total = CLASIFICADORES.length;
    let successCount = 0;
    const allErrors = [];

    for (let i = 0; i < total; i++) {
      const c = CLASIFICADORES[i];
      setBulkProgress({ current: i + 1, total, label: c.label });

      try {
        const result = await seedClasificadores(enteId, c.key);
        if (result.ok) {
          successCount++;
        } else {
          allErrors.push(...result.errors);
        }
      } catch (err) {
        allErrors.push(`${c.label}: ${err.message}`);
      }
    }

    await fetchCounts();
    setBulkLoading(false);
    setBulkProgress({ current: 0, total: 0, label: '' });

    if (allErrors.length === 0) {
      setMessage({
        type: 'success',
        text: `Todos los clasificadores cargados exitosamente (${successCount}/${total}).`,
      });
    } else {
      setMessage({
        type: 'error',
        text: `Cargados ${successCount}/${total}. Errores: ${allErrors.join('; ')}`,
      });
    }
  }, [enteId, fetchCounts]);

  // -- Preview data --
  const previewData = useMemo(() => {
    if (!previewTipo) return [];
    return getClasificadorData(previewTipo);
  }, [previewTipo]);

  // -- Select options for preview --
  const selectOptions = useMemo(
    () =>
      CLASIFICADORES.map((c) => ({
        value: c.key,
        label: c.label,
      })),
    []
  );

  // -- Completeness summary --
  const totalLoaded = Object.values(counts).reduce((a, b) => a + b, 0);
  const totalAvailable = Object.values(availableCounts).reduce((a, b) => a + b, 0);
  const allComplete =
    CLASIFICADORES.every((c) => (counts[c.key] || 0) >= availableCounts[c.key]);

  return (
    <div className="space-y-6">
      {/* ---- Page Header ---- */}
      <div>
        <h1 className="text-2xl font-bold text-text-heading">
          Carga de Datos CONAC
        </h1>
        <p className="text-text-muted text-[0.9375rem] mt-1">
          Clasificadores presupuestales estandar del CONAC
        </p>
      </div>

      {/* ---- Toast / Message ---- */}
      {message && (
        <div
          className={`rounded-lg p-4 text-[0.9375rem] flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-success/10 text-success border border-success/20'
              : 'bg-danger/10 text-danger border border-danger/20'
          }`}
        >
          {message.type === 'success' ? (
            <svg
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="ml-auto text-current opacity-60 hover:opacity-100 cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* ---- No Ente Warning ---- */}
      {!enteId && (
        <div
          className="bg-white rounded-lg p-5"
          style={{ boxShadow: '0 2px 6px 0 rgba(67,89,113,0.12)' }}
        >
          <div className="flex items-center gap-3 text-warning">
            <svg
              className="w-6 h-6 flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <p className="text-[0.9375rem] text-text-heading">
              Seleccione un ente publico en la barra superior para poder cargar datos.
            </p>
          </div>
        </div>
      )}

      {/* ---- Section 1: Status Overview ---- */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-heading">
            Estado de Clasificadores
          </h2>
          <div className="flex items-center gap-2">
            {loadingCounts && (
              <span className="text-xs text-text-muted">Actualizando...</span>
            )}
            <Badge variant={allComplete ? 'success' : 'info'}>
              {totalLoaded} / {totalAvailable} registros totales
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {CLASIFICADORES.map((c) => (
            <ClasificadorCard
              key={c.key}
              tipo={c.key}
              label={c.label}
              loaded={counts[c.key] || 0}
              available={availableCounts[c.key] || 0}
              isLoading={loadingTipo === c.key}
              onLoad={handleLoadSingle}
              canEditConfig={canEditConfig}
            />
          ))}
        </div>
      </div>

      {/* ---- Section 2: Bulk Actions ---- */}
      {canEditConfig && (
        <div
          className="bg-white rounded-lg p-5"
          style={{ boxShadow: '0 2px 6px 0 rgba(67,89,113,0.12)' }}
        >
          <h2 className="text-lg font-semibold text-text-heading mb-3">
            Carga Masiva
          </h2>
          <p className="text-[0.9375rem] text-text-muted mb-4">
            Carga todos los clasificadores CONAC en una sola operacion. Se insertaran
            o actualizaran los registros existentes.
          </p>

          {/* Bulk progress */}
          {bulkLoading && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[0.875rem] text-text-heading font-medium">
                  Cargando {bulkProgress.label}...
                </span>
                <span className="text-xs text-text-muted">
                  {bulkProgress.current} / {bulkProgress.total}
                </span>
              </div>
              <div className="w-full bg-[#f0f0f0] rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-guinda transition-all duration-300"
                  style={{
                    width: `${
                      bulkProgress.total > 0
                        ? Math.round(
                            (bulkProgress.current / bulkProgress.total) * 100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          )}

          <Button
            variant="primary"
            loading={bulkLoading}
            disabled={bulkLoading || !enteId || allComplete}
            onClick={handleLoadAll}
            className="w-full"
          >
            {bulkLoading
              ? `Cargando ${bulkProgress.current} de ${bulkProgress.total}...`
              : allComplete
              ? 'Todos los clasificadores estan cargados'
              : 'Cargar Todos los Clasificadores'}
          </Button>
        </div>
      )}

      {/* ---- Section 3: Preview Table ---- */}
      <div
        className="bg-white rounded-lg p-5"
        style={{ boxShadow: '0 2px 6px 0 rgba(67,89,113,0.12)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-heading">
            Vista Previa de Datos
          </h2>
          <button
            onClick={() => setShowPreview((v) => !v)}
            className="text-[0.875rem] text-guinda hover:text-guinda-dark font-medium cursor-pointer"
          >
            {showPreview ? 'Ocultar' : 'Ver datos que se cargaran'}
          </button>
        </div>

        {showPreview && (
          <>
            <div className="mb-4 max-w-sm">
              <Select
                label="Tipo de Clasificador"
                placeholder="Seleccionar tipo..."
                options={selectOptions}
                value={previewTipo}
                onChange={(e) => setPreviewTipo(e.target.value)}
              />
            </div>

            {previewTipo ? (
              <div>
                <p className="text-xs text-text-muted mb-3">
                  {previewData.length} registros disponibles para cargar
                </p>
                <DataTable
                  columns={PREVIEW_COLUMNS}
                  data={previewData}
                  searchable={true}
                  pageSize={15}
                />
              </div>
            ) : (
              <p className="text-[0.9375rem] text-text-muted py-8 text-center">
                Seleccione un tipo de clasificador para ver sus datos.
              </p>
            )}
          </>
        )}
      </div>

      {/* ---- Section 4: SQL Migration Status ---- */}
      <div
        className="bg-white rounded-lg p-5"
        style={{ boxShadow: '0 2px 6px 0 rgba(67,89,113,0.12)' }}
      >
        <h2 className="text-lg font-semibold text-text-heading mb-3">
          Estado de Migraciones SQL
        </h2>

        <div className="rounded-lg border border-info/20 bg-info/5 p-4 mb-4">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-info flex-shrink-0 mt-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <div className="text-[0.875rem] text-text-heading">
              <p className="font-medium mb-1">Migraciones de base de datos</p>
              <p className="text-text-muted">
                Las migraciones SQL deben ejecutarse directamente en el Supabase
                Dashboard (SQL Editor) antes de cargar los datos. Los archivos se
                encuentran en la carpeta <code className="bg-[#f0f0f0] px-1.5 py-0.5 rounded text-xs">supabase/</code> del proyecto.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {[
            { file: 'supabase/migration.sql', desc: 'Tablas base del sistema' },
            {
              file: 'supabase/migration_batches.sql',
              desc: 'Tablas de modulos adicionales',
            },
            {
              file: 'supabase/seed_clasificadores.sql',
              desc: 'Tabla clasificador_presupuestal y funcion RPC',
            },
          ].map((m) => (
            <div
              key={m.file}
              className="flex items-center gap-3 py-2 px-3 rounded-md bg-[#f9fafb]"
            >
              <CheckIcon exists={true} />
              <div>
                <p className="text-[0.875rem] font-medium text-text-heading">
                  {m.file}
                </p>
                <p className="text-xs text-text-muted">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
