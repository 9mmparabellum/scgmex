import { useState, useEffect, useCallback, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import {
  getQueue,
  syncPendingOperations,
  clearQueue,
  removeQueueItem,
  updateQueueItem,
  getCacheStats,
  startAutoSync,
  stopAutoSync,
} from '../../utils/offlineSync';

/* ── Badge variant map ──────────────────────────────────────────────── */

const BADGE_VARIANT = {
  primary: 'bg-guinda/10 text-guinda',
  success: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
  danger: 'bg-red-50 text-red-600',
  info: 'bg-sky-50 text-sky-600',
  default: 'bg-gray-100 text-gray-600',
};

const DOT_COLOR = {
  success: 'bg-emerald-500',
  danger: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-sky-500',
};

/* ── Helpers ────────────────────────────────────────────────────────── */

function formatDateTime(date) {
  if (!date) return '--';
  const d = new Date(date);
  return d.toLocaleString('es-MX', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/* ── SVG Icons ──────────────────────────────────────────────────────── */

const IconWifi = (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
);

const IconWifiOff = (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23" /><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" /><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" /><path d="M10.71 5.05A16 16 0 0 1 22.56 9" /><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
);

const IconSync = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const IconDownload = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const IconTrash = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const IconDatabase = (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);

const IconSmartphone = (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);

const IconHardDrive = (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="12" x2="2" y2="12" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /><line x1="6" y1="16" x2="6.01" y2="16" /><line x1="10" y1="16" x2="10.01" y2="16" />
  </svg>
);

const IconClock = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconCheckCircle = (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const IconRefresh = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const IconXCircle = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const IconShield = (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconAlertTriangle = (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

/* ── SW State helpers ───────────────────────────────────────────────── */

function getSWStateLabel(reg) {
  if (!reg) return { label: 'No registrado', variant: 'default' };
  if (reg.installing) return { label: 'Instalando', variant: 'warning' };
  if (reg.waiting) return { label: 'Actualizacion lista', variant: 'info' };
  if (reg.active) return { label: 'Activo', variant: 'success' };
  return { label: 'Desconocido', variant: 'default' };
}

/* ── Component ──────────────────────────────────────────────────────── */

export default function PWAConfig() {
  /* ── Service Worker Registration (real) ──────────────────────────── */
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      swRegistrationRef.current = registration;
      setSWInfo((prev) => ({
        ...prev,
        url: swUrl,
        registration,
        lastCheck: new Date().toISOString(),
      }));
    },
    onRegisterError(error) {
      setSWInfo((prev) => ({
        ...prev,
        error: error?.message || 'Error de registro',
      }));
    },
  });

  const swRegistrationRef = useRef(null);
  const [swInfo, setSWInfo] = useState({
    url: null,
    registration: null,
    lastCheck: null,
    error: null,
  });

  /* ── Connection Status ───────────────────────────────────────────── */
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /* ── Auto-Sync ───────────────────────────────────────────────────── */
  const [autoSyncActive, setAutoSyncActive] = useState(false);

  useEffect(() => {
    startAutoSync(30000);
    setAutoSyncActive(true);
    return () => {
      stopAutoSync();
      setAutoSyncActive(false);
    };
  }, []);

  /* ── Sync state ──────────────────────────────────────────────────── */
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState(null);
  const [lastSync, setLastSync] = useState(() =>
    localStorage.getItem('pwa_last_sync') || null
  );

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const result = await syncPendingOperations();
      const now = new Date().toISOString();
      localStorage.setItem('pwa_last_sync', now);
      setLastSync(now);
      setLastSyncResult(result);
      // Refresh queue after sync
      loadQueueItems();
    } catch {
      setLastSyncResult({ synced: 0, failed: 0, errors: [{ error: 'Sync failed' }] });
    } finally {
      setIsSyncing(false);
    }
  }, []);

  /* ── PWA Install ─────────────────────────────────────────────────── */
  const [isInstalled, setIsInstalled] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    try {
      const mq = window.matchMedia('(display-mode: standalone)');
      setIsInstalled(mq.matches);
      const handler = (e) => setIsInstalled(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } catch {
      setIsInstalled(false);
    }
  }, []);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!installPrompt) return;
    try {
      installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result.outcome === 'accepted') setIsInstalled(true);
      setInstallPrompt(null);
    } catch { /* silent */ }
  }, [installPrompt]);

  /* ── Storage Info (real) ─────────────────────────────────────────── */
  const [storageInfo, setStorageInfo] = useState({ usage: 0, quota: 0, supported: false });

  const refreshStorage = useCallback(async () => {
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const est = await navigator.storage.estimate();
        setStorageInfo({ usage: est.usage || 0, quota: est.quota || 0, supported: true });
      }
    } catch {
      setStorageInfo({ usage: 0, quota: 0, supported: false });
    }
  }, []);

  useEffect(() => { refreshStorage(); }, [refreshStorage]);

  const storagePercent = storageInfo.quota > 0
    ? Math.min((storageInfo.usage / storageInfo.quota) * 100, 100)
    : 0;

  /* ── Cache Management (real Cache API) ───────────────────────────── */
  const [cacheEntries, setCacheEntries] = useState([]);
  const [cacheLoading, setCacheLoading] = useState(false);

  const loadCacheEntries = useCallback(async () => {
    setCacheLoading(true);
    try {
      if ('caches' in window) {
        const names = await caches.keys();
        const entries = [];
        for (const name of names) {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          entries.push({ name, count: keys.length });
        }
        setCacheEntries(entries);
      }
    } catch { /* silent */ }
    setCacheLoading(false);
  }, []);

  useEffect(() => { loadCacheEntries(); }, [loadCacheEntries]);

  const handleDeleteCache = useCallback(async (name) => {
    try {
      await caches.delete(name);
      await loadCacheEntries();
      await refreshStorage();
    } catch { /* silent */ }
  }, [loadCacheEntries, refreshStorage]);

  const handleClearAllCaches = useCallback(async () => {
    try {
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
        await loadCacheEntries();
        await refreshStorage();
      }
    } catch { /* silent */ }
  }, [loadCacheEntries, refreshStorage]);

  /* ── Offline Queue (real IndexedDB) ──────────────────────────────── */
  const [queueItems, setQueueItems] = useState([]);
  const [queueLoading, setQueueLoading] = useState(false);

  const loadQueueItems = useCallback(async () => {
    setQueueLoading(true);
    try {
      const items = await getQueue();
      setQueueItems(items);
    } catch { setQueueItems([]); }
    setQueueLoading(false);
  }, []);

  useEffect(() => { loadQueueItems(); }, [loadQueueItems]);

  // Poll queue every 10s to stay fresh
  useEffect(() => {
    const interval = setInterval(loadQueueItems, 10000);
    return () => clearInterval(interval);
  }, [loadQueueItems]);

  const handleRetryItem = useCallback(async (id) => {
    await updateQueueItem(id, { status: 'pending', retries: 0 });
    loadQueueItems();
    if (navigator.onLine) {
      await syncPendingOperations();
      loadQueueItems();
    }
  }, [loadQueueItems]);

  const handleDiscardItem = useCallback(async (id) => {
    await removeQueueItem(id);
    loadQueueItems();
  }, [loadQueueItems]);

  const handleDiscardAll = useCallback(async () => {
    await clearQueue();
    loadQueueItems();
  }, [loadQueueItems]);

  /* ── SW state derived ────────────────────────────────────────────── */
  const reg = swInfo.registration;
  const swState = getSWStateLabel(reg);

  const pendingCount = queueItems.filter((i) => i.status === 'pending').length;
  const failedCount = queueItems.filter((i) => i.status === 'failed').length;

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      {/* ── Update Available Banner ──────────────────────────────────── */}
      {needRefresh && (
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sky-600">{IconAlertTriangle}</span>
            <div>
              <p className="text-sm font-semibold text-sky-800">
                Nueva version disponible
              </p>
              <p className="text-xs text-sky-600 mt-0.5">
                Hay una actualizacion lista. Recarga para obtener la ultima version de SCGMEX.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateServiceWorker(true)}
              className="inline-flex items-center gap-1.5 h-[38px] px-4 rounded-md text-sm font-medium bg-sky-600 text-white hover:bg-sky-700 transition-colors"
            >
              {IconRefresh}
              Actualizar
            </button>
            <button
              onClick={() => setNeedRefresh(false)}
              className="inline-flex items-center gap-1.5 h-[38px] px-3 rounded-md text-sm font-medium text-sky-600 bg-sky-100 hover:bg-sky-200 transition-colors"
            >
              Despues
            </button>
          </div>
        </div>
      )}

      {/* ── Offline Ready Banner ─────────────────────────────────────── */}
      {offlineReady && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-emerald-600">{IconCheckCircle}</span>
            <p className="text-sm font-medium text-emerald-700">
              SCGMEX esta listo para funcionar sin conexion.
            </p>
          </div>
          <button
            onClick={() => setOfflineReady(false)}
            className="text-emerald-400 hover:text-emerald-600 transition-colors"
          >
            {IconXCircle}
          </button>
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-text-primary">
          PWA / Modo Offline
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Estado real del Service Worker, cache del navegador y cola de sincronizacion offline
        </p>
      </div>

      {/* ── Service Worker Status + Connection Status ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Service Worker Status Card ──────────────────────────────── */}
        <div className="bg-white rounded-lg card-shadow p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-guinda/10 flex items-center justify-center text-guinda">
              {IconShield}
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-text-heading">
                Service Worker
              </h2>
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ${BADGE_VARIANT[swState.variant]}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLOR[swState.variant] || DOT_COLOR.info}`} />
                {swState.label}
              </span>
            </div>
          </div>

          <div className="space-y-2.5 text-[13px]">
            <div className="flex justify-between">
              <span className="text-text-muted">Estado de registro</span>
              <span className="text-text-heading font-medium">
                {swInfo.error
                  ? 'Error'
                  : reg
                    ? 'Registrado'
                    : 'Sin registrar'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Tipo de registro</span>
              <span className="text-text-heading font-medium">autoUpdate</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Ultima verificacion</span>
              <span className="text-text-heading font-medium">
                {formatDateTime(swInfo.lastCheck)}
              </span>
            </div>
            {swInfo.error && (
              <div className="flex justify-between">
                <span className="text-text-muted">Error</span>
                <span className="text-red-600 font-medium text-xs max-w-[200px] truncate">
                  {swInfo.error}
                </span>
              </div>
            )}
          </div>

          {reg?.waiting && (
            <button
              onClick={() => updateServiceWorker(true)}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 h-[38px] px-4 rounded-md text-sm font-medium bg-sky-600 text-white hover:bg-sky-700 transition-colors"
            >
              {IconRefresh}
              Aplicar Actualizacion
            </button>
          )}
        </div>

        {/* ── Connection Status Card ──────────────────────────────────── */}
        <div className="bg-white rounded-lg card-shadow p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
            }`}>
              {isOnline ? IconWifi : IconWifiOff}
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-text-heading">
                Estado de Conexion
              </h2>
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ${
                isOnline ? BADGE_VARIANT.success : BADGE_VARIANT.danger
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? DOT_COLOR.success : DOT_COLOR.danger}`} />
                {isOnline ? 'En Linea' : 'Sin Conexion'}
              </span>
            </div>
          </div>

          <div className="space-y-2.5 text-[13px]">
            <div className="flex justify-between">
              <span className="text-text-muted">Auto-sync</span>
              <span className={`font-medium ${autoSyncActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                {autoSyncActive ? 'Activo (30s)' : 'Inactivo'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Ultima sincronizacion</span>
              <span className="text-text-heading font-medium">
                {formatDateTime(lastSync)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Operaciones pendientes</span>
              <span className={`font-medium ${pendingCount > 0 ? 'text-amber-600' : 'text-text-heading'}`}>
                {pendingCount}
              </span>
            </div>
            {lastSyncResult && (
              <div className="flex justify-between">
                <span className="text-text-muted">Ultimo resultado</span>
                <span className="text-text-heading font-medium text-xs">
                  {lastSyncResult.synced} ok, {lastSyncResult.failed} error
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleSync}
            disabled={isSyncing}
            className={`mt-4 w-full inline-flex items-center justify-center gap-2 h-[38px] px-4 rounded-md text-sm font-medium transition-colors ${
              isSyncing
                ? 'bg-amber-50 text-amber-600 cursor-not-allowed'
                : 'bg-guinda text-white hover:bg-guinda-dark'
            }`}
          >
            <span className={isSyncing ? 'animate-spin' : ''}>{IconSync}</span>
            {isSyncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
          </button>
        </div>
      </div>

      {/* ── Install + Storage row ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── PWA Install Section ─────────────────────────────────────── */}
        <div className="bg-white rounded-lg card-shadow">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-[15px] font-semibold text-text-heading flex items-center gap-2">
              {IconSmartphone}
              Instalacion PWA
            </h2>
          </div>
          <div className="p-5">
            {isInstalled ? (
              <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg">
                <span className="text-emerald-600 flex-shrink-0">{IconCheckCircle}</span>
                <div>
                  <p className="text-sm font-medium text-emerald-700">
                    Aplicacion instalada
                  </p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    SCGMEX esta instalada como aplicacion independiente en este dispositivo.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-[13px] text-text-muted leading-relaxed">
                  Instala SCGMEX como aplicacion en tu dispositivo para acceder
                  rapidamente desde tu escritorio o pantalla de inicio, incluso
                  cuando no tengas conexion a internet.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleInstall}
                    disabled={!installPrompt}
                    className={`inline-flex items-center gap-2 h-[38px] px-4 rounded-md text-sm font-medium transition-colors ${
                      installPrompt
                        ? 'bg-guinda text-white hover:bg-guinda-dark'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {IconDownload}
                    Instalar Aplicacion
                  </button>
                  {!installPrompt && (
                    <p className="text-xs text-text-muted self-center">
                      La instalacion no esta disponible en este navegador o ya fue instalada.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Storage Info ────────────────────────────────────────────── */}
        <div className="bg-white rounded-lg card-shadow">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-[15px] font-semibold text-text-heading flex items-center gap-2">
              {IconHardDrive}
              Almacenamiento del Navegador
            </h2>
          </div>
          <div className="p-5">
            {storageInfo.supported ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] text-text-primary">Espacio utilizado</span>
                    <span className="text-[13px] font-semibold text-text-heading">
                      {formatBytes(storageInfo.usage)} / {formatBytes(storageInfo.quota)}
                    </span>
                  </div>
                  <div className="w-full bg-bg-main rounded-full h-[8px]">
                    <div
                      className={`h-[8px] rounded-full transition-all duration-500 ${
                        storagePercent > 80 ? 'bg-red-500' : storagePercent > 50 ? 'bg-amber-500' : 'bg-guinda'
                      }`}
                      style={{ width: `${storagePercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-text-muted mt-1.5">
                    {storagePercent.toFixed(2)}% del almacenamiento disponible utilizado
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-bg-main rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-text-heading">{formatBytes(storageInfo.usage)}</p>
                    <p className="text-xs text-text-muted">Usado</p>
                  </div>
                  <div className="bg-bg-main rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-text-heading">{formatBytes(storageInfo.quota - storageInfo.usage)}</p>
                    <p className="text-xs text-text-muted">Disponible</p>
                  </div>
                </div>
                <button
                  onClick={async () => { await handleClearAllCaches(); await refreshStorage(); }}
                  className="inline-flex items-center gap-2 h-[38px] px-4 rounded-md text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  {IconTrash}
                  Liberar Espacio
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-text-muted">
                  La API de Storage Estimation no esta disponible en este navegador.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Cache Management (real Cache API) ────────────────────────── */}
      <div className="bg-white rounded-lg card-shadow">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-text-heading flex items-center gap-2">
            {IconDatabase}
            Cache del Service Worker
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={loadCacheEntries}
              disabled={cacheLoading}
              className="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-md text-xs font-medium text-text-muted bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className={cacheLoading ? 'animate-spin' : ''}>{IconRefresh}</span>
              Recargar
            </button>
            <button
              onClick={handleClearAllCaches}
              disabled={cacheEntries.length === 0}
              className={`inline-flex items-center gap-1.5 h-[34px] px-3 rounded-md text-xs font-medium transition-colors ${
                cacheEntries.length > 0
                  ? 'text-red-600 bg-red-50 hover:bg-red-100'
                  : 'text-gray-300 bg-gray-50 cursor-not-allowed'
              }`}
            >
              {IconTrash}
              Limpiar Todo
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {cacheEntries.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 text-gray-400">
                {IconDatabase}
              </div>
              <p className="text-sm font-medium text-text-heading">Sin caches activos</p>
              <p className="text-xs text-text-muted mt-1">
                El Service Worker creara caches automaticamente al navegar.
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-[#f9fafb]">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Nombre del Cache
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Entradas
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {cacheEntries.map((cache) => (
                  <tr
                    key={cache.name}
                    className="border-b border-border/50 last:border-0 hover:bg-bg-hover transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <p className="text-[14px] font-medium text-text-heading truncate max-w-xs">
                        {cache.name}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${
                        cache.count > 0 ? BADGE_VARIANT.success : BADGE_VARIANT.default
                      }`}>
                        {cache.count} {cache.count === 1 ? 'recurso' : 'recursos'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => handleDeleteCache(cache.name)}
                        className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                      >
                        {IconTrash}
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Offline Queue (real IndexedDB) ───────────────────────────── */}
      <div className="bg-white rounded-lg card-shadow">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-text-heading flex items-center gap-2">
            {IconClock}
            Cola de Operaciones Offline
            {pendingCount > 0 && (
              <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${BADGE_VARIANT.warning}`}>
                {pendingCount} pendientes
              </span>
            )}
            {failedCount > 0 && (
              <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${BADGE_VARIANT.danger}`}>
                {failedCount} fallidas
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={loadQueueItems}
              disabled={queueLoading}
              className="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-md text-xs font-medium text-text-muted bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className={queueLoading ? 'animate-spin' : ''}>{IconRefresh}</span>
              Recargar
            </button>
            {queueItems.length > 0 && (
              <button
                onClick={handleDiscardAll}
                className="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-md text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
              >
                {IconTrash}
                Descartar Todo
              </button>
            )}
          </div>
        </div>
        <div className="p-5">
          {queueItems.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                <span className="text-emerald-600">{IconCheckCircle}</span>
              </div>
              <p className="text-sm font-medium text-text-heading">
                No hay operaciones pendientes
              </p>
              <p className="text-xs text-text-muted mt-1">
                Todas las operaciones se han sincronizado correctamente con el servidor.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f9fafb]">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Tabla
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Reintentos
                    </th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {queueItems.map((item) => {
                    const statusBadge =
                      item.status === 'pending' ? BADGE_VARIANT.warning :
                      item.status === 'syncing' ? BADGE_VARIANT.info :
                      item.status === 'failed' ? BADGE_VARIANT.danger :
                      BADGE_VARIANT.default;

                    const statusLabel =
                      item.status === 'pending' ? 'Pendiente' :
                      item.status === 'syncing' ? 'Sincronizando' :
                      item.status === 'failed' ? 'Fallido' :
                      item.status;

                    const typeLabel =
                      item.type === 'create' ? 'Crear' :
                      item.type === 'update' ? 'Actualizar' :
                      item.type === 'delete' ? 'Eliminar' :
                      item.type;

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-border/50 last:border-0 hover:bg-bg-hover transition-colors"
                      >
                        <td className="px-4 py-3 text-[13px] font-mono text-text-muted">
                          #{item.id}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                            item.type === 'create' ? BADGE_VARIANT.success :
                            item.type === 'update' ? BADGE_VARIANT.info :
                            item.type === 'delete' ? BADGE_VARIANT.danger :
                            BADGE_VARIANT.default
                          }`}>
                            {typeLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[13px] font-medium text-text-heading">
                          {item.table || '--'}
                        </td>
                        <td className="px-4 py-3 text-[13px] text-text-muted font-mono">
                          {formatDateTime(item.timestamp)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${statusBadge}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-[13px] text-text-muted">
                          {item.retries || 0} / {item.maxRetries || 3}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleRetryItem(item.id)}
                              disabled={item.status === 'syncing'}
                              className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors ${
                                item.status === 'syncing'
                                  ? 'text-gray-300 bg-gray-50 cursor-not-allowed'
                                  : 'text-guinda bg-guinda/10 hover:bg-guinda/20'
                              }`}
                            >
                              {IconRefresh}
                              Reintentar
                            </button>
                            <button
                              onClick={() => handleDiscardItem(item.id)}
                              disabled={item.status === 'syncing'}
                              className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors ${
                                item.status === 'syncing'
                                  ? 'text-gray-300 bg-gray-50 cursor-not-allowed'
                                  : 'text-red-600 bg-red-50 hover:bg-red-100'
                              }`}
                            >
                              {IconXCircle}
                              Descartar
                            </button>
                          </div>
                          {item.error && (
                            <p className="text-[11px] text-red-500 mt-1 max-w-[200px] truncate mx-auto">
                              {item.error}
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
