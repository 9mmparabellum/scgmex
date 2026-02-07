import { useState, useEffect, useCallback } from 'react';
import { ESTADOS_PWA, TIPOS_CACHE } from '../../config/constants';

/* ── Badge variant map ──────────────────────────────────────────────── */

const BADGE_VARIANT = {
  primary: 'bg-guinda/10 text-guinda',
  success: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
  danger: 'bg-red-50 text-red-600',
  info: 'bg-sky-50 text-sky-600',
  default: 'bg-gray-100 text-gray-600',
};

/* ── Dot colors for connection status ───────────────────────────────── */

const DOT_COLOR = {
  success: 'bg-emerald-500',
  danger: 'bg-red-500',
  warning: 'bg-amber-500',
};

/* ── Simulated cache size data ──────────────────────────────────────── */

const CACHE_DESCRIPTIONS = {
  catalogo: 'Plan de cuentas, clasificadores y matrices',
  poliza: 'Polizas contables y movimientos',
  presupuesto: 'Partidas, momentos y asignaciones',
  reporte: 'Estados financieros y reportes generados',
  configuracion: 'Entes, ejercicios y periodos contables',
};

const CACHE_SIZES = {
  catalogo: '2.4 MB',
  poliza: '5.1 MB',
  presupuesto: '1.8 MB',
  reporte: '3.2 MB',
  configuracion: '0.6 MB',
};

/* ── Helpers ────────────────────────────────────────────────────────── */

function formatDateTime(date) {
  if (!date) return '--';
  const d = new Date(date);
  return d.toLocaleString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded — silently fail */
  }
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

/* ── Component ──────────────────────────────────────────────────────── */

