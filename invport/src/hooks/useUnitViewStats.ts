'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetchJson } from '@/lib/apiClient';
import {
  parseUnitViewStatsResponse,
  parseUnitViewSummary,
  type UnitViewStats,
  type UnitViewStatsResponse,
  type UnitViewSummary,
} from '@/lib/unitViewStats';

const AUTO_REFRESH_MS = 5 * 60 * 1000;

interface RemoteState<T> {
  data: T | null;
  error: string | null;
  /** True only until the first response (success or failure) arrives. */
  isLoading: boolean;
  /** True whenever a request is in flight, including manual and background refreshes. */
  isRefreshing: boolean;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

function useRemote<T>(endpoint: string | null, parse: (value: unknown) => T): RemoteState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(endpoint !== null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    if (!endpoint) return;
    const id = ++requestId.current;
    setIsRefreshing(true);
    try {
      const result = parse(await apiFetchJson<unknown>(endpoint));
      if (id !== requestId.current) return;
      setData(result);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      if (id !== requestId.current) return;
      const message = err instanceof Error ? err.message : String(err);
      setError(/\b404\b/.test(message) ? 'Unit not found' : 'Unable to load view stats');
      console.error(`❌ [Unit Views] ${endpoint} failed:`, err);
    } finally {
      if (id === requestId.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [endpoint, parse]);

  const [trackedEndpoint, setTrackedEndpoint] = useState(endpoint);
  if (trackedEndpoint !== endpoint) {
    setTrackedEndpoint(endpoint);
    setData(null);
    setError(null);
    setLastUpdated(null);
    setIsLoading(endpoint !== null);
  }

  useEffect(() => {
    if (!endpoint) return;
    const requests = requestId;
    const kickoff = window.setTimeout(() => void refresh(), 0);
    const timer = window.setInterval(() => void refresh(), AUTO_REFRESH_MS);
    return () => {
      window.clearTimeout(kickoff);
      window.clearInterval(timer);
      requests.current++;
    };
  }, [endpoint, refresh]);

  return { data, error, isLoading, isRefreshing, lastUpdated, refresh };
}

/** GET /api/unit-views/summary — all viewed units plus totals, for the inventory screen. */
export function useUnitViewSummary(): RemoteState<UnitViewSummary> & { byUnitId: Map<number, UnitViewStats> } {
  const state = useRemote('/unit-views/summary', parseUnitViewSummary);
  const byUnitId = useMemo(
    () => new Map((state.data?.units ?? []).map((u) => [u.unitId, u])),
    [state.data],
  );
  return { ...state, byUnitId };
}

/** GET /api/units/{unitId}/view-stats — month/lifetime views for one unit. */
export function useUnitViewStats(unitId: number | null | undefined): RemoteState<UnitViewStatsResponse> {
  const valid = typeof unitId === 'number' && Number.isInteger(unitId) && unitId > 0;
  return useRemote(valid ? `/units/${unitId}/view-stats` : null, parseUnitViewStatsResponse);
}
