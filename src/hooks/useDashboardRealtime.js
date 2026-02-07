/**
 * useDashboardRealtime.js
 * ---------------------------------------------------------------------------
 * React Query hook that fetches real-time KPIs for the Dashboard Realtime
 * module. Auto-refreshes every 30 seconds for a "live" feel.
 * ---------------------------------------------------------------------------
 */

import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../stores/appStore';
import { fetchKPIsRealtime } from '../services/dashboardRealtimeService';

export function useKPIsRealtime() {
  const { entePublico, ejercicioFiscal } = useAppStore();

  return useQuery({
    queryKey: ['kpis_realtime', entePublico?.id, ejercicioFiscal?.id],
    queryFn: () => fetchKPIsRealtime(entePublico.id, ejercicioFiscal.id),
    enabled: !!entePublico?.id && !!ejercicioFiscal?.id,
    refetchInterval: 30000,
  });
}