export default function PWAConfig() {
  /* ── Connection Status ────────────────────────────────────────────── */
  const [isOnline, setIsOnline] = useState(() => {
    try { return navigator.onLine; } catch { return true; }
  });
  const [connectionStatus, setConnectionStatus] = useState(() =>
    navigator.onLine ? 'online' : 'offline'
  );
  const [lastSync, setLastSync] = useState(() =>
    localStorage.getItem('pwa_last_sync') || null
  );

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); setConnectionStatus('online'); };
    const handleOffline = () => { setIsOnline(false); setConnectionStatus('offline'); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSync = useCallback(() => {
    setConnectionStatus('sincronizando');
    setTimeout(() => {
      const now = new Date().toISOString();
      localStorage.setItem('pwa_last_sync', now);
      setLastSync(now);
      setConnectionStatus(navigator.onLine ? 'online' : 'offline');
    }, 2000);
  }, []);

  /* ── PWA Install ──────────────────────────────────────────────────── */
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
      if (result.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setInstallPrompt(null);
    } catch {
      /* install failed silently */
    }
  }, [installPrompt]);

  /* ── Cache Management ─────────────────────────────────────────────── */
  const [cacheConfig, setCacheConfig] = useState(() =>
    loadJSON('pwa_cache_config', {
      catalogo: true,
      poliza: true,
      presupuesto: false,
      reporte: false,
      configuracion: true,
    })
  );

  const toggleCache = useCallback((key) => {
    setCacheConfig((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveJSON('pwa_cache_config', next);
      return next;
    });
  }, []);

  const clearCacheItem = useCallback((key) => {
    try {
      localStorage.removeItem(`pwa_cache_${key}`);
    } catch { /* silent */ }
    setCacheConfig((prev) => {
      const next = { ...prev, [key]: false };
      saveJSON('pwa_cache_config', next);
      return next;
    });
  }, []);

  const clearAllCache = useCallback(() => {
    const keys = Object.keys(TIPOS_CACHE);
    keys.forEach((k) => {
      try { localStorage.removeItem(`pwa_cache_${k}`); } catch { /* silent */ }
    });
    const next = keys.reduce((acc, k) => ({ ...acc, [k]: false }), {});
    setCacheConfig(next);
    saveJSON('pwa_cache_config', next);
  }, []);

  /* ── Storage Info ─────────────────────────────────────────────────── */
  const [storageInfo, setStorageInfo] = useState({ usage: 0, quota: 0, supported: false });

  useEffect(() => {
    async function fetchStorage() {
      try {
        if (navigator.storage && navigator.storage.estimate) {
          const est = await navigator.storage.estimate();
          setStorageInfo({
            usage: est.usage || 0,
            quota: est.quota || 0,
            supported: true,
          });
        }
      } catch {
        setStorageInfo({ usage: 0, quota: 0, supported: false });
      }
    }
    fetchStorage();
  }, []);

  const storagePercent = storageInfo.quota > 0
    ? Math.min((storageInfo.usage / storageInfo.quota) * 100, 100)
    : 0;

  const handleFreeSpace = useCallback(() => {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('pwa_cache_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      clearAllCache();
      // Re-estimate storage
      if (navigator.storage && navigator.storage.estimate) {
        navigator.storage.estimate().then((est) => {
          setStorageInfo({
            usage: est.usage || 0,
            quota: est.quota || 0,
            supported: true,
          });
        });
      }
    } catch {
      /* silent */
    }
  }, [clearAllCache]);

  /* ── Offline Queue ────────────────────────────────────────────────── */
  const [offlineQueue, setOfflineQueue] = useState(() =>
    loadJSON('offline_queue', [])
  );

  const retryOperation = useCallback((index) => {
    setOfflineQueue((prev) => {
      const next = prev.map((item, i) =>
        i === index ? { ...item, estado: 'reintentando' } : item
      );
      // Simulate retry
      setTimeout(() => {
        setOfflineQueue((current) => {
          const updated = current.filter((_, i) => i !== index);
          saveJSON('offline_queue', updated);
          return updated;
        });
      }, 1500);
      return next;
    });
  }, []);

  const discardOperation = useCallback((index) => {
    setOfflineQueue((prev) => {
      const next = prev.filter((_, i) => i !== index);
      saveJSON('offline_queue', next);
      return next;
    });
  }, []);

  const discardAllOperations = useCallback(() => {
    setOfflineQueue([]);
    saveJSON('offline_queue', []);
  }, []);

  /* ── Render ───────────────────────────────────────────────────────── */

  const estadoPWA = ESTADOS_PWA[connectionStatus] || ESTADOS_PWA.online;
  const badgeClass = BADGE_VARIANT[estadoPWA.variant] || BADGE_VARIANT.default;
  const dotClass = DOT_COLOR[estadoPWA.variant] || DOT_COLOR.success;
  const isSyncing = connectionStatus === 'sincronizando';

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-text-primary">
          PWA / Modo Offline
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Configuracion de Progressive Web App y gestion de datos en cache
        </p>
      </div>

      {/* ── Connection Status Card ────────────────────────────────────── */}
      <div className="bg-white rounded-lg card-shadow p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
            }`}>
              {isOnline ? IconWifi : IconWifiOff}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-[15px] font-semibold text-text-heading">
                  Estado de Conexion
                </h2>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${badgeClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${dotClass} ${isSyncing ? 'animate-pulse' : ''}`} />
                  {estadoPWA.label}
                </span>
              </div>
              <p className="text-[13px] text-text-muted mt-1 flex items-center gap-1.5">
                {IconClock}
                Ultima sincronizacion: {lastSync ? formatDateTime(lastSync) : 'Nunca'}
              </p>
            </div>
          </div>

          <button
            onClick={handleSync}
            disabled={isSyncing}
            className={`inline-flex items-center gap-2 h-[38px] px-4 rounded-md text-sm font-medium transition-colors ${
              isSyncing
                ? 'bg-amber-50 text-amber-600 cursor-not-allowed'
                : 'bg-guinda text-white hover:bg-guinda-dark'
            }`}
          >
            <span className={isSyncing ? 'animate-spin' : ''}>
              {IconSync}
            </span>
            {isSyncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
          </button>
        </div>
      </div>

      {/* ── Two-column grid: Install + Storage ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── PWA Install Section ──────────────────────────────────────── */}
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

        {/* ── Storage Info ─────────────────────────────────────────────── */}
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
                    {storagePercent.toFixed(1)}% del almacenamiento disponible utilizado
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-bg-main rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-text-heading">
                      {formatBytes(storageInfo.usage)}
                    </p>
                    <p className="text-xs text-text-muted">Usado</p>
                  </div>
                  <div className="bg-bg-main rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-text-heading">
                      {formatBytes(storageInfo.quota - storageInfo.usage)}
                    </p>
                    <p className="text-xs text-text-muted">Disponible</p>
                  </div>
                </div>
                <button
                  onClick={handleFreeSpace}
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

      {/* ── Cache Management ──────────────────────────────────────────── */}
      <div className="bg-white rounded-lg card-shadow">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-text-heading flex items-center gap-2">
            {IconDatabase}
            Gestion de Cache
          </h2>
          <button
            onClick={clearAllCache}
            className="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-md text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
          >
            {IconTrash}
            Limpiar Todo
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f9fafb]">
                <th className="px-5 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Descripcion
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Tamano Est.
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Habilitado
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(TIPOS_CACHE).map(([key, label]) => {
                const enabled = cacheConfig[key] ?? false;
                return (
                  <tr
                    key={key}
                    className="border-b border-border/50 last:border-0 hover:bg-bg-hover transition-colors"
                  >
                    <td className="px-5 py-3.5 text-[14px] font-medium text-text-heading">
                      {label}
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-text-muted">
                      {CACHE_DESCRIPTIONS[key] || '--'}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${
                        enabled ? BADGE_VARIANT.success : BADGE_VARIANT.default
                      }`}>
                        {enabled ? 'En cache' : 'Sin cache'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center text-[13px] font-mono text-text-muted">
                      {enabled ? CACHE_SIZES[key] : '--'}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => toggleCache(key)}
                        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:ring-offset-2 ${
                          enabled ? 'bg-guinda' : 'bg-gray-200'
                        }`}
                        role="switch"
                        aria-checked={enabled}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out mt-0.5 ${
                            enabled ? 'translate-x-4 ml-0.5' : 'translate-x-0 ml-0.5'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => clearCacheItem(key)}
                        disabled={!enabled}
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors ${
                          enabled
                            ? 'text-red-600 bg-red-50 hover:bg-red-100'
                            : 'text-gray-300 bg-gray-50 cursor-not-allowed'
                        }`}
                      >
                        {IconTrash}
                        Limpiar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Offline Data Queue ────────────────────────────────────────── */}
      <div className="bg-white rounded-lg card-shadow">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-text-heading flex items-center gap-2">
            {IconClock}
            Cola de Operaciones Offline
            {offlineQueue.length > 0 && (
              <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${BADGE_VARIANT.warning}`}>
                {offlineQueue.length}
              </span>
            )}
          </h2>
          {offlineQueue.length > 0 && (
            <button
              onClick={discardAllOperations}
              className="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-md text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
            >
              {IconTrash}
              Descartar Todo
            </button>
          )}
        </div>
        <div className="p-5">
          {offlineQueue.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                <span className="text-emerald-600">{IconCheckCircle}</span>
              </div>
              <p className="text-sm font-medium text-text-heading">
                No hay operaciones pendientes
              </p>
              <p className="text-xs text-text-muted mt-1">
                Todas las operaciones se han sincronizado correctamente.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f9fafb]">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Descripcion
                    </th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {offlineQueue.map((op, i) => (
                    <tr
                      key={i}
                      className="border-b border-border/50 last:border-0 hover:bg-bg-hover transition-colors"
                    >
                      <td className="px-4 py-3 text-[13px] font-medium text-text-heading">
                        {op.tipo || 'Operacion'}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-text-muted font-mono">
                        {formatDateTime(op.fecha)}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-text-primary">
                        {op.descripcion || '--'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${
                          op.estado === 'reintentando'
                            ? BADGE_VARIANT.warning
                            : op.estado === 'error'
                              ? BADGE_VARIANT.danger
                              : BADGE_VARIANT.info
                        }`}>
                          {op.estado === 'reintentando' ? 'Reintentando...' : op.estado === 'error' ? 'Error' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => retryOperation(i)}
                            disabled={op.estado === 'reintentando'}
                            className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors ${
                              op.estado === 'reintentando'
                                ? 'text-gray-300 bg-gray-50 cursor-not-allowed'
                                : 'text-guinda bg-guinda/10 hover:bg-guinda/20'
                            }`}
                          >
                            {IconRefresh}
                            Reintentar
                          </button>
                          <button
                            onClick={() => discardOperation(i)}
                            disabled={op.estado === 'reintentando'}
                            className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors ${
                              op.estado === 'reintentando'
                                ? 'text-gray-300 bg-gray-50 cursor-not-allowed'
                                : 'text-red-600 bg-red-50 hover:bg-red-100'
                            }`}
                          >
                            {IconXCircle}
                            Descartar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
